-- ============================================
-- Migration 13: Gastos extra en cierre de caja
-- Permite registrar gastos extra (descripción + monto) que se restan de la ganancia neta
-- ============================================

ALTER TABLE sesiones_caja
  ADD COLUMN IF NOT EXISTS gastos_extra JSONB NOT NULL DEFAULT '[]';

COMMENT ON COLUMN sesiones_caja.gastos_extra IS 'Array de { descripcion: string, monto: number } registrados al cerrar. Se restan de ganancia_neta.';
