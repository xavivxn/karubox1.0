-- ============================================
-- Reimpresión vía Realtime (RPC legacy)
-- ============================================
-- NOTA: Si usás cola reprint_solicitud (14_reprint_solicitud.sql), bump_pedido queda
-- redefinido en el 14 y bump_factura en 15_bump_factura_reprint_solicitud.sql.
-- Este archivo puede pisar bump_pedido si lo ejecutás después del 14: preferí orden 13 → 14 → 15.
--
-- La app (navegador) puede hacer UPDATE en pedidos/facturas vía Supabase client (Realtime).
-- El agente (listener Supabase) debe tratar un UPDATE con nuevo updated_at
-- como evento nuevo (p. ej. dedup por id + updated_at).
--
-- Si RLS bloquea UPDATE directo desde el rol authenticated, ejecutá estas
-- funciones y cambiá la app para usar supabase.rpc(...) en lugar del update directo.
-- ============================================

CREATE OR REPLACE FUNCTION public.bump_pedido_reprint_cocina(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  t_user uuid;
  n int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT u.tenant_id INTO t_user
  FROM usuarios u
  WHERE u.auth_user_id = uid AND COALESCE(u.is_deleted, false) = false AND COALESCE(u.activo, true) = true
  LIMIT 1;

  IF t_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_usuario');
  END IF;

  UPDATE pedidos p
  SET updated_at = now()
  WHERE p.id = p_pedido_id AND p.tenant_id = t_user AND p.estado_pedido = 'FACT';

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'pedido_no_encontrado_o_no_fact');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_pedido_reprint_cocina(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_pedido_reprint_cocina(uuid) TO authenticated;

COMMENT ON FUNCTION public.bump_pedido_reprint_cocina IS 'Marca pedido FACT con updated_at=now() para que el agente Realtime reimprima cocina';

CREATE OR REPLACE FUNCTION public.bump_factura_reprint(p_pedido_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  t_user uuid;
  n int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT u.tenant_id INTO t_user
  FROM usuarios u
  WHERE u.auth_user_id = uid AND COALESCE(u.is_deleted, false) = false AND COALESCE(u.activo, true) = true
  LIMIT 1;

  IF t_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_usuario');
  END IF;

  UPDATE facturas f
  SET updated_at = now()
  WHERE f.pedido_id = p_pedido_id AND f.tenant_id = t_user AND COALESCE(f.anulada, false) = false;

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sin_factura_activa');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_factura_reprint(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_factura_reprint(uuid) TO authenticated;

COMMENT ON FUNCTION public.bump_factura_reprint IS 'Marca factura con updated_at=now() para reimpresión si el agente escucha tabla facturas';
