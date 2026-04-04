-- Carta pública: lectura sin service_role (clave anon).
-- Ejecutar una vez en Supabase → SQL Editor.
--
-- Expone una función SECURITY DEFINER que anon/authenticated pueden ejecutar;
-- el contenido sigue limitado a un tenant activo y productos disponibles.

CREATE OR REPLACE FUNCTION public.get_carta_public_snapshot(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  trow public.tenants%ROWTYPE;
BEGIN
  SELECT * INTO trow
  FROM public.tenants
  WHERE lower(trim(slug)) = lower(trim(p_slug))
    AND activo = true
    AND (is_deleted IS NOT TRUE)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  tid := trow.id;

  RETURN jsonb_build_object(
    'tenant', jsonb_build_object(
      'id', trow.id,
      'nombre', trow.nombre,
      'slug', trow.slug,
      'logo_url', trow.logo_url,
      'direccion', trow.direccion,
      'telefono', trow.telefono
    ),
    'categories', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object('id', c.id, 'nombre', c.nombre, 'orden', c.orden)
          ORDER BY c.orden NULLS LAST, c.nombre
        ),
        '[]'::jsonb
      )
      FROM public.categorias c
      WHERE c.tenant_id = tid
        AND c.activa = true
        AND COALESCE(c.mostrar_en_pos, true) = true
    ),
    'products', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', p.id,
            'nombre', p.nombre,
            'descripcion', p.descripcion,
            'precio', p.precio,
            'categoria_id', p.categoria_id,
            'imagen_url', p.imagen_url
          )
          ORDER BY p.nombre
        ),
        '[]'::jsonb
      )
      FROM public.productos p
      WHERE p.tenant_id = tid
        AND p.disponible = true
        AND (p.is_deleted IS DISTINCT FROM true)
        AND EXISTS (
          SELECT 1
          FROM public.categorias c2
          WHERE c2.id = p.categoria_id
            AND c2.tenant_id = tid
            AND COALESCE(c2.mostrar_en_pos, true) = true
        )
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_carta_public_snapshot(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_carta_public_snapshot(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_carta_public_snapshot(text) TO authenticated;

COMMENT ON FUNCTION public.get_carta_public_snapshot(text) IS
  'Datos de carta pública por slug de tenant; invocable con JWT anon.';
