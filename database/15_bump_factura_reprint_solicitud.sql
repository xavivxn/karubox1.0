-- ============================================
-- RPC bump_factura_reprint → cola reprint_solicitud (tipo factura)
-- ============================================
-- Ejecutar DESPUÉS de 14_reprint_solicitud.sql.
-- Igual que cocina: el agente debe reaccionar a INSERT con tipo = 'factura'
-- e imprimir solo factura (p. ej. vista_factura_impresion).
-- ============================================

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
  FROM public.usuarios u
  WHERE u.auth_user_id = uid
    AND COALESCE(u.is_deleted, false) = false
    AND COALESCE(u.activo, true) = true
  LIMIT 1;

  IF t_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_usuario');
  END IF;

  INSERT INTO public.reprint_solicitud (tenant_id, pedido_id, tipo)
  SELECT t_user, p_pedido_id, 'factura'
  WHERE EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE p.id = p_pedido_id AND p.tenant_id = t_user AND p.estado_pedido = 'FACT'
  )
  AND EXISTS (
    SELECT 1 FROM public.facturas f
    WHERE f.pedido_id = p_pedido_id
      AND f.tenant_id = t_user
      AND COALESCE(f.anulada, false) = false
  );

  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sin_factura_activa_o_pedido_no_fact');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.bump_factura_reprint(uuid) IS
  'Encola reimpresión solo factura (INSERT reprint_solicitud tipo factura); ya no actualiza facturas.updated_at.';
