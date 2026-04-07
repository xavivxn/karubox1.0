-- Retorno en puntos configurable por tenant (1%, 5% o 10% del total del pedido).
-- Ejecutar en Supabase SQL Editor o como migración incremental.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS puntos_retorno_pct INTEGER NOT NULL DEFAULT 5;

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_puntos_retorno_pct_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_puntos_retorno_pct_check
  CHECK (puntos_retorno_pct IN (1, 5, 10));

COMMENT ON COLUMN public.tenants.puntos_retorno_pct IS
  'Retorno automático en puntos: % del total del pedido (1, 5 u 10). Los puntos_extra por producto se suman en la app.';

-- Sustituir función de un solo argumento por versión con porcentaje (default 5 = comportamiento histórico).
DROP FUNCTION IF EXISTS public.calcular_puntos_por_monto(numeric);

CREATE OR REPLACE FUNCTION public.calcular_puntos_por_monto(monto numeric, porcentaje integer DEFAULT 5)
RETURNS integer
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT FLOOR(monto * (porcentaje::numeric / 100.0))::integer;
$$;

COMMENT ON FUNCTION public.calcular_puntos_por_monto(numeric, integer) IS
  'Puntos automáticos por monto: floor(monto * porcentaje/100). Porcentaje típico 1, 5 o 10.';

-- RPC usada por el cliente: añade p_tenant_id opcional para leer % del tenant.
DROP FUNCTION IF EXISTS public.calcular_puntos(numeric, integer);

CREATE OR REPLACE FUNCTION public.calcular_puntos(
  monto numeric,
  dia_semana integer DEFAULT NULL,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_pct integer;
BEGIN
  v_pct := 5;
  IF p_tenant_id IS NOT NULL THEN
    SELECT t.puntos_retorno_pct INTO v_pct
    FROM public.tenants t
    WHERE t.id = p_tenant_id;
    IF v_pct IS NULL THEN
      v_pct := 5;
    END IF;
  END IF;
  RETURN public.calcular_puntos_por_monto(monto, v_pct);
END;
$$;

-- Trigger: fallback cuando puntos_generados es 0/NULL debe usar el % del tenant.
CREATE OR REPLACE FUNCTION public.acreditar_puntos_pedido()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  puntos_a_acreditar integer;
  saldo_anterior integer;
  saldo_nuevo integer;
  cliente_tenant_id uuid;
  v_pct integer;
BEGIN
  IF NEW.estado = 'entregado' AND (
    TG_OP = 'INSERT' OR
    (TG_OP = 'UPDATE' AND (OLD.estado IS NULL OR OLD.estado != 'entregado'))
  ) THEN
    IF NEW.cliente_id IS NOT NULL THEN
      SELECT tenant_id INTO cliente_tenant_id
      FROM clientes
      WHERE id = NEW.cliente_id;

      IF cliente_tenant_id IS NULL OR cliente_tenant_id != NEW.tenant_id THEN
        RAISE EXCEPTION 'El cliente no pertenece al mismo tenant del pedido';
      END IF;

      IF NEW.puntos_generados IS NULL OR NEW.puntos_generados = 0 THEN
        v_pct := 5;
        SELECT t.puntos_retorno_pct INTO v_pct
        FROM public.tenants t
        WHERE t.id = NEW.tenant_id;
        IF v_pct IS NULL THEN
          v_pct := 5;
        END IF;
        puntos_a_acreditar := public.calcular_puntos_por_monto(NEW.total, v_pct);
      ELSE
        puntos_a_acreditar := NEW.puntos_generados;
      END IF;

      SELECT puntos_totales INTO saldo_anterior
      FROM clientes
      WHERE id = NEW.cliente_id AND tenant_id = NEW.tenant_id;

      saldo_nuevo := saldo_anterior + puntos_a_acreditar;

      UPDATE clientes
      SET puntos_totales = saldo_nuevo, updated_at = NOW()
      WHERE id = NEW.cliente_id AND tenant_id = NEW.tenant_id;

      INSERT INTO transacciones_puntos (
        tenant_id, cliente_id, pedido_id, tipo, puntos, saldo_anterior, saldo_nuevo, descripcion
      ) VALUES (
        NEW.tenant_id, NEW.cliente_id, NEW.id, 'ganado', puntos_a_acreditar, saldo_anterior, saldo_nuevo,
        'Puntos ganados por pedido #' || NEW.numero_pedido || ' - Total: ' || NEW.total
      );

      UPDATE pedidos SET puntos_generados = puntos_a_acreditar WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
