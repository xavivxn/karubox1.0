-- ============================================
-- Auditoría de cancelación de pedidos y facturas
-- ============================================
-- Permite registrar quién/cuándo/motivo al anular un pedido
-- y marcar facturas como anuladas sin borrarlas.

-- Pedidos: campos de anulación
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS cancelado_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT;

COMMENT ON COLUMN public.pedidos.cancelado_por_id IS 'Usuario (admin) que anuló el pedido';
COMMENT ON COLUMN public.pedidos.cancelado_at IS 'Fecha/hora de anulación';
COMMENT ON COLUMN public.pedidos.motivo_cancelacion IS 'Motivo opcional de la anulación (auditoría)';

-- Facturas: marcar como anulada (no se borra el registro fiscal)
ALTER TABLE public.facturas
  ADD COLUMN IF NOT EXISTS anulada BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anulada_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anulada_por_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.facturas.anulada IS 'Si true, la factura está anulada (documento no válido)';
COMMENT ON COLUMN public.facturas.anulada_at IS 'Fecha/hora de anulación';
COMMENT ON COLUMN public.facturas.anulada_por_id IS 'Usuario que anuló la factura';

CREATE INDEX IF NOT EXISTS idx_pedidos_cancelado_at ON public.pedidos(tenant_id, cancelado_at) WHERE cancelado_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facturas_anulada ON public.facturas(tenant_id, anulada) WHERE anulada = true;
