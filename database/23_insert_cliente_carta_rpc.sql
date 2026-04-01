-- Registro de cliente desde carta QR sin depender de service_role en el servidor.
-- Ejecutar en Supabase → SQL Editor.

CREATE OR REPLACE FUNCTION public.insert_cliente_carta_qr(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tid uuid;
  v_nombre text;
  v_telefono text;
  v_ci text;
  v_ruc text;
  v_pasaporte text;
  v_email text;
  v_direccion text;
  v_fecha_nac text;
  v_fecha date;
BEGIN
  v_tid := (p_payload->>'tenant_id')::uuid;
  v_nombre := trim(coalesce(p_payload->>'nombre', ''));
  v_telefono := nullif(trim(coalesce(p_payload->>'telefono', '')), '');
  v_ci := nullif(trim(coalesce(p_payload->>'ci', '')), '');
  v_ruc := nullif(trim(coalesce(p_payload->>'ruc', '')), '');
  v_pasaporte := nullif(trim(coalesce(p_payload->>'pasaporte', '')), '');
  v_email := nullif(trim(coalesce(p_payload->>'email', '')), '');
  v_direccion := nullif(trim(coalesce(p_payload->>'direccion', '')), '');
  v_fecha_nac := nullif(trim(coalesce(p_payload->>'fecha_nacimiento', '')), '');

  IF v_tid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Local invalido');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = v_tid AND t.activo = true AND (t.is_deleted IS NOT TRUE)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Local invalido');
  END IF;

  IF v_nombre = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'El nombre es requerido');
  END IF;

  IF v_telefono IS NULL AND v_ci IS NULL AND v_ruc IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ingresa telefono, CI o RUC');
  END IF;

  v_fecha := NULL;
  IF v_fecha_nac IS NOT NULL AND v_fecha_nac <> '' THEN
    BEGIN
      v_fecha := v_fecha_nac::date;
    EXCEPTION WHEN OTHERS THEN
      v_fecha := NULL;
    END;
  END IF;

  INSERT INTO public.clientes (
    tenant_id,
    nombre,
    ci,
    ruc,
    pasaporte,
    telefono,
    email,
    direccion,
    fecha_nacimiento,
    puntos_totales,
    is_deleted
  ) VALUES (
    v_tid,
    v_nombre,
    v_ci,
    v_ruc,
    v_pasaporte,
    v_telefono,
    v_email,
    v_direccion,
    v_fecha,
    0,
    false
  );

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.insert_cliente_carta_qr(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.insert_cliente_carta_qr(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_cliente_carta_qr(jsonb) TO authenticated;

COMMENT ON FUNCTION public.insert_cliente_carta_qr(jsonb) IS
  'Alta de cliente desde carta QR; ejecutable con JWT anon.';
