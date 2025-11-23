-- ============================================
-- AGREGAR CAMPO CI A TABLA CLIENTES
-- ============================================
-- Agrega el campo cédula de identidad (CI) a la tabla clientes
-- ============================================

-- Agregar columna CI (cédula de identidad)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS ci TEXT;

-- Crear índice para búsquedas rápidas por CI
CREATE INDEX IF NOT EXISTS idx_clientes_ci ON clientes(tenant_id, ci);

-- Agregar comentario
COMMENT ON COLUMN clientes.ci IS 'Cédula de identidad del cliente';

-- ============================================
-- ✅ LISTO
-- ============================================
-- Ahora la tabla clientes tiene:
-- - nombre (requerido)
-- - ci (opcional - cédula de identidad)
-- - telefono (opcional)
-- - email (opcional)
-- - direccion (opcional)
-- - puntos_totales
-- ============================================

