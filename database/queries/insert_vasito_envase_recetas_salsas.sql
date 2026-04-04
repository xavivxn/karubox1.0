-- =============================================================================
-- Añadir receta: 1 vasito desechable por cada producto de categoría "Salsas"
-- =============================================================================
-- Materia prima esperada: ingrediente con slug `vasito-para-salsa` (ej. "Vasito
-- para salsa", unidad). Misma convención que usa `SalsasDrawer` al crear salsas.
-- No duplica filas si ya existe la línea (mismo producto + mismo ingrediente).
--
-- Reemplazá :tenant_id por el UUID del tenant.
-- =============================================================================

-- Verificá que exista el ingrediente:
-- SELECT id, nombre, slug FROM ingredientes WHERE tenant_id = '...' AND slug = 'vasito-para-salsa';

INSERT INTO recetas_producto (
  tenant_id,
  producto_id,
  ingrediente_id,
  cantidad,
  unidad,
  obligatorio
)
SELECT
  p.tenant_id,
  p.id,
  v.id,
  1,
  'unidad',
  true
FROM productos p
JOIN categorias c
  ON c.id = p.categoria_id
 AND c.tenant_id = p.tenant_id
JOIN ingredientes v
  ON v.tenant_id = p.tenant_id
 AND v.slug = 'vasito-para-salsa'
 AND COALESCE(v.activo, true) = true
WHERE p.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'  -- :tenant_id
  AND c.nombre = 'Salsas'
  AND COALESCE(p.is_deleted, false) = false
  AND NOT EXISTS (
    SELECT 1
    FROM recetas_producto rp
    WHERE rp.tenant_id = p.tenant_id
      AND rp.producto_id = p.id
      AND rp.ingrediente_id = v.id
  );

-- Comprobación: líneas de receta por salsa
/*
SELECT p.nombre, COUNT(rp.id) AS lineas_receta
FROM productos p
JOIN categorias c ON c.id = p.categoria_id AND c.tenant_id = p.tenant_id
LEFT JOIN recetas_producto rp ON rp.producto_id = p.id AND rp.tenant_id = p.tenant_id
WHERE p.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND c.nombre = 'Salsas'
  AND COALESCE(p.is_deleted, false) = false
GROUP BY p.id, p.nombre
ORDER BY p.nombre;
*/
