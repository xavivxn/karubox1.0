-- =============================================================================
-- 37_rls_por_local.sql — Auditoría 2026-11-03, Fase 2: aislamiento entre locales.
-- Rollback: 37_rls_por_local_rollback.sql
-- Aplicada en prod el 2026-11-03. Probada antes en un bloque revertido: 34/34 OK.
--
-- - Usuarios de un local (authenticated): solo filas de SU local en todas las tablas.
-- - Owner: todo (panel /owner).
-- - anon = agente de impresión: conserva lo que usa (logs 48 h): SELECT en pedidos,
--   mesas, tenants, printer_config, reprint_solicitud, vista_items_ticket_cocina,
--   vista_factura_impresion y rpc/log_print_event. El resto de lo que anon leía queda cerrado.
-- - Vistas sin uso del agente pasan a security_invoker (respetan RLS) y anon no las lee.
-- - Pendiente Fase 2b: identidad propia para el agente y cerrar sus lecturas anon y las
--   2 vistas de impresión (siguen como security definer).
-- =============================================================================

-- 1) Helpers (SECURITY DEFINER: leen usuarios sin pasar por su propia RLS) ------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT u.tenant_id FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid() AND u.is_deleted = false AND coalesce(u.activo, true)
  LIMIT 1
$fn$;

CREATE OR REPLACE FUNCTION public.es_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid() AND u.rol = 'owner' AND u.is_deleted = false
  )
$fn$;

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.es_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.es_owner() TO authenticated, service_role;

-- 2) Limpiar políticas permisivas (USING true) ---------------------------------
DROP POLICY IF EXISTS authenticated_insert_pedidos ON public.pedidos;
DROP POLICY IF EXISTS authenticated_update_pedidos ON public.pedidos;
DROP POLICY IF EXISTS authenticated_select_pedidos ON public.pedidos;
DROP POLICY IF EXISTS pedidos_auth_full_access ON public.pedidos;
DROP POLICY IF EXISTS anon_insert_pedidos ON public.pedidos;
DROP POLICY IF EXISTS anon_update_pedidos ON public.pedidos;
DROP POLICY IF EXISTS authenticated_select_printer_config ON public.printer_config;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.combo_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.combo_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.combo_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.combo_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.combo_items;
DROP POLICY IF EXISTS combo_items_select_all_authenticated ON public.combo_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.combo_items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.combo_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.combo_items;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.combo_items;

-- 3) Activar RLS donde faltaba ------------------------------------------------
ALTER TABLE public.campanas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanas_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido_customizacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_union_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesa_uniones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_partner_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_divisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_trace_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_facturacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_pedido_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 4) Política "su local" en tablas con tenant_id -------------------------------
CREATE POLICY rls_local ON public.campanas_config FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.campanas_envios FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.categorias FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.clientes FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.combo_items FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.empleados FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.facturas FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.ingredientes FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.inventario FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.mesa_eventos FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.mesa_reservas FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.mesa_union_items FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.mesa_uniones FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.mesas FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.movimientos_ingredientes FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.movimientos_inventario FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.pedido_divisiones FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.pedidos FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.productos FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.promociones FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.recetas_producto FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.tenant_facturacion FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.tenant_pedido_counters FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
CREATE POLICY rls_local ON public.transacciones_puntos FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
-- usuarios: escrituras igual pasan por trg_guard_escritura (Fase 1).
CREATE POLICY rls_local ON public.usuarios FOR ALL TO authenticated
  USING (tenant_id = (SELECT public.current_tenant_id())) WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));
-- tenants: su propio local (altas y bajas solo owner, por trg_guard_escritura).
CREATE POLICY rls_local ON public.tenants FOR ALL TO authenticated
  USING (id = (SELECT public.current_tenant_id())) WITH CHECK (id = (SELECT public.current_tenant_id()));

-- items sin tenant_id: a través del pedido
CREATE POLICY rls_local ON public.items_pedido FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = items_pedido.pedido_id AND p.tenant_id = (SELECT public.current_tenant_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = items_pedido.pedido_id AND p.tenant_id = (SELECT public.current_tenant_id())));
CREATE POLICY rls_local ON public.items_pedido_customizacion FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.items_pedido i JOIN public.pedidos p ON p.id = i.pedido_id
                 WHERE i.id = items_pedido_customizacion.item_pedido_id AND p.tenant_id = (SELECT public.current_tenant_id())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.items_pedido i JOIN public.pedidos p ON p.id = i.pedido_id
                 WHERE i.id = items_pedido_customizacion.item_pedido_id AND p.tenant_id = (SELECT public.current_tenant_id())));

-- 5) Owner: todo, en todas las tablas -----------------------------------------
CREATE POLICY rls_owner ON public.campanas_config FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.campanas_envios FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.categorias FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.clientes FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.cocina_achievement_store FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.combo_items FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.empleados FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.facturas FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.ingredientes FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.inventario FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.items_pedido FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.items_pedido_customizacion FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.mesa_eventos FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.mesa_reservas FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.mesa_union_items FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.mesa_uniones FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.mesas FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.movimientos_ingredientes FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.movimientos_inventario FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.owner_cash_movements FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.owner_monthly_expenses FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.owner_partner_balances FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.pedido_divisiones FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.pedidos FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.print_trace_events FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.printer_config FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.productos FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.promociones FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.recetas_producto FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.reprint_solicitud FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.sesiones_caja FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.tenant_facturacion FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.tenant_pedido_counters FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.tenants FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.transacciones_puntos FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));
CREATE POLICY rls_owner ON public.usuarios FOR ALL TO authenticated USING ((SELECT public.es_owner())) WITH CHECK ((SELECT public.es_owner()));

-- 6) Agente de impresión (anon): solo lo que usa --------------------------------
-- pedidos, printer_config y reprint_solicitud ya tienen su política anon de lectura.
CREATE POLICY rls_agente_lectura ON public.mesas FOR SELECT TO anon USING (true);
CREATE POLICY rls_agente_lectura ON public.tenants FOR SELECT TO anon USING (true);

-- 7) Vistas que no usa el agente: respetan RLS y anon no las lee ---------------
ALTER VIEW public.vista_clientes_con_ultima_visita SET (security_invoker = true);
ALTER VIEW public.vista_cuenta_corriente_puntos SET (security_invoker = true);
ALTER VIEW public.vista_consumo_ingredientes SET (security_invoker = true);
ALTER VIEW public.vista_ingredientes_stock_bajo SET (security_invoker = true);
ALTER VIEW public.vista_stock_bajo SET (security_invoker = true);
REVOKE SELECT ON public.vista_clientes_con_ultima_visita, public.vista_cuenta_corriente_puntos,
  public.vista_consumo_ingredientes, public.vista_ingredientes_stock_bajo, public.vista_stock_bajo FROM anon;
