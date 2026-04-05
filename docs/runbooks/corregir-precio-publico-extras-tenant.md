# Runbook: corregir `precio_publico` de materias primas (extras en POS)

## Contexto

En Lomiteria, la columna `ingredientes.precio_publico` es el **recargo en guaraníes que cobra el POS por cada incremento “+1”** de un extra en el carrito (productos con receta). No existe en el esquema actual una columna separada “precio de compra”; lo que se guarda en `precio_publico` es exactamente lo que usa el POS.

Un error frecuente al dar de alta un tenant es cargar en ese campo el **costo de compra por volumen mayor** (por ejemplo, el precio de **1 kg** o **1 L** de un insumo) pensando que era “precio de compra”. El sistema interpreta ese número como **precio por clic de extra**, lo que infla cobros (ej. ~25.000 Gs por un extra de queso).

**Efecto en pedidos ya emitidos:** los totales quedaron guardados en `items_pedido` / `pedidos`. Corregir `precio_publico` **solo cambia ventas futuras**; no recalcula históricos.

**Inventario:** el descuento de stock por extras usa las cantidades de receta y los “clics” de extra según la lógica en código; ajustar precios en BD **no altera** automáticamente reglas de gramos por extra. Si además necesitás alinear stock con porciones, revisá recetas y política de negocio aparte.

### Política por bandas (tier estándar vs proteína)

Migración: [`database/25_extras_tipo_recargo_tenant.sql`](../../database/25_extras_tipo_recargo_tenant.sql).

- `ingredientes.tipo_recargo_extra`: `estandar` | `proteina` | `NULL`. Con `NULL`, el POS usa solo `precio_publico` más el redondeo opcional (`NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_*`).
- `tenants.extra_precio_min_estandar`, `extra_precio_max_estandar`, `extra_precio_min_proteina`: límites por local (valores por defecto típicos 2.000 / 3.000 / 6.000 Gs).

El tier se asigna desde el admin al habilitar “extra en carrito” (alta de materia prima o carga de stock), o con `UPDATE` en SQL. Consulta de auditoría: [`database/queries/auditar_precios_extras_tenant.sql`](../../database/queries/auditar_precios_extras_tenant.sql).

---

## Tenant de referencia (Atlas Burger)

| Campo | Valor |
|--------|--------|
| `tenant_id` | `fe44f26a-0377-41f7-9e75-854d0e9dbd5c` |
| Nombre | Atlas Burger |
| Slug | `atlas-burger` |

Sustituí este UUID en los scripts si corregís **otro** tenant.

---

## Paso 0 — Antes de tocar datos

1. Ejecutá siempre los `SELECT` de inventario y guardá el resultado (CSV o copia).
2. En producción, seguí la política de backup de tu equipo (export de tabla o snapshot).
3. Los `UPDATE` deben incluir **`tenant_id`** en el `WHERE` para no afectar otros negocios.

---

## Paso 1 — Listar todas las materias primas del tenant

```sql
SELECT
  id,
  slug,
  nombre,
  unidad,
  tipo_inventario,
  precio_publico,
  permite_extra_en_carrito,
  activo,
  stock_actual,
  stock_minimo,
  updated_at
FROM ingredientes
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
ORDER BY nombre;
```

---

## Paso 2 — Priorizar las que impactan extras en carrito

```sql
SELECT
  id,
  slug,
  nombre,
  unidad,
  precio_publico,
  stock_actual
FROM ingredientes
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND activo = true
  AND permite_extra_en_carrito = true
ORDER BY precio_publico DESC NULLS LAST, nombre;
```

---

## Paso 2b — Heurística de filas “sospechosas” (revisión manual)

No hay valor universal: un extra puede ser 2.000 o 15.000 Gs. Usá un umbral solo como **primer filtro** (ajustá el número según tu mercado):

```sql
SELECT id, slug, nombre, unidad, precio_publico
FROM ingredientes
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND precio_publico > 10000
ORDER BY precio_publico DESC;
```

Marcá fila por fila cuáles son precios realistas de extra y cuáles parecen “precio de bolsa/kg/litro”.

---

## Paso 3 — Fórmulas de corrección (negocio + matemática)

Definí con el local **cuántos gramos (o ml) representa un “+1” de extra** para cada insumo fraccionable. Eso es decisión comercial, no la deduce solo la base.

### Si el valor mal cargado era precio por **1 kg** y la unidad del ingrediente es **g**

- Precio por gramo: `precio_por_g = precio_mal_cargado / 1000`
- Nuevo precio público (recargo por extra):  
  `precio_publico_nuevo = precio_por_g * gramos_por_extra`

Ejemplo: mal cargado 25.000 Gs como si fuera 1 kg; política 20 g por extra:

- `precio_por_g = 25000 / 1000 = 25`
- `precio_publico_nuevo = 25 * 20 = 500`

### Si la unidad del ingrediente es **kg** y el valor es precio por 1 kg

Primero expresá la porción en kg: `kg_por_extra = gramos_por_extra / 1000`, luego:

`precio_publico_nuevo = precio_mal_cargado * kg_por_extra`

### Líquidos (**ml** / **l**)

Análogo: si el mal valor era por litro y trabajás en ml, `precio_por_ml = precio_por_litro / 1000`, etc.

### Ingredientes **discretos** (`tipo_inventario = 'discreto'`, unidad `unidad`)

Un “+1” suele ser **una unidad** (ej. una feta). Ahí `precio_publico` debería ser el recargo por esa unidad, no el precio de la caja entera. Dividí el costo de la caja entre unidades por caja si aplicaba.

Documentá en un spreadsheet auxiliar: `id`, `nombre`, `valor_anterior`, `supuesto` (kg vs unidad), `gramos_por_extra`, `valor_nuevo`.

---

## Paso 4 — Referencia: cantidades en recetas (no sustituye la política de extra)

Sirve para ver qué porciones ya usás en productos; el extra en POS sigue siendo “por clic”, no siempre igual a la receta base.

```sql
SELECT
  i.id AS ingrediente_id,
  i.slug,
  i.nombre AS ingrediente,
  i.unidad AS unidad_catalogo,
  p.nombre AS producto,
  rp.cantidad AS cantidad_receta,
  COALESCE(rp.unidad, i.unidad) AS unidad_receta
FROM recetas_producto rp
JOIN ingredientes i ON i.id = rp.ingrediente_id AND i.tenant_id = rp.tenant_id
JOIN productos p ON p.id = rp.producto_id AND p.tenant_id = rp.tenant_id
WHERE rp.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
ORDER BY i.nombre, p.nombre;
```

---

## Paso 5 — Aplicar correcciones (`UPDATE`)

**Reglas de seguridad:**

- Siempre `WHERE tenant_id = '...' AND id = '...'`.
- No cambies `slug` si ya hay recetas o historial enlazado.
- Opcional: actualizar `updated_at`.

### Ejemplo: una fila concreta

```sql
-- Reemplazá :nuevo_precio y :ingrediente_id tras validar en hoja de cálculo
UPDATE ingredientes
SET
  precio_publico = :nuevo_precio,
  updated_at = now()
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND id = ':ingrediente_id';
```

### Ejemplo: varias filas con `CASE` (revisá los UUIDs y valores antes de ejecutar)

```sql
UPDATE ingredientes AS ing
SET
  precio_publico = v.precio_nuevo::numeric,
  updated_at = now()
FROM (
  VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 500::numeric),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 1500::numeric)
) AS v(ingrediente_id, precio_nuevo)
WHERE ing.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND ing.id = v.ingrediente_id;
```

---

## Paso 6 — Verificación en base

Repetí el `SELECT` del Paso 1 o 2 y confirmá que los `precio_publico` son los esperados.

---

## Checklist — verificación en POS (Atlas Burger)

1. Iniciá sesión en el contexto del tenant **Atlas Burger** (slug / selector que uses en la app).
2. Abrí un producto **con receta** que permita extras.
3. Agregá un extra cuyo precio corregiste: el texto “+Xs Gs c/u” en el drawer debe reflejar el nuevo valor.
4. Añadí **dos** incrementos del mismo extra: el adicional sobre el precio base debe ser `2 × precio_publico` (salvo límites de UI).
5. Confirmá un pedido de prueba (o carrito) y revisá que el **subtotal de línea** coincida con base + extras.
6. (Opcional) Revisá ticket / cocina si necesitás validar texto de modificaciones.

---

## Resumen rápido

| Qué | Dónde |
|-----|--------|
| Recargo por extra en POS | `ingredientes.precio_publico` |
| Alta en admin | Modal de materia prima (`IngredienteModal`): el campo debe interpretarse como precio al cliente por extra, no costo de bolsa |
| Scripts de este runbook | Acotados a `tenant_id` Atlas salvo que copies y cambies el UUID |

---

## Anexo: Atlas Burger — ajuste operativo (abril 2026)

Datos analizados a partir de export CSV (listado de ingredientes + `cantidad_promedio_receta` por insumo). Se asumió que **`precio_publico` histórico = precio de compra por 1 kg** (insumos en `g`) y que el **peso por extra** razonable para el cálculo es el **promedio de gramos en `recetas_producto`** (misma lógica que el Paso 3 del runbook).

**Fórmula aplicada:**  
`precio_nuevo = round((precio_publico / 1000) × cantidad_promedio_receta)` para fraccionables en gramos.

**Excepciones tratadas en el script:**

| Caso | Criterio |
|------|----------|
| Huevo (`unidad`) | Sin kg: se usó `23000 / 30` ≈ **767 Gs** por huevo (asumiendo caja ~30 unidades). Ajustar si la caja es otra. |
| Carne hamburguesa (`unidad`) | Promedio en recetas ~0,54 unidades (mix de productos); **no** se aplicó fórmula kg→g. Se dejó **5500** para revisión manual (precio por medallón vs pack). |
| Rabadilla | Promedio receta **~63 g** → el valor sube mucho si el costo/kg es alto. Si un “+1” en venta es menos carne que el promedio de receta, **reducir gramos** en la fórmula o el valor en el `UPDATE` (ej. 20 g → `53000/1000*20 = 1060`). |

### Tabla de valores propuestos (extras con `permite_extra_en_carrito = true`)

| Ingrediente | `precio_publico` anterior (Gs) | Promedio receta | Propuesto (Gs) |
|-------------|-------------------------------|-----------------|------------------|
| Rabadilla | 53 000 | 63,33 g | 3357 |
| Cheddar | 52 500 | ~13,95 g | 732 |
| Ketchup | 41 000 | 8,75 g | 359 |
| Lechuga Repollada | 31 950 | 15 g | 479 |
| Jamón | 27 000 | 10 g | 270 |
| Mayonesa | 26 000 | ~11,67 g | 303 |
| Huevo | 23 000 | 1 u (caja/30) | 767 |
| Pepinillos | 22 000 | 7,5 g | 165 |
| Barbacoa | 21 000 | 10 g | 210 |
| Panceta | 20 000 | ~11,82 g | 236 |
| Cheddar Cremoso | 18 000 | 32,5 g | 585 |
| Tomate | 16 000 | 10 g | 160 |
| Salsa Picante | 13 000 | 5 g | 65 |
| Cebolla | 5 450 | 10 g | 55 |
| Carne Hamburguesa | 5 500 | — | 5500 (sin cambio automático) |

### ¿Eran “precios justos” y el local no pierde?

- **Antes del fix:** si el cliente pagaba **~25 000 Gs** por un extra de queso porque el campo tenía el **precio de 1 kg**, el local **ganaba de más** en ese extra respecto al costo real del pedacito (pero **perdía confianza** y ticket mal visto). No era sostenible comercialmente por la experiencia del cliente.
- **Después del fix (valores de la tabla):** la fórmula lleva el cobro a **aproximadamente el costo del insumo** correspondiente a esos gramos **si** el número viejo era realmente **costo de compra por kg**. Eso implica **margen bruto ~0 solo sobre ese gramo de insumo** (no cubre mano de obra, luz, desperdicio, ni margen comercial). En comida rápida suele buscarse que el **costo de alimento** represente ~25–35 % del precio al público; por extras muchos locales aplican un **multiplicador** sobre costo (ej. ×2 a ×3) o fijan precios redondos por estrategia.
- **Conclusión práctica:** estos valores **corrigen el error grosero** y evitan cobrar un kilo entero; **no sustituyen** una política de margen. Si el dueño nota que el extra queda “muy barato”, puede subir cada `precio_publico` un **porcentaje fijo** (ej. +40 %) o redondear hacia arriba, **sin volver** a poner el precio del paquete/kg en ese campo.
- El **panel de admin** de esta app sigue estimando costo/ganancia con un **ratio fijo sobre ventas** (`ESTIMATED_COST_RATIO`), no con recetas; el impacto en números del dashboard será por **ventas reales** más coherentes, no por un motor de margen por insumo.

### Script `UPDATE` (ejecutar tras revisar rabadilla, huevo y carne)

`tenant_id` Atlas Burger: `fe44f26a-0377-41f7-9e75-854d0e9dbd5c`

```sql
UPDATE ingredientes AS ing
SET
  precio_publico = v.precio_nuevo::numeric,
  updated_at = now()
FROM (
  VALUES
    ('4144d0ff-be7c-4e0e-aaea-f57347f6a480'::uuid, 3357::numeric),
    ('92fc824c-aee9-4200-a63c-b58f42912645'::uuid, 732::numeric),
    ('7511c1c2-194b-46b0-b80e-24013a7383fb'::uuid, 359::numeric),
    ('478bbedd-7062-4ab1-8313-ebad69286428'::uuid, 479::numeric),
    ('1363aeb7-47f4-478c-8616-a7f91937a995'::uuid, 270::numeric),
    ('d680d419-317f-4631-9a66-465a70bd36c2'::uuid, 303::numeric),
    ('ca3add74-3a2c-4105-beb1-6a166dbc86f9'::uuid, 767::numeric),
    ('ca7a13fc-0bd2-4b21-b3dd-654a5d16ac85'::uuid, 165::numeric),
    ('8b04e294-6787-40cb-9a58-de8328cb334c'::uuid, 210::numeric),
    ('e6480e77-50dc-40fc-8165-d0121415583f'::uuid, 236::numeric),
    ('fe9be5e3-9623-413b-9471-1efd5a1cb6e5'::uuid, 585::numeric),
    ('0662c493-8da0-4e25-a6e2-c8db1a2938dd'::uuid, 160::numeric),
    ('05cfe466-b934-43cf-b91e-2fb21c8fd26a'::uuid, 65::numeric),
    ('1f6e76fb-b940-4bf2-8d03-789d4c0ba626'::uuid, 55::numeric),
    ('8439afd1-f4bc-495d-aee7-31c5656d4730'::uuid, 5500::numeric)
) AS v(ingrediente_id, precio_nuevo)
WHERE ing.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND ing.id = v.ingrediente_id;
```

### Verificación post-`UPDATE`

```sql
SELECT id, slug, nombre, unidad, precio_publico, permite_extra_en_carrito
FROM ingredientes
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND permite_extra_en_carrito = true
ORDER BY precio_publico DESC;
```

---

## Política de redondeo (precios “redondos” en extras)

Hay **dos estrategias** compatibles; podés usar una o ambas.

### A) Redondeo en el POS (recomendado para probar rápido)

Si en `ingredientes.precio_publico` guardás el valor calculado (ej. **732** Gs) pero querés que en el carrito se muestre y cobre **1000** Gs, configurá en `.env.local` (o variables del hosting):

| Variable | Valor típico | Efecto |
|----------|--------------|--------|
| `NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_PASO` | `1000` | Redondea a múltiplos de 1000 Gs (o el paso que uses: 500, 2000, etc.). |
| `NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_MODO` | `nearest` (defecto) | Al más cercano; montos positivos pequeños suben al menos un paso. |
| `NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_MODO` | `ceil` | Siempre hacia arriba (más conservador en cobro). |

- `PASO=0` u omitido: **sin redondeo** en el POS; se usa el número de la base tal cual.
- Implementación: `src/lib/utils/format.ts` (`roundGuaraniesToStep`), `src/lib/env/posExtras.ts`, aplicado en `ItemCustomizationDrawer` al armar `priceBySlug`.
- **Importante:** el cobro y el subtotal del carrito usan el **precio ya redondeado**; no hace falta duplicar el valor en Supabase para que el POS muestre miles.

### B) Redondeo en base de datos (SQL)

Si preferís que **todos** los clientes (reportes, admin, futuras pantallas) vean el mismo entero sin depender del env:

```sql
-- Ejemplo: llevar precio_publico al múltiplo de 1000 más cercano (mín. 1000 si > 0)
UPDATE ingredientes
SET precio_publico = GREATEST(1000, ROUND(precio_publico / 1000.0) * 1000)::numeric,
    updated_at = now()
WHERE tenant_id = '...'
  AND precio_publico > 0;
```

Ajustá `tenant_id` y, si querés **ceil** en SQL: `CEIL(precio_publico / 1000.0) * 1000`.

**No combines** paso 1000 en BD y otra vez 1000 en env sin pensarlo: duplicaría el efecto. Elegí **solo POS** o **solo BD** salvo casos especiales.

---

## Checklist final (¿falta algo?)

Usalo como cierre antes de abrir Atlas (u otro tenant) al público. Marcá cada ítem cuando esté hecho.

### Datos en Supabase

- [ ] Ejecutaste un **SELECT de respaldo** de `ingredientes` del tenant (export o copia) **antes** del `UPDATE`.
- [ ] Revisaste **a mano** los casos sensibles del anexo Atlas: **rabadilla** (valor alto por ~63 g; opcional bajar a ~20 g o menos), **huevo** (767 Gs asume caja de 30; ajustar si no), **carne hamburguesa** (5500 quedó igual; confirmar con negocio).
- [ ] Si querés **margen** sobre costo proporcional, subiste los `precio_publico` con un % o redondeo **antes** o **después** del `UPDATE` (edición puntual en SQL o en admin).
- [ ] Ejecutaste el **`UPDATE`** del anexo (o tu variante) **solo** con `tenant_id` e `id` correctos.
- [ ] Ejecutaste el **SELECT de verificación** post-`UPDATE` y los números coinciden con lo esperado.

### Código / despliegue (si usás el repo Lomiteria)

- [ ] El cambio de UI en **“Precio extra en carrito”** (`IngredienteModal`) está **desplegado** en el entorno donde operan (build/hosting). Si no desplegás, el fix de datos igual funciona en el POS; solo falta el texto aclaratorio en altas nuevas.
- [ ] (Opcional) Configuraste **`NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_PASO`** (ej. `1000`) y `NEXT_PUBLIC_EXTRAS_PRECIO_REDONDE_MODO` si querés precios redondos en el POS; reiniciaste el servidor tras cambiar `.env`.

### Prueba en la app (tenant Atlas)

- [ ] Entraste al **POS** con el tenant **Atlas Burger**.
- [ ] Abrís un producto con receta → **personalizar** → comprobás que los extras muestran **+Xs Gs c/u** coherentes (no decenas de miles salvo que sea intencional).
- [ ] Sumás **dos** veces el mismo extra: el adicional = **2 ×** precio por extra.
- [ ] (Opcional) Confirmás un **pedido de prueba** y el subtotal de línea cuadra con base + extras.

### Después

- [ ] Comunicación interna: el equipo sabe que **`precio_publico` = cobro por +1**, no precio de bolsa/kg.
- [ ] No hace falta migración ni tocar `recetas_producto` solo por este fix.

---

Si en el futuro necesitás guardar **costo de compra** y **precio al público** por separado, haría falta una migración nueva (columna adicional) y cambios en formularios; este runbook no la cubre.
