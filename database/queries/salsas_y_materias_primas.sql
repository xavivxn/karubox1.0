-- =============================================================================
-- Salsas (vasitos) → materia prima asociada para descuento de stock
-- =============================================================================
-- En Lomiteria, las salsas son productos en la categoría "Salsas" (nombre exacto
-- como en SalsasDrawer / posService). El descuento de ingredientes al vender
-- usa recetas_producto: cada salsa suele tener (1) la salsa en volumen/peso y
-- (2) `vasito-para-salsa` × 1 unidad (envase), si está configurado.
--
-- Reemplazá :tenant_id por el UUID del tenant (ej. Atlas Burger).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Listado principal: cada salsa y su(s) materia(s) prima(s) en receta
-- -----------------------------------------------------------------------------
SELECT
  p.id AS producto_id,
  p.nombre AS salsa_producto,
  p.precio AS precio_unitario_gs,
  p.disponible,
  p.tiene_receta,
  i.id AS ingrediente_id,
  i.slug AS materia_prima_slug,
  i.nombre AS materia_prima,
  i.unidad AS unidad_ingrediente_catalogo,
  rp.cantidad AS cantidad_descuento_por_vasito,
  COALESCE(rp.unidad, i.unidad) AS unidad_en_receta,
  i.controlar_stock,
  i.stock_actual
FROM productos p
INNER JOIN categorias c
  ON c.id = p.categoria_id
 AND c.tenant_id = p.tenant_id
INNER JOIN recetas_producto rp
  ON rp.producto_id = p.id
 AND rp.tenant_id = p.tenant_id
INNER JOIN ingredientes i
  ON i.id = rp.ingrediente_id
 AND i.tenant_id = p.tenant_id
WHERE p.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'  -- :tenant_id
  AND c.nombre = 'Salsas'
  AND COALESCE(p.is_deleted, false) = false
ORDER BY p.nombre, rp.id;

-- -----------------------------------------------------------------------------
-- 2) Resumen por materia prima: qué salsas consumen cada insumo
-- -----------------------------------------------------------------------------
SELECT
  i.id AS ingrediente_id,
  i.slug,
  i.nombre AS materia_prima,
  COUNT(DISTINCT p.id) AS cantidad_salsas_asociadas,
  STRING_AGG(DISTINCT p.nombre, ', ' ORDER BY p.nombre) AS salsas_productos
FROM ingredientes i
INNER JOIN recetas_producto rp
  ON rp.ingrediente_id = i.id
 AND rp.tenant_id = i.tenant_id
INNER JOIN productos p
  ON p.id = rp.producto_id
 AND p.tenant_id = rp.tenant_id
INNER JOIN categorias c
  ON c.id = p.categoria_id
 AND c.tenant_id = p.tenant_id
WHERE i.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'  -- :tenant_id
  AND c.nombre = 'Salsas'
  AND COALESCE(p.is_deleted, false) = false
GROUP BY i.id, i.slug, i.nombre
ORDER BY i.nombre;

-- -----------------------------------------------------------------------------
-- 3) Diagnóstico: salsas sin receta (no habrá descuento de ingredientes)
-- -----------------------------------------------------------------------------
SELECT
  p.id AS producto_id,
  p.nombre,
  p.tiene_receta,
  p.disponible
FROM productos p
INNER JOIN categorias c
  ON c.id = p.categoria_id
 AND c.tenant_id = p.tenant_id
WHERE p.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'  -- :tenant_id
  AND c.nombre = 'Salsas'
  AND COALESCE(p.is_deleted, false) = false
  AND NOT EXISTS (
    SELECT 1
    FROM recetas_producto rp
    WHERE rp.producto_id = p.id
      AND rp.tenant_id = p.tenant_id
  )
ORDER BY p.nombre;

-- -----------------------------------------------------------------------------
-- 4) Salsas con más de un ingrediente en receta (poco habitual)
-- -----------------------------------------------------------------------------
SELECT
  p.id AS producto_id,
  p.nombre AS salsa_producto,
  COUNT(rp.id) AS lineas_receta
FROM productos p
INNER JOIN categorias c
  ON c.id = p.categoria_id
 AND c.tenant_id = p.tenant_id
INNER JOIN recetas_producto rp
  ON rp.producto_id = p.id
 AND rp.tenant_id = p.tenant_id
WHERE p.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'  -- :tenant_id
  AND c.nombre = 'Salsas'
  AND COALESCE(p.is_deleted, false) = false
GROUP BY p.id, p.nombre
HAVING COUNT(rp.id) > 1
ORDER BY p.nombre;
