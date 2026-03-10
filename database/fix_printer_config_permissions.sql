-- ============================================
-- FIX: Permisos para printer_config
-- ============================================
--
-- Este script soluciona el error "permission denied for table printer_config"
-- agregando permisos de escritura (INSERT, UPDATE, DELETE) para los roles
-- authenticated y anon.
--
-- El error ocurre porque originalmente solo se otorgaron permisos SELECT.
--
-- ============================================

-- Otorgar permisos completos para authenticated (usuarios logueados)
GRANT INSERT, UPDATE, DELETE ON printer_config TO authenticated;

-- Otorgar permisos completos para anon (usuarios anónimos, por consistencia)
GRANT INSERT, UPDATE, DELETE ON printer_config TO anon;

-- Verificar permisos (opcional - comentar si no necesitas)
-- SELECT
--   grantee,
--   privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name = 'printer_config';

-- ============================================
-- NOTA: Si aún tienes problemas después de ejecutar esto,
-- considera usar el admin client en las operaciones de printer_config.
-- ============================================
