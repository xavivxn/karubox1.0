-- Notas por ítem en vista de ticket cocina (reimpresión HTTP alineada al ticket original)
DROP VIEW IF EXISTS public.vista_items_ticket_cocina;
CREATE VIEW public.vista_items_ticket_cocina AS
SELECT
  ip.pedido_id,
  ip.id AS item_pedido_id,
  ip.producto_nombre,
  ip.cantidad,
  ip.precio_unitario,
  ip.subtotal,
  ip.notas AS notas_item,
  COALESCE(
    (
      SELECT string_agg(
        CASE c.tipo
          WHEN 'removido' THEN 'Sin ' || i.nombre
          WHEN 'extra' THEN 'Extra ' || i.nombre || ' (+' || (c.cantidad_ajustada - c.cantidad_original)::TEXT || ')'
          WHEN 'modificado' THEN i.nombre || ' ' || c.cantidad_original::TEXT || '→' || c.cantidad_ajustada::TEXT
          ELSE i.nombre
        END,
        ' · '
        ORDER BY c.tipo, i.nombre
      )
      FROM items_pedido_customizacion c
      JOIN ingredientes i ON i.id = c.ingrediente_id
      WHERE c.item_pedido_id = ip.id
    ),
    ''
  ) AS modificaciones
FROM items_pedido ip;

COMMENT ON VIEW vista_items_ticket_cocina IS 'Items de pedido con texto de modificaciones para ticket de cocina (sin X, extra Y) y notas por ítem.';

GRANT SELECT ON vista_items_ticket_cocina TO anon;
GRANT SELECT ON vista_items_ticket_cocina TO authenticated;
