-- ============================================
-- VISTA: Factura completa para impresión / servicio
-- ============================================
-- Expone una sola fila por factura con todos los datos que debe tener
-- una factura fiscal: emisor, receptor, timbrado, numeración, detalle con IVA, total.
-- La impresora (agente) o el servicio de facturación pueden consultar por
-- factura_id o pedido_id.
-- ============================================

DROP VIEW IF EXISTS public.vista_factura_impresion;

CREATE VIEW public.vista_factura_impresion AS
SELECT
  f.id AS factura_id,
  f.pedido_id,
  f.tenant_id,
  p.numero_pedido,

  -- EMISOR (local/tenant)
  t.ruc AS emisor_ruc,
  COALESCE(t.razon_social, t.nombre) AS emisor_razon_social,
  t.direccion AS emisor_direccion,
  t.telefono AS emisor_telefono,
  t.email AS emisor_email,
  t.actividad_economica AS emisor_actividad_economica,

  -- RECEPTOR (cliente)
  c.ruc AS receptor_ruc,
  c.ci AS receptor_ci,
  c.nombre AS receptor_nombre,
  c.direccion AS receptor_direccion,
  c.telefono AS receptor_telefono,
  c.email AS receptor_email,

  -- DOCUMENTO (timbrado vigente, numeración, fecha)
  f.numero_factura,
  f.timbrado,
  tf.vigencia_inicio AS timbrado_vigencia_inicio,
  tf.vigencia_fin AS timbrado_vigencia_fin,
  f.fecha_emision,

  -- TOTALES
  f.total_iva_10,
  f.total_iva_5,
  f.total_exento,
  f.total AS total_a_pagar,
  f.total_letras,

  -- DETALLE (productos/servicios con IVA discriminado) como JSONB
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'producto_nombre', ip.producto_nombre,
          'cantidad', ip.cantidad,
          'precio_unitario', ip.precio_unitario,
          'subtotal', ip.subtotal,
          'iva_porcentaje', ip.iva_porcentaje,
          'monto_iva', ip.monto_iva
        )
        ORDER BY ip.created_at
      ),
      '[]'::jsonb
    )
    FROM public.items_pedido ip
    WHERE ip.pedido_id = f.pedido_id
  ) AS detalle

FROM public.facturas f
JOIN public.tenants t ON t.id = f.tenant_id AND t.is_deleted = false
JOIN public.pedidos p ON p.id = f.pedido_id
LEFT JOIN public.clientes c ON c.id = f.cliente_id AND (c.is_deleted = false OR c.is_deleted IS NULL)
LEFT JOIN public.tenant_facturacion tf ON tf.tenant_id = f.tenant_id;

COMMENT ON VIEW public.vista_factura_impresion IS 'Factura completa para impresión: emisor (RUC, razón social, dirección), receptor, timbrado vigente, numeración, fecha, detalle con IVA 5%/10%, total a pagar. Consultar por factura_id o pedido_id.';

GRANT SELECT ON public.vista_factura_impresion TO anon;
GRANT SELECT ON public.vista_factura_impresion TO authenticated;

-- ============================================
-- USO POR LA IMPRESORA / AGENTE
-- ============================================
-- La impresora puede consultar esta vista igual que pedidos:
--
--   Por pedido (cuando Realtime notifica un pedido facturado):
--   SELECT * FROM vista_factura_impresion WHERE pedido_id = 'uuid-del-pedido';
--
--   Por factura (si el agente escucha la tabla facturas):
--   SELECT * FROM vista_factura_impresion WHERE factura_id = 'uuid-de-la-factura';
--
-- Una sola fila trae: emisor (RUC, razón social, dirección), receptor,
-- timbrado vigente, numeración, fecha, detalle (JSONB con IVA por línea), total.
-- ============================================
