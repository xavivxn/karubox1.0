-- ============================================
-- TODOS LOS SEEDS - EJECUTAR TODOS LOS CLIENTES
-- ⚠️ Este archivo carga TODOS los clientes de una vez
-- Útil para ambientes de desarrollo/testing
-- ============================================

-- IMPORTANTE: 
-- - Este archivo ejecuta todos los seeds en secuencia
-- - Si un seed falla, los siguientes pueden no ejecutarse
-- - Para producción, ejecuta cada seed individualmente

-- ============================================
-- SEED 1: ATLAS BURGER
-- ============================================
\echo 'Cargando Atlas Burger...'

-- (Aquí iría el contenido completo de atlas-burger.sql)
-- Por ahora, simplemente incluimos el UPDATE inicial
UPDATE tenants 
SET 
  nombre = 'Atlas Burger',
  slug = 'atlas-burger',
  updated_at = NOW()
WHERE slug = 'lomiteria-don-juan' OR slug = 'atlas-burger';

-- NOTA: Para ejecutar todos los seeds, puedes:
-- 1. Copiar y pegar el contenido de cada seed aquí en orden
-- 2. O ejecutar cada seed individualmente desde Supabase

-- ============================================
-- SEED 2: LOMITERÍA LA ESQUINA (EJEMPLO)
-- ============================================
\echo 'Cargando Lomitería La Esquina...'

-- (Aquí iría el contenido completo de ejemplo-lomiteria-la-esquina.sql)

-- ============================================
-- SEED 3: OTRO CLIENTE (cuando lo agregues)
-- ============================================
\echo 'Cargando siguiente cliente...'

-- ============================================
-- ✅ RECOMENDACIÓN
-- ============================================
-- 
-- En lugar de usar este archivo, te recomiendo:
-- 
-- 1. Ejecutar cada seed INDIVIDUALMENTE desde Supabase SQL Editor
--    - Esto te da más control
--    - Puedes ver qué cliente se cargó correctamente
--    - Si uno falla, los otros no se afectan
-- 
-- 2. O crear un script en Node.js/Python que ejecute cada seed
--    en secuencia y maneje errores
-- 
-- 3. Para producción, NUNCA uses este archivo
--    - Siempre ejecuta seeds individuales
--    - Verifica cada cliente después de cargarlo
-- 
-- ============================================

-- Verificar todos los tenants cargados
SELECT 
  nombre,
  slug,
  activo,
  created_at
FROM tenants
ORDER BY created_at DESC;

