-- ============================================
-- FIX COMPLETO: Permisos para todas las tablas
-- ============================================
-- Este script da permisos completos a todas las tablas principales
-- Ejecutar en el SQL Editor de Supabase

-- Deshabilitar RLS en todas las tablas
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recetas_producto DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_puntos DISABLE ROW LEVEL SECURITY;
ALTER TABLE promociones DISABLE ROW LEVEL SECURITY;

-- Dar permisos completos solo a usuarios autenticados
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON empleados TO authenticated;
GRANT ALL ON usuarios TO authenticated;
GRANT ALL ON categorias TO authenticated;
GRANT ALL ON productos TO authenticated;
GRANT ALL ON clientes TO authenticated;
GRANT ALL ON pedidos TO authenticated;
GRANT ALL ON items_pedido TO authenticated;
GRANT ALL ON ingredientes TO authenticated;
GRANT ALL ON recetas_producto TO authenticated;
GRANT ALL ON inventario TO authenticated;
GRANT ALL ON movimientos_inventario TO authenticated;
GRANT ALL ON transacciones_puntos TO authenticated;
GRANT ALL ON promociones TO authenticated;

-- Dar permisos en secuencias solo a autenticados
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Mensaje de confirmación
SELECT 'Permisos aplicados correctamente' as resultado;
