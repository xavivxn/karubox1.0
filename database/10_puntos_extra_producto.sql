-- ============================================
-- PUNTOS EXTRA POR PRODUCTO - Sweet Spot 5%
-- Version: 1.0
-- ============================================
-- Agrega columna puntos_extra a productos.
-- El admin puede definir puntos bonus adicionales
-- a la acumulación automática (1 pto / 100 Gs).
--
-- Fórmula completa de puntos por pedido:
--   puntos_auto  = FLOOR(total / 100)       → 1 pto cada 100 Gs
--   puntos_extra = SUM(producto.puntos_extra × cantidad)
--   total_puntos = puntos_auto + puntos_extra
--
-- Valor de canje (sweet spot 5%):
--   1 punto = 5 Gs
--   Ejemplo: pedido 30.000 Gs → 300 puntos auto → 1.500 Gs de crédito
-- ============================================

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS puntos_extra INTEGER NOT NULL DEFAULT 0
    CHECK (puntos_extra >= 0);

COMMENT ON COLUMN productos.puntos_extra IS
  'Puntos bonus adicionales que el admin asigna a este producto por unidad vendida (sobre la acumulación automática).';

-- Índice para consultar productos con bonus de puntos (útil para reportes)
CREATE INDEX IF NOT EXISTS idx_productos_puntos_extra
  ON productos(tenant_id, puntos_extra)
  WHERE puntos_extra > 0 AND is_deleted = false;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 10_puntos_extra_producto.sql ejecutado correctamente';
  RAISE NOTICE '  ✅ Columna puntos_extra agregada a productos (DEFAULT 0)';
  RAISE NOTICE '  Fórmula: total_puntos = FLOOR(total/100) + SUM(puntos_extra × cant)';
  RAISE NOTICE '  Valor de canje: 1 punto = 5 Gs (retorno del 5%%)';
END
$$;
