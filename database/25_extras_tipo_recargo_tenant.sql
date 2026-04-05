-- Política de precios extras POS: tier por ingrediente + rangos por tenant
-- Ejecutar en Supabase SQL Editor o vía migración.

-- 1) Ingredientes: tipo de recargo para clamp en POS (NULL = sin banda, solo precio_publico + redondeo)
ALTER TABLE ingredientes
  ADD COLUMN IF NOT EXISTS tipo_recargo_extra TEXT
  CHECK (tipo_recargo_extra IS NULL OR tipo_recargo_extra IN ('estandar', 'proteina'));

COMMENT ON COLUMN ingredientes.tipo_recargo_extra IS
  'POS: estandar = clamp a rango tenant (típ. 2k–3k Gs); proteina = mínimo tenant (típ. 6k Gs); NULL = no aplicar banda';

-- 2) Tenant: límites editables (defaults alineados al plan de negocio)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS extra_precio_min_estandar NUMERIC(10,2) DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS extra_precio_max_estandar NUMERIC(10,2) DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS extra_precio_min_proteina NUMERIC(10,2) DEFAULT 6000;

COMMENT ON COLUMN tenants.extra_precio_min_estandar IS 'POS extras tier estandar: piso después de redondear precio_publico';
COMMENT ON COLUMN tenants.extra_precio_max_estandar IS 'POS extras tier estandar: techo después de redondear';
COMMENT ON COLUMN tenants.extra_precio_min_proteina IS 'POS extras tier proteina: piso mínimo (ej. extra carne)';

-- Backfill explícito por si DEFAULT no aplica en filas antiguas
UPDATE tenants
SET
  extra_precio_min_estandar = COALESCE(extra_precio_min_estandar, 2000),
  extra_precio_max_estandar = COALESCE(extra_precio_max_estandar, 3000),
  extra_precio_min_proteina = COALESCE(extra_precio_min_proteina, 6000)
WHERE extra_precio_min_estandar IS NULL
   OR extra_precio_max_estandar IS NULL
   OR extra_precio_min_proteina IS NULL;
