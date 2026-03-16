-- ============================================
-- Fix: Permisos para tabla sesiones_caja
-- Ejecutar en Supabase SQL Editor si aparece
-- "permission denied for table sesiones_caja"
-- ============================================

-- Dar permisos al rol authenticated (usuarios logueados vía Supabase Auth)
GRANT SELECT, INSERT, UPDATE ON public.sesiones_caja TO authenticated;

-- Opcional: si usás anon en algún flujo
-- GRANT SELECT ON public.sesiones_caja TO anon;

-- Verificar (opcional): listar políticas y permisos
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'sesiones_caja';
