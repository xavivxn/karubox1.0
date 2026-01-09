-- ============================================
-- FIX DEFINITIVO: Eliminar RLS y políticas
-- ============================================
-- Ejecutar este script completo en el SQL Editor de Supabase

-- 1. Eliminar TODAS las políticas existentes en productos
DROP POLICY IF EXISTS "Permitir SELECT a todos" ON productos;
DROP POLICY IF EXISTS "Permitir INSERT a autenticados" ON productos;
DROP POLICY IF EXISTS "Permitir UPDATE a autenticados" ON productos;
DROP POLICY IF EXISTS "Permitir DELETE a autenticados" ON productos;
DROP POLICY IF EXISTS "Enable read access for all users" ON productos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON productos;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON productos;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON productos;

-- 2. DESHABILITAR RLS completamente
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- 3. Dar permisos completos
GRANT ALL PRIVILEGES ON productos TO authenticated;
GRANT ALL PRIVILEGES ON productos TO anon;

-- 4. Dar permisos en secuencias
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 5. Verificar que RLS está deshabilitado
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'productos';

-- Si el resultado muestra rls_enabled = false, entonces está correcto
-- Si muestra true, ejecutar nuevamente: ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
