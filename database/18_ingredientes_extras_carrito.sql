-- =====================================================
-- MIGRACION 18: Ingredientes habilitables como extras
-- =====================================================
-- Objetivo:
--   Agregar un flag para decidir qué materias primas se
--   pueden ofrecer como "extra" en la personalización
--   del carrito POS.

ALTER TABLE ingredientes
  ADD COLUMN IF NOT EXISTS permite_extra_en_carrito BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN ingredientes.permite_extra_en_carrito IS
  'Si TRUE, permite ofrecer esta materia prima como extra manual en personalización de carrito.';

CREATE INDEX IF NOT EXISTS idx_ingredientes_permite_extra_en_carrito
  ON ingredientes(tenant_id, permite_extra_en_carrito)
  WHERE activo = true;
