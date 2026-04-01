-- Correlativo de pedido: después de 999 vuelve a 1.
-- Aplicar en Supabase: SQL Editor → pegar y ejecutar.
--
-- Nota: existe UNIQUE (tenant_id, numero_pedido) en pedidos. Si ya hay un pedido
-- histórico con número 1, el siguiente ciclo puede fallar por duplicado hasta que
-- esos números no existan en filas vigentes (o se relaja la restricción en BD).

CREATE OR REPLACE FUNCTION obtener_siguiente_numero_pedido(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nuevo_numero INTEGER;
BEGIN
  INSERT INTO tenant_pedido_counters (tenant_id, ultimo_numero)
  VALUES (p_tenant_id, 1)
  ON CONFLICT (tenant_id) DO UPDATE
    SET ultimo_numero = CASE
      WHEN tenant_pedido_counters.ultimo_numero >= 999 THEN 1
      ELSE tenant_pedido_counters.ultimo_numero + 1
    END,
    updated_at = NOW()
  RETURNING tenant_pedido_counters.ultimo_numero INTO nuevo_numero;

  RETURN nuevo_numero;
END;
$$;

COMMENT ON FUNCTION obtener_siguiente_numero_pedido(UUID) IS
  'Siguiente número de pedido por tenant; tras 999 continúa en 1.';
