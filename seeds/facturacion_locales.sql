-- ============================================
-- SEED: Configuración de facturación (datos de prueba)
-- Para los 2 locales: Atlas Burger y Pancholos
-- ============================================
-- Ejecutar en Supabase SQL Editor después de tener
-- la tabla tenant_facturacion y los tenants creados.

-- Atlas Burger
INSERT INTO public.tenant_facturacion (
  tenant_id,
  timbrado,
  vigencia_inicio,
  vigencia_fin,
  establecimiento,
  punto_expedicion,
  ultimo_numero
)
SELECT
  t.id,
  '87654321',
  '2025-01-01'::date,
  '2025-12-31'::date,
  '001',
  '001',
  0
FROM public.tenants t
WHERE t.slug = 'atlas-burger'
  AND t.is_deleted = false
ON CONFLICT (tenant_id) DO UPDATE SET
  timbrado = EXCLUDED.timbrado,
  vigencia_inicio = EXCLUDED.vigencia_inicio,
  vigencia_fin = EXCLUDED.vigencia_fin,
  establecimiento = EXCLUDED.establecimiento,
  punto_expedicion = EXCLUDED.punto_expedicion,
  updated_at = now();

-- Pancholos (si el slug es otro, cambiar 'pancholos' por el correcto, ej: 'pancholo')
INSERT INTO public.tenant_facturacion (
  tenant_id,
  timbrado,
  vigencia_inicio,
  vigencia_fin,
  establecimiento,
  punto_expedicion,
  ultimo_numero
)
SELECT
  t.id,
  '11223344',
  '2025-01-01'::date,
  '2025-12-31'::date,
  '001',
  '002',
  0
FROM public.tenants t
WHERE t.slug = 'pancholos'
  AND t.is_deleted = false
ON CONFLICT (tenant_id) DO UPDATE SET
  timbrado = EXCLUDED.timbrado,
  vigencia_inicio = EXCLUDED.vigencia_inicio,
  vigencia_fin = EXCLUDED.vigencia_fin,
  establecimiento = EXCLUDED.establecimiento,
  punto_expedicion = EXCLUDED.punto_expedicion,
  updated_at = now();

-- Alternativa: dar facturación a TODOS los locales que aún no tengan
-- (útil si el slug de Pancholos es otro, ej: pancholo, pancholos-burger, etc.)
INSERT INTO public.tenant_facturacion (
  tenant_id,
  timbrado,
  vigencia_inicio,
  vigencia_fin,
  establecimiento,
  punto_expedicion,
  ultimo_numero
)
SELECT
  t.id,
  '55667788',
  '2025-01-01'::date,
  '2025-12-31'::date,
  '001',
  '001',
  0
FROM public.tenants t
WHERE t.is_deleted = false
  AND NOT EXISTS (SELECT 1 FROM public.tenant_facturacion f WHERE f.tenant_id = t.id)
ON CONFLICT (tenant_id) DO NOTHING;

-- Verificar (ejecutar después del seed):
-- SELECT t.nombre, t.slug, f.timbrado, f.establecimiento, f.punto_expedicion, f.ultimo_numero
-- FROM tenants t
-- LEFT JOIN tenant_facturacion f ON f.tenant_id = t.id
-- WHERE t.is_deleted = false;
