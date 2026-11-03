-- =============================================================================
-- 37_rls_por_local_rollback.sql — deja todo como estaba antes de 37_rls_por_local.sql
-- (aplicada en prod el 2026-11-03). Tarda segundos; usar si algo deja de funcionar.
-- =============================================================================
BEGIN;

DO $rb$
DECLARE t text;
BEGIN
  FOR t IN SELECT DISTINCT tablename FROM pg_policies
           WHERE schemaname = 'public' AND policyname IN ('rls_local', 'rls_owner', 'rls_agente_lectura')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS rls_local ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS rls_owner ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS rls_agente_lectura ON public.%I', t);
  END LOOP;
END
$rb$;

ALTER TABLE public.campanas_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_envios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido_customizacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_reservas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_union_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_uniones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_ingredientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_cash_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_monthly_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_partner_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_divisiones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_trace_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_producto DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_facturacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_pedido_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_puntos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- Políticas que existían antes (permisivas)
CREATE POLICY authenticated_insert_pedidos ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY authenticated_update_pedidos ON public.pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY authenticated_select_pedidos ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY pedidos_auth_full_access ON public.pedidos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY anon_insert_pedidos ON public.pedidos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY anon_update_pedidos ON public.pedidos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY authenticated_select_printer_config ON public.printer_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.combo_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.combo_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users" ON public.combo_items FOR DELETE TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.combo_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON public.combo_items FOR SELECT TO public USING (true);
CREATE POLICY combo_items_select_all_authenticated ON public.combo_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON public.combo_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON public.combo_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update access for authenticated users" ON public.combo_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON public.combo_items FOR DELETE TO authenticated USING (true);

ALTER VIEW public.vista_clientes_con_ultima_visita SET (security_invoker = false);
ALTER VIEW public.vista_cuenta_corriente_puntos SET (security_invoker = false);
ALTER VIEW public.vista_consumo_ingredientes SET (security_invoker = false);
ALTER VIEW public.vista_ingredientes_stock_bajo SET (security_invoker = false);
ALTER VIEW public.vista_stock_bajo SET (security_invoker = false);
GRANT SELECT ON public.vista_clientes_con_ultima_visita, public.vista_consumo_ingredientes,
  public.vista_ingredientes_stock_bajo TO anon;

DROP FUNCTION IF EXISTS public.es_owner();
DROP FUNCTION IF EXISTS public.current_tenant_id();

COMMIT;
