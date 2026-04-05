-- Auditoría: extras en carrito y precios cargados (ajustar precio_publico y tipo_recargo_extra según negocio)
-- Reemplazar el UUID por tu tenant_id.

SELECT
  id,
  slug,
  nombre,
  unidad,
  tipo_inventario,
  precio_publico,
  tipo_recargo_extra,
  permite_extra_en_carrito,
  activo
FROM ingredientes
WHERE tenant_id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c'
  AND activo = true
  AND permite_extra_en_carrito = true
ORDER BY nombre;

-- Rangos vigentes del tenant (editables en SQL; ver migración 25_extras_tipo_recargo_tenant.sql)
SELECT
  id,
  nombre,
  extra_precio_min_estandar,
  extra_precio_max_estandar,
  extra_precio_min_proteina
FROM tenants
WHERE id = 'fe44f26a-0377-41f7-9e75-854d0e9dbd5c';
