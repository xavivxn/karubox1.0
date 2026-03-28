-- RPC: un round-trip para salidas de ingredientes (stock + movimientos) al confirmar pedido.
-- Reduce N updates HTTP desde el cliente. Si la función no existe, consumption.ts hace fallback por fila.

CREATE OR REPLACE FUNCTION public.aplicar_salidas_ingredientes_pedido(p_movs jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  i int;
  len int;
  r jsonb;
  v_user uuid;
BEGIN
  IF p_movs IS NULL THEN
    RETURN;
  END IF;

  len := jsonb_array_length(p_movs);
  IF len IS NULL OR len = 0 THEN
    RETURN;
  END IF;

  FOR i IN 0 .. len - 1 LOOP
    r := p_movs->i;

    UPDATE public.ingredientes
    SET
      stock_actual = (r->>'stock_nuevo')::numeric,
      updated_at = NOW()
    WHERE id = (r->>'ingrediente_id')::uuid;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_user := NULL;
    IF (r ? 'usuario_id') AND NULLIF(TRIM(BOTH FROM r->>'usuario_id'), '') IS NOT NULL THEN
      v_user := (r->>'usuario_id')::uuid;
    END IF;

    INSERT INTO public.movimientos_ingredientes (
      tenant_id,
      ingrediente_id,
      pedido_id,
      tipo,
      cantidad,
      stock_anterior,
      stock_nuevo,
      motivo,
      usuario_id
    ) VALUES (
      (r->>'tenant_id')::uuid,
      (r->>'ingrediente_id')::uuid,
      (r->>'pedido_id')::uuid,
      'salida',
      (r->>'cantidad')::numeric,
      (r->>'stock_anterior')::numeric,
      (r->>'stock_nuevo')::numeric,
      NULLIF(r->>'motivo', ''),
      v_user
    );
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.aplicar_salidas_ingredientes_pedido(jsonb) IS
  'Actualiza stock_actual de ingredientes e inserta filas en movimientos_ingredientes (salida por venta). Payload: array JSON con tenant_id, ingrediente_id, pedido_id, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id (opcional).';

GRANT EXECUTE ON FUNCTION public.aplicar_salidas_ingredientes_pedido(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_salidas_ingredientes_pedido(jsonb) TO anon;
