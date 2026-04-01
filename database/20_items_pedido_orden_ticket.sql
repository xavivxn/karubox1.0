-- Orden explícito para impresión/cocina.
-- Evita depender de UUID/created_at para el orden del ticket.

ALTER TABLE public.items_pedido
  ADD COLUMN IF NOT EXISTS orden_ticket INTEGER;

CREATE INDEX IF NOT EXISTS idx_items_pedido_orden_ticket
  ON public.items_pedido(pedido_id, orden_ticket);

COMMENT ON COLUMN public.items_pedido.orden_ticket IS
  'Orden deseado de impresión en ticket/cocina (menor = se imprime primero).';

