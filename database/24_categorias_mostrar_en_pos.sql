-- Visibilidad POS/carta (idempotente).

ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS mostrar_en_pos BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.categorias.mostrar_en_pos IS
  'Si es true, la categoria aparece en el carrusel del POS y en la carta publica.';

UPDATE public.categorias
SET mostrar_en_pos = false
WHERE lower(trim(nombre)) IN ('salsas', 'insumos base');
