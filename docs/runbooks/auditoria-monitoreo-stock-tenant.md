# Runbook de Auditoria: Monitoreo de Materias Primas y Stock

Este documento sirve para auditar cualquier tenant y validar que:

- El descuento de materias primas por venta funciona correctamente.
- El KPI de "Stock monitoreado" se interpreta correctamente.
- No existan falsos positivos por pedidos en borrador (`EDIT`) o cancelados.

---

## Objetivo

Verificar salud del sistema de inventario en dos capas:

1. **Materias primas (ingredientes)**: control y descuento en `ingredientes` + `movimientos_ingredientes`.
2. **Stock monitoreado KPI**: estado de items en `inventario` (no confundir con ingredientes).

---

## Tenant a auditar

Reemplazar en todas las queries:

```sql
'<TENANT_ID>'
```

Ejemplo real usado en esta auditoria:

```sql
'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
```

---

## 1) Resumen de ingredientes monitoreados

```sql
SELECT
  COUNT(*) FILTER (WHERE activo = true) AS total_activos,
  COUNT(*) FILTER (WHERE activo = true AND controlar_stock = true) AS monitoreados,
  COUNT(*) FILTER (WHERE activo = true AND controlar_stock = false) AS no_monitoreados
FROM ingredientes
WHERE tenant_id = '<TENANT_ID>';
```

### Criterio sano

- `no_monitoreados = 0` para ingredientes que deben descontar automáticamente.

---

## 2) Detalle de ingredientes y uso en receta

```sql
SELECT
  i.id,
  i.nombre,
  i.slug,
  i.activo,
  i.controlar_stock,
  i.stock_actual,
  i.stock_minimo,
  i.unidad,
  CASE WHEN rp.ingrediente_id IS NOT NULL THEN true ELSE false END AS usado_en_receta
FROM ingredientes i
LEFT JOIN (
  SELECT DISTINCT ingrediente_id
  FROM recetas_producto
  WHERE tenant_id = '<TENANT_ID>'
) rp ON rp.ingrediente_id = i.id
WHERE i.tenant_id = '<TENANT_ID>'
  AND i.activo = true
ORDER BY i.controlar_stock ASC, i.nombre;
```

### Uso

- Permite detectar ingredientes activos que no participan en recetas.
- Permite revisar umbrales de alerta (`stock_minimo`) y unidades.

---

## 3) Ingredientes usados en receta pero no monitoreados

```sql
SELECT DISTINCT
  i.id,
  i.nombre,
  i.slug,
  i.controlar_stock,
  i.activo
FROM recetas_producto rp
JOIN ingredientes i ON i.id = rp.ingrediente_id
WHERE rp.tenant_id = '<TENANT_ID>'
  AND i.tenant_id = '<TENANT_ID>'
  AND i.activo = true
  AND COALESCE(i.controlar_stock, false) = false
ORDER BY i.nombre;
```

### Criterio sano

- Debe devolver **0 filas**.

---

## 4) Ingredientes monitoreados que no están en recetas

```sql
SELECT
  i.id,
  i.nombre,
  i.slug,
  i.controlar_stock,
  i.stock_actual,
  i.stock_minimo
FROM ingredientes i
LEFT JOIN recetas_producto rp
  ON rp.ingrediente_id = i.id
 AND rp.tenant_id = i.tenant_id
WHERE i.tenant_id = '<TENANT_ID>'
  AND i.activo = true
  AND i.controlar_stock = true
  AND rp.id IS NULL
ORDER BY i.nombre;
```

### Interpretacion

- No necesariamente es error.
- Normalmente aparecen bebidas, empaques u otros items no recetados.

---

## 5) Auditoria de descuentos faltantes por pedido (version correcta)

> Importante: filtrar pedidos facturados y no cancelados para evitar falsos positivos.

```sql
WITH pedidos_con_items_receta AS (
  SELECT DISTINCT p.id AS pedido_id, p.numero_pedido, p.created_at
  FROM pedidos p
  JOIN items_pedido ip ON ip.pedido_id = p.id
  JOIN productos pr ON pr.id = ip.producto_id
  WHERE p.tenant_id = '<TENANT_ID>'
    AND p.created_at >= NOW() - INTERVAL '14 days'
    AND COALESCE(pr.tiene_receta, true) = true
    AND p.estado_pedido = 'FACT'
    AND p.estado <> 'cancelado'
),
movs_salida AS (
  SELECT DISTINCT pedido_id
  FROM movimientos_ingredientes
  WHERE tenant_id = '<TENANT_ID>'
    AND tipo = 'salida'
    AND pedido_id IS NOT NULL
)
SELECT pcr.*
FROM pedidos_con_items_receta pcr
LEFT JOIN movs_salida ms ON ms.pedido_id = pcr.pedido_id
WHERE ms.pedido_id IS NULL
ORDER BY pcr.created_at DESC;
```

### Criterio sano

- Debe devolver **0 filas**.
- Si devuelve filas, auditar pedido por pedido.

---

## 6) Resumen diario de movimientos de salida de ingredientes

```sql
SELECT
  DATE(created_at) AS fecha,
  COUNT(*) AS movimientos_salida,
  COUNT(DISTINCT pedido_id) AS pedidos_afectados,
  SUM(cantidad) AS cantidad_total_registrada
FROM movimientos_ingredientes
WHERE tenant_id = '<TENANT_ID>'
  AND tipo = 'salida'
  AND created_at >= NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

### Uso

- Validar que exista actividad diaria de descuentos donde hubo ventas.

---

## 7) Reproducir KPI "Stock monitoreado" (Dashboard)

Este KPI usa `inventario`, no `ingredientes`.

```sql
WITH inv AS (
  SELECT stock_actual, stock_minimo
  FROM inventario
  WHERE tenant_id = '<TENANT_ID>'
)
SELECT
  COUNT(*) AS total_inventory_items,
  COUNT(*) FILTER (WHERE stock_actual <= stock_minimo) AS low_stock_count,
  (COUNT(*) - COUNT(*) FILTER (WHERE stock_actual <= stock_minimo)) AS stock_ok_count,
  CONCAT(
    (COUNT(*) - COUNT(*) FILTER (WHERE stock_actual <= stock_minimo)),
    '/',
    COUNT(*)
  ) AS kpi_like_ui
FROM inv;
```

### Interpretacion

- `kpi_like_ui` replica exactamente el formato visto en dashboard (ej. `20/29`).
- No representa "ingredientes monitoreados", representa "items de inventario no bajo minimo".

---

## Protocolo para investigar un pedido puntual sin movimientos

Si la query 5 arroja un pedido:

### A) Estado del pedido

```sql
SELECT id, numero_pedido, estado, estado_pedido, created_at, updated_at
FROM pedidos
WHERE id = '<PEDIDO_ID>';
```

### B) Items y flag de receta

```sql
SELECT
  ip.id AS item_pedido_id,
  ip.producto_id,
  ip.producto_nombre,
  ip.cantidad,
  p.tiene_receta
FROM items_pedido ip
LEFT JOIN productos p ON p.id = ip.producto_id
WHERE ip.pedido_id = '<PEDIDO_ID>';
```

### C) Receta asociada a los productos del pedido

```sql
SELECT
  rp.producto_id,
  pr.nombre AS producto_nombre,
  rp.ingrediente_id,
  i.nombre AS ingrediente_nombre,
  i.controlar_stock,
  rp.cantidad,
  rp.unidad
FROM recetas_producto rp
JOIN productos pr ON pr.id = rp.producto_id
JOIN ingredientes i ON i.id = rp.ingrediente_id
WHERE rp.tenant_id = '<TENANT_ID>'
  AND rp.producto_id IN (
    SELECT DISTINCT producto_id
    FROM items_pedido
    WHERE pedido_id = '<PEDIDO_ID>'
      AND producto_id IS NOT NULL
  )
ORDER BY pr.nombre, i.nombre;
```

### D) Movimientos asociados al pedido

```sql
SELECT 'mov_ingredientes' AS origen, mi.created_at, mi.tipo, mi.cantidad, mi.motivo
FROM movimientos_ingredientes mi
WHERE mi.pedido_id = '<PEDIDO_ID>'

UNION ALL

SELECT 'mov_inventario' AS origen, mv.created_at, mv.tipo, mv.cantidad, mv.motivo
FROM movimientos_inventario mv
WHERE mv.pedido_id = '<PEDIDO_ID>'
ORDER BY created_at;
```

### Regla de interpretacion clave

- Si el pedido está en `estado_pedido = 'EDIT'`, es normal que no tenga descuentos.
- Para auditoria de consumo real usar solo `estado_pedido = 'FACT'` y no cancelados.

---

## Hallazgos del caso real auditado

Tenant auditado: `fe44f26a-0377-41f7-9e75-854d0e9dbd5c`

- Ingredientes activos: `34`
- Ingredientes monitoreados: `34`
- Ingredientes usados en receta no monitoreados: `0`
- KPI dashboard replicado: `20/29` (sobre `inventario`)
- Un pedido detectado sin movimiento fue `#69`, pero estaba en `EDIT` (borrador), por lo tanto **comportamiento esperado**.

---

## Checklist rapido de salud

- [ ] Query 1 con `no_monitoreados = 0` para insumos recetados.
- [ ] Query 3 sin filas.
- [ ] Query 5 (version corregida) sin filas.
- [ ] Query 7 coincide con el KPI visual del dashboard.
- [ ] Cualquier caso residual se valida con protocolo de pedido puntual.

