-- Pruebas de 33_cambiar_mesa.sql (correr sobre schema_minimo.sql + la migración).
-- Cada bloque arma su propio tenant, así los casos no se pisan.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE OR REPLACE FUNCTION pg_temp.esperar_error(p_sql text, p_patron text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN others THEN
    IF SQLERRM NOT ILIKE '%' || p_patron || '%' THEN
      RAISE EXCEPTION 'Error inesperado. Esperaba "%", vino "%"', p_patron, SQLERRM;
    END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Se esperaba error "%" y la llamada funcionó', p_patron;
END $$;

-- Pedidos de la sesión vigente de una mesa (mismo criterio que sesionMesa.ts).
CREATE OR REPLACE FUNCTION pg_temp.sesion(p_tenant uuid, p_mesa uuid)
RETURNS SETOF uuid LANGUAGE sql AS $$
  WITH c AS (
    SELECT max(created_at) AS cutoff FROM mesa_eventos
    WHERE tenant_id = p_tenant AND mesa_id = p_mesa AND tipo = 'liberar_mesa'
  )
  SELECT p.id FROM pedidos p, c
  WHERE p.tenant_id = p_tenant AND p.mesa_id = p_mesa
    AND p.estado_pedido IN ('EDIT','FACT') AND p.estado <> 'cancelado'
    AND (c.cutoff IS NULL OR p.created_at >= c.cutoff OR EXISTS (
      SELECT 1 FROM mesa_eventos e WHERE e.tenant_id = p_tenant AND e.mesa_id = p_mesa
        AND e.pedido_id = p.id AND e.tipo IN ('ocupar_mesa','mover_pedido') AND e.created_at >= c.cutoff))
$$;

-- ---------------------------------------------------------------------------
-- 1) Camino feliz: mueve SOLO la sesión vigente (incluye pedido movido antes,
--    excluye histórico y cancelado), libera origen, ocupa destino, eventos.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t uuid := gen_random_uuid(); u uuid := gen_random_uuid();
  a uuid; b uuid; p1 uuid; p2 uuid; p3 uuid; p4 uuid; r jsonb;
  n int;
BEGIN
  INSERT INTO tenants VALUES (t); INSERT INTO usuarios VALUES (u);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO b;
  -- corte de A hace 1 hora; corte de B hace 30 min
  INSERT INTO mesa_eventos (tenant_id, mesa_id, tipo, created_at) VALUES (t, a, 'liberar_mesa', now() - interval '1 hour');
  INSERT INTO mesa_eventos (tenant_id, mesa_id, tipo, created_at) VALUES (t, b, 'liberar_mesa', now() - interval '30 minutes');
  -- p1: sesión actual de A
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 50000, now() - interval '20 minutes') RETURNING id INTO p1;
  -- p2: histórico FACT de una sesión anterior de A (NO se mueve)
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 99000, now() - interval '3 hours') RETURNING id INTO p2;
  -- p3: cancelado de la sesión actual (NO se mueve)
  INSERT INTO pedidos (tenant_id, mesa_id, total, estado, created_at) VALUES (t, a, 7000, 'cancelado', now() - interval '10 minutes') RETURNING id INTO p3;
  -- p4: creado antes del corte pero movido a A después del corte (SÍ se mueve)
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 30000, now() - interval '2 hours') RETURNING id INTO p4;
  INSERT INTO mesa_eventos (tenant_id, mesa_id, pedido_id, tipo, created_at) VALUES (t, a, p4, 'mover_pedido', now() - interval '15 minutes');

  r := cambiar_mesa(t, a, b, u);

  ASSERT (r->>'pedidos_movidos')::int = 2, 'debe mover 2 pedidos, movió ' || (r->>'pedidos_movidos');
  ASSERT (r->>'total')::numeric = 80000, 'total movido debe ser 80000';
  ASSERT (r->>'mesa_origen_numero')::int = 1 AND (r->>'mesa_destino_numero')::int = 2, 'números de mesa';
  ASSERT (SELECT mesa_id FROM pedidos WHERE id = p1) = b, 'p1 debe estar en B';
  ASSERT (SELECT mesa_id FROM pedidos WHERE id = p4) = b, 'p4 debe estar en B';
  ASSERT (SELECT mesa_id FROM pedidos WHERE id = p2) = a, 'histórico p2 queda en A';
  ASSERT (SELECT mesa_id FROM pedidos WHERE id = p3) = a, 'cancelado p3 queda en A';
  ASSERT (SELECT estado FROM mesas WHERE id = a) = 'libre', 'A debe quedar libre';
  ASSERT (SELECT estado FROM mesas WHERE id = b) = 'ocupada', 'B debe quedar ocupada';

  SELECT count(*) INTO n FROM mesa_eventos WHERE mesa_id = b AND tipo = 'mover_pedido' AND usuario_id = u
    AND payload->>'motivo' = 'cambiar_mesa' AND (payload->>'mesa_origen_id')::uuid = a;
  ASSERT n = 2, 'debe haber 2 eventos mover_pedido en B, hay ' || n;
  ASSERT (SELECT count(*) FROM mesa_eventos WHERE mesa_id = b AND tipo = 'ocupar_mesa' AND payload->>'motivo' = 'cambiar_mesa') = 1, 'ocupar_mesa en B';
  ASSERT (SELECT count(*) FROM mesa_eventos WHERE mesa_id = a AND tipo = 'liberar_mesa' AND payload->>'motivo' = 'cambiar_mesa') = 1, 'liberar_mesa en A';

  -- La sesión de B (lo que ve el resumen / cierre de cuenta) son exactamente p1 y p4.
  ASSERT (SELECT array_agg(x ORDER BY x) FROM pg_temp.sesion(t, b) x) = (SELECT array_agg(x ORDER BY x) FROM unnest(ARRAY[p1, p4]) x),
    'la sesión de B debe ser {p1,p4}';
  -- A queda sin cuenta abierta.
  ASSERT NOT EXISTS (SELECT 1 FROM pg_temp.sesion(t, a)), 'A no debe tener sesión abierta';
  RAISE NOTICE 'OK 1  camino feliz: mueve solo la sesión vigente';
END $$;

-- ---------------------------------------------------------------------------
-- 2..9) Validaciones: nada cambia cuando falla
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t uuid := gen_random_uuid(); t2 uuid := gen_random_uuid();
  a uuid; libre uuid; ocup uuid; res uuid; bloq uuid; inact uuid; virt uuid; otra uuid; p uuid;
BEGIN
  INSERT INTO tenants VALUES (t), (t2);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO libre;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 3, 'ocupada') RETURNING id INTO ocup;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 4, 'reservada') RETURNING id INTO res;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 5, 'bloqueada') RETURNING id INTO bloq;
  INSERT INTO mesas (tenant_id, numero, estado, activa) VALUES (t, 6, 'libre', false) RETURNING id INTO inact;
  INSERT INTO mesas (tenant_id, numero, estado, nombre) VALUES (t, 7, 'ocupada', '__virtual_para_llevar__') RETURNING id INTO virt;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t2, 1, 'libre') RETURNING id INTO otra;
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 1000, now() - interval '10 minutes') RETURNING id INTO p;

  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, a), 'no pueden ser la misma');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, ocup), 'no está libre');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, res), 'no está libre');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, bloq), 'no está libre');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, inact), 'inactiva');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, libre, ocup), 'no está ocupada');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, virt, libre), 'para llevar');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, otra), 'destino no existe');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t2, a, otra), 'origen no existe');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, NULL)', t, a), 'faltan parámetros');

  ASSERT (SELECT mesa_id FROM pedidos WHERE id = p) = a, 'el pedido no se movió';
  ASSERT (SELECT estado FROM mesas WHERE id = a) = 'ocupada', 'A sigue ocupada';
  ASSERT (SELECT estado FROM mesas WHERE id = libre) = 'libre', 'destino sigue libre';
  ASSERT NOT EXISTS (SELECT 1 FROM mesa_eventos WHERE tenant_id = t), 'no se escribió ningún evento';
  RAISE NOTICE 'OK 2-9 validaciones (misma mesa, destino ocupada/reservada/bloqueada/inactiva, origen libre, para llevar, otro local, parámetros)';
END $$;

-- ---------------------------------------------------------------------------
-- 10) Uniones: activa bloquea, cerrada no
-- ---------------------------------------------------------------------------
DO $$
DECLARE t uuid := gen_random_uuid(); a uuid; b uuid; c uuid; un uuid; r jsonb;
BEGIN
  INSERT INTO tenants VALUES (t);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO b;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 3, 'libre') RETURNING id INTO c;
  INSERT INTO mesa_uniones (tenant_id, estado) VALUES (t, 'activa') RETURNING id INTO un;
  INSERT INTO mesa_union_items (tenant_id, union_id, mesa_id) VALUES (t, un, a);
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, b), 'unión activa');

  UPDATE mesa_uniones SET estado = 'cerrada' WHERE id = un;
  INSERT INTO mesa_uniones (tenant_id, estado) VALUES (t, 'activa') RETURNING id INTO un;
  INSERT INTO mesa_union_items (tenant_id, union_id, mesa_id) VALUES (t, un, c);
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, c), 'unión activa');

  r := cambiar_mesa(t, a, b);
  ASSERT (SELECT estado FROM mesas WHERE id = b) = 'ocupada', 'con unión cerrada sí permite';
  RAISE NOTICE 'OK 10 uniones activas bloquean (origen y destino), cerradas no';
END $$;

-- ---------------------------------------------------------------------------
-- 11) Destino "libre" con cuenta abierta (estado desfasado) → rechaza
-- ---------------------------------------------------------------------------
DO $$
DECLARE t uuid := gen_random_uuid(); a uuid; b uuid;
BEGIN
  INSERT INTO tenants VALUES (t);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO b;
  INSERT INTO mesa_eventos (tenant_id, mesa_id, tipo, created_at) VALUES (t, b, 'liberar_mesa', now() - interval '1 hour');
  -- histórico en B (antes del corte): no debe bloquear
  INSERT INTO pedidos (tenant_id, mesa_id, created_at) VALUES (t, b, now() - interval '2 hours');
  -- abierto en B (después del corte): sí bloquea
  INSERT INTO pedidos (tenant_id, mesa_id, created_at) VALUES (t, b, now() - interval '5 minutes');
  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, b), 'tiene una cuenta abierta');
  RAISE NOTICE 'OK 11 destino libre con cuenta abierta se rechaza';
END $$;

-- Histórico en destino NO bloquea
DO $$
DECLARE t uuid := gen_random_uuid(); a uuid; b uuid; r jsonb;
BEGIN
  INSERT INTO tenants VALUES (t);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO b;
  INSERT INTO mesa_eventos (tenant_id, mesa_id, tipo, created_at) VALUES (t, b, 'liberar_mesa', now() - interval '1 hour');
  INSERT INTO pedidos (tenant_id, mesa_id, created_at) VALUES (t, b, now() - interval '2 hours');
  r := cambiar_mesa(t, a, b);
  ASSERT (r->>'pedidos_movidos')::int = 0, 'mesa ocupada sin pedidos: mueve 0';
  ASSERT (SELECT estado FROM mesas WHERE id = b) = 'ocupada' AND (SELECT estado FROM mesas WHERE id = a) = 'libre', 'estados';
  RAISE NOTICE 'OK 12 histórico en destino no bloquea; mesa ocupada sin pedidos se puede cambiar';
END $$;

-- ---------------------------------------------------------------------------
-- 13) Pedidos EDIT: reciente bloquea; hijo de división o viejo se mueve
-- ---------------------------------------------------------------------------
DO $$
DECLARE t uuid := gen_random_uuid(); a uuid; b uuid; padre uuid; hijo uuid; viejo uuid; reciente uuid; r jsonb;
BEGIN
  INSERT INTO tenants VALUES (t);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO b;
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 100, now() - interval '30 minutes') RETURNING id INTO padre;
  INSERT INTO pedidos (tenant_id, mesa_id, total, estado_pedido, created_at) VALUES (t, a, 50, 'EDIT', now() - interval '30 seconds') RETURNING id INTO hijo;
  INSERT INTO pedido_divisiones (tenant_id, pedido_padre_id, pedido_hijo_id, monto) VALUES (t, padre, hijo, 50);
  INSERT INTO pedidos (tenant_id, mesa_id, total, estado_pedido, created_at) VALUES (t, a, 10, 'EDIT', now() - interval '10 minutes') RETURNING id INTO viejo;
  INSERT INTO pedidos (tenant_id, mesa_id, total, estado_pedido, created_at) VALUES (t, a, 10, 'EDIT', now() - interval '10 seconds') RETURNING id INTO reciente;

  PERFORM pg_temp.esperar_error(format('SELECT cambiar_mesa(%L, %L, %L)', t, a, b), 'confirmándose');
  ASSERT (SELECT mesa_id FROM pedidos WHERE id = padre) = a, 'rollback: nada se movió';

  UPDATE pedidos SET estado_pedido = 'FACT' WHERE id = reciente;  -- el POS terminó de confirmar
  r := cambiar_mesa(t, a, b);
  ASSERT (r->>'pedidos_movidos')::int = 4, 'mueve padre, hijo de división, EDIT viejo y el recién confirmado';
  ASSERT (SELECT count(*) FROM pedidos WHERE mesa_id = b) = 4, '4 pedidos en B';
  RAISE NOTICE 'OK 13 EDIT en confirmación bloquea; divisiones y EDIT viejos se mueven';
END $$;

-- ---------------------------------------------------------------------------
-- 14) Ida y vuelta A→B→A en transacciones separadas: la cuenta sigue entera
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE ctx (t uuid, a uuid, b uuid, c uuid, p1 uuid, p2 uuid);
DO $$
DECLARE t uuid := gen_random_uuid(); a uuid; b uuid; c uuid; p1 uuid; p2 uuid;
BEGIN
  INSERT INTO tenants VALUES (t);
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 1, 'ocupada') RETURNING id INTO a;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 2, 'libre') RETURNING id INTO b;
  INSERT INTO mesas (tenant_id, numero, estado) VALUES (t, 3, 'libre') RETURNING id INTO c;
  INSERT INTO mesa_eventos (tenant_id, mesa_id, tipo, created_at) VALUES (t, a, 'liberar_mesa', now() - interval '2 hours');
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 10, now() - interval '1 hour') RETURNING id INTO p1;
  INSERT INTO pedidos (tenant_id, mesa_id, total, created_at) VALUES (t, a, 20, now() - interval '50 minutes') RETURNING id INTO p2;
  INSERT INTO ctx VALUES (t, a, b, c, p1, p2);
END $$;
SELECT cambiar_mesa(t, a, b) IS NOT NULL AS ok_ab FROM ctx;
SELECT cambiar_mesa(t, b, c) IS NOT NULL AS ok_bc FROM ctx;
SELECT cambiar_mesa(t, c, a) IS NOT NULL AS ok_ca FROM ctx;
DO $$
DECLARE x ctx%ROWTYPE;
BEGIN
  SELECT * INTO x FROM ctx;
  ASSERT (SELECT count(*) FROM pg_temp.sesion(x.t, x.a)) = 2, 'tras A→B→C→A la sesión de A tiene los 2 pedidos';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_temp.sesion(x.t, x.b)), 'B sin sesión';
  ASSERT NOT EXISTS (SELECT 1 FROM pg_temp.sesion(x.t, x.c)), 'C sin sesión';
  ASSERT (SELECT estado FROM mesas WHERE id = x.a) = 'ocupada', 'A ocupada';
  ASSERT (SELECT estado FROM mesas WHERE id = x.b) = 'libre' AND (SELECT estado FROM mesas WHERE id = x.c) = 'libre', 'B y C libres';
  RAISE NOTICE 'OK 14 ida y vuelta A→B→C→A conserva la cuenta completa';
END $$;

-- ---------------------------------------------------------------------------
-- 15) Permisos: anon/authenticated pueden ejecutar
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  ASSERT has_function_privilege('anon', 'public.cambiar_mesa(uuid, uuid, uuid, uuid)', 'EXECUTE'), 'anon EXECUTE';
  ASSERT has_function_privilege('authenticated', 'public.cambiar_mesa(uuid, uuid, uuid, uuid)', 'EXECUTE'), 'authenticated EXECUTE';
  RAISE NOTICE 'OK 15 grants';
END $$;
