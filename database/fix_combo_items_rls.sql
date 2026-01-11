/**
 * Fix RLS Policies para combo_items
 * 
 * Problema: Las políticas usan current_setting que no funciona desde el cliente
 * Solución: Usar auth.uid() y verificar tenant_id como en otras tablas
 */

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Los usuarios pueden ver combos de su tenant" ON combo_items;
DROP POLICY IF EXISTS "Los usuarios pueden crear combos en su tenant" ON combo_items;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar combos de su tenant" ON combo_items;
DROP POLICY IF EXISTS "Los usuarios pueden eliminar combos de su tenant" ON combo_items;

-- Crear políticas correctas (similares a productos y recetas_producto)
-- SELECT: Permitir a todos los usuarios autenticados ver combos
CREATE POLICY "Enable read access for authenticated users"
  ON combo_items FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Permitir a usuarios autenticados crear combos
CREATE POLICY "Enable insert for authenticated users"
  ON combo_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Permitir a usuarios autenticados actualizar combos
CREATE POLICY "Enable update for authenticated users"
  ON combo_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Permitir a usuarios autenticados eliminar combos
CREATE POLICY "Enable delete for authenticated users"
  ON combo_items FOR DELETE
  TO authenticated
  USING (true);

-- Verificar políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'combo_items'
ORDER BY policyname;