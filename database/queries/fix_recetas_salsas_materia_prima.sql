-- =============================================================================
-- Corregir recetas de salsas (vasitos) mal asociadas a materia prima
-- =============================================================================
-- Contexto: Vasitos de Ketchup y Barbacoa estaban ligados a "Agua 500ml";
-- Vasito de Cheddar Derretido a "Cheddar Cremoso" (ajustar a Cheddar si aplica).
--
-- Verificá el tenant_id antes de ejecutar (ej. Atlas Burger abajo).
-- Ejecutá primero el SELECT de comprobación al final.
-- =============================================================================

-- Reemplazá si tu tenant no es Atlas:
-- 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'

BEGIN;

-- 1) Vasito de Ketchup → materia prima Ketchup (no Agua 500ml)
UPDATE recetas_producto
SET
  ingrediente_id = '7511c1c2-194b-46b0-b80e-24013a7383fb'::uuid,
  updated_at = now()
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND producto_id = '4875e2db-2fb2-4d1c-a9d2-28e4b2eb1061'
  AND ingrediente_id = '092cc0dd-08b3-4cfd-b737-3422168e0003';

-- 2) Vasito de Barbacoa → materia prima Barbacoa (no Agua 500ml)
UPDATE recetas_producto
SET
  ingrediente_id = '8b04e294-6787-40cb-9a58-de8328cb334c'::uuid,
  updated_at = now()
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND producto_id = 'e2e54b02-b33d-43d8-8cb9-9f573257e803'
  AND ingrediente_id = '092cc0dd-08b3-4cfd-b737-3422168e0003';

-- 3) Vacito de Cheddar Derretido → Cheddar (no Cheddar Cremoso)
--    Omití este bloque si en tu negocio el vasito debe seguir descontando Cheddar Cremoso.
UPDATE recetas_producto
SET
  ingrediente_id = '92fc824c-aee9-4200-a63c-b58f42912645'::uuid,
  updated_at = now()
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND producto_id = '04ce4229-d880-47ce-a6dd-01ea80d53cb6'
  AND ingrediente_id = 'fe9be5e3-9623-413b-9471-1efd5a1cb6e5';

COMMIT;

-- -----------------------------------------------------------------------------
-- Comprobación (mismos productos que database/queries/salsas_y_materias_primas.sql)
-- -----------------------------------------------------------------------------
/*
SELECT
  p.nombre AS salsa,
  i.slug,
  i.nombre AS materia_prima,
  rp.cantidad,
  COALESCE(rp.unidad, i.unidad) AS unidad_receta
FROM productos p
JOIN categorias c ON c.id = p.categoria_id AND c.tenant_id = p.tenant_id
JOIN recetas_producto rp ON rp.producto_id = p.id AND rp.tenant_id = p.tenant_id
JOIN ingredientes i ON i.id = rp.ingrediente_id AND i.tenant_id = p.tenant_id
WHERE p.tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND c.nombre = 'Salsas'
  AND p.id IN (
    '4875e2db-2fb2-4d1c-a9d2-28e4b2eb1061',
    'e2e54b02-b33d-43d8-8cb9-9f573257e803',
    '04ce4229-d880-47ce-a6dd-01ea80d53cb6',
    '31541094-50b9-424a-81ff-cbadfb606de4'
  )
ORDER BY p.nombre;
*/
