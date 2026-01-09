-- ============================================
-- FIX: Permisos para tabla productos
-- ============================================
-- Este script soluciona el error "permission denied for table productos"
-- Ejecutar en el SQL Editor de Supabase

-- Opción 1: Deshabilitar RLS (más simple para desarrollo)
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- Dar permisos solo a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON productos TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Opción 2 (Alternativa): Si prefieres mantener RLS habilitado
-- Comenta la línea "ALTER TABLE productos DISABLE ROW LEVEL SECURITY" arriba
-- y descomenta las siguientes líneas:

/*
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (cualquiera puede leer)
CREATE POLICY "Permitir SELECT a todos" ON productos
  FOR SELECT
  USING (true);

-- Política para INSERT (usuarios autenticados)
CREATE POLICY "Permitir INSERT a autenticados" ON productos
  FOR INSERT
  WITH CHECK (true);

-- Política para UPDATE (usuarios autenticados)
CREATE POLICY "Permitir UPDATE a autenticados" ON productos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para DELETE (usuarios autenticados)
CREATE POLICY "Permitir DELETE a autenticados" ON productos
  FOR DELETE
  USING (true);
*/
