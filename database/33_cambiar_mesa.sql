-- =============================================================================
-- 33_cambiar_mesa.sql
--
-- "Cambiar mesa": mueve TODA la cuenta abierta (sesión vigente) de una mesa
-- ocupada a una mesa libre, en una sola transacción.
--
-- Por qué una RPC nueva y no `mover_pedido_mesa` (v27):
--   - `mover_pedido_mesa` mueve UN pedido y libera la mesa origen aunque le
--     queden otros pedidos abiertos (la cuenta quedaba partida y la mitad
--     "desaparecía" del resumen al cortar la sesión con `liberar_mesa`).
--   - No valida la mesa destino (podía mezclar dos cuentas sin querer).
--   - Sin locks: dos mozos cambiando a la vez podían dejar estados cruzados.
--
-- Sesión de mesa (mismo criterio que src/features/mesas/services/sesionMesa.ts):
--   corte = último `liberar_mesa` de la mesa; pertenecen a la sesión los
--   pedidos EDIT/FACT no cancelados creados en/después del corte, o vinculados
--   a la mesa después del corte por eventos `ocupar_mesa`/`mover_pedido`.
--
-- Efectos (todos con el mismo now() de la transacción):
--   1) pedidos de la sesión → mesa_id = destino
--   2) un evento `mover_pedido` por pedido en la mesa destino (así el resumen y
--      el cierre de cuenta de la mesa destino los incluyen aunque su created_at
--      sea anterior al último corte de la mesa destino)
--   3) mesa destino → 'ocupada' + evento `ocupar_mesa`
--   4) mesa origen  → 'libre'   + evento `liberar_mesa` (cierra su sesión)
--
-- No toca facturas, puntos, inventario ni cola de impresión.
-- No requiere cambios de esquema: usa tipos de evento ya existentes.
-- Idempotente: CREATE OR REPLACE.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.cambiar_mesa(
  p_tenant_id uuid,
  p_mesa_origen_id uuid,
  p_mesa_destino_id uuid,
  p_usuario_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_origen  public.mesas%ROWTYPE;
  v_destino public.mesas%ROWTYPE;
  v_mesa    public.mesas%ROWTYPE;
  v_cutoff_origen  timestamptz;
  v_cutoff_destino timestamptz;
  v_pedido_ids uuid[];
  v_total numeric;
  v_abiertos_destino integer;
  v_edit_en_curso integer;
BEGIN
  IF p_tenant_id IS NULL OR p_mesa_origen_id IS NULL OR p_mesa_destino_id IS NULL THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: faltan parámetros.';
  END IF;

  IF p_mesa_origen_id = p_mesa_destino_id THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: la mesa origen y destino no pueden ser la misma.';
  END IF;

  -- Lock de ambas mesas en orden estable (evita deadlock si dos mozos cruzan A<->B).
  FOR v_mesa IN
    SELECT * FROM public.mesas
    WHERE id IN (p_mesa_origen_id, p_mesa_destino_id)
      AND tenant_id = p_tenant_id
    ORDER BY id
    FOR UPDATE
  LOOP
    IF v_mesa.id = p_mesa_origen_id THEN v_origen := v_mesa; ELSE v_destino := v_mesa; END IF;
  END LOOP;

  IF v_origen.id IS NULL THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: la mesa origen no existe en este local.';
  END IF;
  IF v_destino.id IS NULL THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: la mesa destino no existe en este local.';
  END IF;
  IF NOT v_origen.activa OR NOT v_destino.activa THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: una de las mesas está inactiva.';
  END IF;
  IF lower(coalesce(v_origen.nombre, '')) LIKE '%virtual_para_llevar%'
     OR lower(coalesce(v_destino.nombre, '')) LIKE '%virtual_para_llevar%' THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: las cuentas para llevar no se pueden cambiar de mesa.';
  END IF;
  IF v_origen.estado <> 'ocupada' THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: la mesa #% no está ocupada (estado: %).', v_origen.numero, v_origen.estado;
  END IF;
  IF v_destino.estado <> 'libre' THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: la mesa #% no está libre (estado: %).', v_destino.numero, v_destino.estado;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.mesa_union_items i
    JOIN public.mesa_uniones u ON u.id = i.union_id
    WHERE i.tenant_id = p_tenant_id
      AND u.estado = 'activa'
      AND i.mesa_id IN (p_mesa_origen_id, p_mesa_destino_id)
  ) THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: una de las mesas está en una unión activa. Cerrá la unión primero.';
  END IF;

  -- Sesión vigente de la mesa origen.
  SELECT max(created_at) INTO v_cutoff_origen
  FROM public.mesa_eventos
  WHERE tenant_id = p_tenant_id AND mesa_id = p_mesa_origen_id AND tipo = 'liberar_mesa';

  WITH sesion AS (
    SELECT p.id, p.total
    FROM public.pedidos p
    WHERE p.tenant_id = p_tenant_id
      AND p.mesa_id = p_mesa_origen_id
      AND p.estado_pedido IN ('EDIT', 'FACT')
      AND p.estado <> 'cancelado'
      AND (
        v_cutoff_origen IS NULL
        OR p.created_at >= v_cutoff_origen
        OR EXISTS (
          SELECT 1 FROM public.mesa_eventos e
          WHERE e.tenant_id = p_tenant_id
            AND e.mesa_id = p_mesa_origen_id
            AND e.pedido_id = p.id
            AND e.tipo IN ('ocupar_mesa', 'mover_pedido')
            AND e.created_at >= v_cutoff_origen
        )
      )
    FOR UPDATE OF p
  )
  SELECT coalesce(array_agg(id), ARRAY[]::uuid[]), coalesce(sum(total), 0)
  INTO v_pedido_ids, v_total
  FROM sesion;

  -- Pedido que se está confirmando ahora mismo en el POS (EDIT reciente que no
  -- es parte contable de una división): si lo movemos, el POS lo marca FACT y
  -- vuelve a ocupar la mesa origen. Pedimos reintentar en unos segundos.
  SELECT count(*) INTO v_edit_en_curso
  FROM public.pedidos p
  WHERE p.id = ANY (v_pedido_ids)
    AND p.estado_pedido = 'EDIT'
    AND p.created_at > now() - interval '2 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM public.pedido_divisiones d WHERE d.pedido_hijo_id = p.id
    );
  IF v_edit_en_curso > 0 THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: hay un pedido confirmándose en la mesa #%. Reintentá en unos segundos.', v_origen.numero;
  END IF;

  -- La mesa destino no puede tener una cuenta abierta (estado desfasado).
  SELECT max(created_at) INTO v_cutoff_destino
  FROM public.mesa_eventos
  WHERE tenant_id = p_tenant_id AND mesa_id = p_mesa_destino_id AND tipo = 'liberar_mesa';

  SELECT count(*) INTO v_abiertos_destino
  FROM public.pedidos p
  WHERE p.tenant_id = p_tenant_id
    AND p.mesa_id = p_mesa_destino_id
    AND p.estado_pedido IN ('EDIT', 'FACT')
    AND p.estado <> 'cancelado'
    AND (v_cutoff_destino IS NULL OR p.created_at >= v_cutoff_destino);
  IF v_abiertos_destino > 0 THEN
    RAISE EXCEPTION 'CAMBIAR_MESA: la mesa #% tiene una cuenta abierta.', v_destino.numero;
  END IF;

  -- 1) Mover pedidos
  IF coalesce(array_length(v_pedido_ids, 1), 0) > 0 THEN
    UPDATE public.pedidos
    SET mesa_id = p_mesa_destino_id, updated_at = now()
    WHERE id = ANY (v_pedido_ids) AND tenant_id = p_tenant_id;

    -- 2) Vincular cada pedido a la sesión de la mesa destino
    INSERT INTO public.mesa_eventos (tenant_id, mesa_id, pedido_id, usuario_id, tipo, payload)
    SELECT p_tenant_id, p_mesa_destino_id, pid, p_usuario_id, 'mover_pedido',
           jsonb_build_object(
             'motivo', 'cambiar_mesa',
             'mesa_origen_id', p_mesa_origen_id,
             'mesa_destino_id', p_mesa_destino_id
           )
    FROM unnest(v_pedido_ids) AS pid;
  END IF;

  -- 3) Ocupar destino
  UPDATE public.mesas SET estado = 'ocupada', updated_at = now()
  WHERE id = p_mesa_destino_id AND tenant_id = p_tenant_id;
  INSERT INTO public.mesa_eventos (tenant_id, mesa_id, usuario_id, tipo, payload)
  VALUES (p_tenant_id, p_mesa_destino_id, p_usuario_id, 'ocupar_mesa',
          jsonb_build_object('motivo', 'cambiar_mesa', 'mesa_origen_id', p_mesa_origen_id));

  -- 4) Liberar origen (corta su sesión)
  UPDATE public.mesas SET estado = 'libre', updated_at = now()
  WHERE id = p_mesa_origen_id AND tenant_id = p_tenant_id;
  INSERT INTO public.mesa_eventos (tenant_id, mesa_id, usuario_id, tipo, payload)
  VALUES (p_tenant_id, p_mesa_origen_id, p_usuario_id, 'liberar_mesa',
          jsonb_build_object('motivo', 'cambiar_mesa', 'mesa_destino_id', p_mesa_destino_id));

  RETURN jsonb_build_object(
    'pedidos_movidos', coalesce(array_length(v_pedido_ids, 1), 0),
    'pedido_ids', to_jsonb(v_pedido_ids),
    'total', v_total,
    'mesa_origen_numero', v_origen.numero,
    'mesa_destino_numero', v_destino.numero
  );
END;
$$;

COMMENT ON FUNCTION public.cambiar_mesa(uuid, uuid, uuid, uuid) IS
  'Mueve la cuenta abierta (sesión vigente) de una mesa ocupada a una mesa libre de forma atómica.';

GRANT EXECUTE ON FUNCTION public.cambiar_mesa(uuid, uuid, uuid, uuid) TO anon, authenticated;

COMMIT;
