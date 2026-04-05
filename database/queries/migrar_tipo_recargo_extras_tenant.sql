-- Migración de datos: asignar tipo_recargo_extra a ingredientes ya existentes con extra en carrito
--
-- Requisitos: migración 25_extras_tipo_recargo_tenant.sql aplicada.
-- Reemplazá TENANT_ID y revisá la lista de slugs "proteina".
--
-- Política sugerida (Atlas Burger según auditoría):
--   proteina → medallón / carne / cortes que el dueño cobre ~6k+
--   estandar → toppings (quesos, vegetales, salsas, panceta, jamón, huevo, etc.)
--
-- Si "rabadilla" en tu carta no es extra de carne, sacala del IN de proteina
-- y dejá solo el UPDATE de estandar (o asigná estandar explícitamente a ese slug).

BEGIN;

-- ⚠️ Mismo UUID que en auditar_precios_extras_tenant.sql
UPDATE ingredientes
SET tipo_recargo_extra = 'proteina',
    updated_at = NOW()
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND slug IN (
    'carne-hamburguesa',
    'rabadilla'  -- quitar esta línea si no aplica como extra de carne
  )
  AND permite_extra_en_carrito = true;

UPDATE ingredientes
SET tipo_recargo_extra = 'estandar',
    updated_at = NOW()
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND permite_extra_en_carrito = true
  AND slug NOT IN ('carne-hamburguesa', 'rabadilla');

COMMIT;

-- Verificación (mismos filtros que la auditoría)
SELECT slug, nombre, precio_publico, tipo_recargo_extra
FROM ingredientes
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND activo = true
  AND permite_extra_en_carrito = true
ORDER BY tipo_recargo_extra NULLS LAST, nombre;
