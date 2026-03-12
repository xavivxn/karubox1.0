-- ============================================
-- MIGRACIÓN: FACTURACIÓN (DNIT / Paraguay)
-- Version: 1.0
-- ============================================
-- Agrega tablas y columnas para facturación después de imprimir:
-- - Datos del emisor (tenant/local)
-- - Timbrado y numeración consecutiva
-- - Datos del receptor (cliente) y documento
-- - IVA discriminado (10%, 5%, exento) en productos e ítems
-- ============================================

-- --------------------------------------------
-- 1. TENANTS (LOCAL) - Datos del emisor
-- --------------------------------------------
-- RUC, dirección, teléfono y email ya existen.
-- Agregamos razón social (nombre legal para factura) y actividad económica.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS razon_social TEXT,
  ADD COLUMN IF NOT EXISTS actividad_economica TEXT;

COMMENT ON COLUMN public.tenants.razon_social IS 'Razón social o nombre completo del dueño/empresa para factura (si NULL se usa nombre)';
COMMENT ON COLUMN public.tenants.actividad_economica IS 'Breve descripción de la actividad económica del negocio';

-- --------------------------------------------
-- 2. CLIENTES - Datos del receptor
-- --------------------------------------------
-- Ya tienen: ci, ruc, nombre, direccion.
-- Agregamos pasaporte para clientes extranjeros.

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS pasaporte TEXT;

COMMENT ON COLUMN public.clientes.pasaporte IS 'Número de pasaporte para clientes extranjeros (si no tienen RUC/CI)';

-- --------------------------------------------
-- 3. CONFIGURACIÓN DE FACTURACIÓN POR TENANT
-- --------------------------------------------
-- Timbrado (8 dígitos DNIT), vigencia, numeración 001-001-0000001

CREATE TABLE IF NOT EXISTS public.tenant_facturacion (
  tenant_id UUID NOT NULL PRIMARY KEY,
  timbrado TEXT NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fin DATE NOT NULL,
  establecimiento TEXT NOT NULL DEFAULT '001',
  punto_expedicion TEXT NOT NULL DEFAULT '001',
  ultimo_numero INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT tenant_facturacion_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT tenant_facturacion_timbrado_len CHECK (char_length(timbrado) = 8),
  CONSTRAINT tenant_facturacion_estab_len CHECK (char_length(establecimiento) = 3),
  CONSTRAINT tenant_facturacion_punto_len CHECK (char_length(punto_expedicion) = 3),
  CONSTRAINT tenant_facturacion_ultimo_numero_check CHECK (ultimo_numero >= 0)
);

COMMENT ON TABLE public.tenant_facturacion IS 'Configuración de facturación por local: timbrado DNIT, vigencia y numeración consecutiva (001-001-0000001)';
COMMENT ON COLUMN public.tenant_facturacion.timbrado IS 'Número de 8 dígitos otorgado por la DNIT';
COMMENT ON COLUMN public.tenant_facturacion.establecimiento IS 'Primeros 3 dígitos del número de factura';
COMMENT ON COLUMN public.tenant_facturacion.punto_expedicion IS 'Siguientes 3 dígitos (punto de expedición)';
COMMENT ON COLUMN public.tenant_facturacion.ultimo_numero IS 'Última secuencia de 7 dígitos usada';

CREATE INDEX IF NOT EXISTS idx_tenant_facturacion_tenant ON public.tenant_facturacion(tenant_id);

-- --------------------------------------------
-- 4. TABLA FACTURAS
-- --------------------------------------------
-- Una factura por pedido; vincula pedido con número de factura y totales IVA.

CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  pedido_id UUID NOT NULL,
  numero_factura TEXT NOT NULL,
  timbrado TEXT NOT NULL,
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cliente_id UUID,
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  total_iva_10 NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_iva_10 >= 0),
  total_iva_5 NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_iva_5 >= 0),
  total_exento NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_exento >= 0),
  total_letras TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT facturas_pkey PRIMARY KEY (id),
  CONSTRAINT facturas_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT facturas_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE,
  CONSTRAINT facturas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL,
  CONSTRAINT facturas_pedido_unique UNIQUE (pedido_id),
  CONSTRAINT facturas_numero_tenant_unique UNIQUE (tenant_id, numero_factura)
);

COMMENT ON TABLE public.facturas IS 'Facturas emitidas por pedido; datos del documento para validez y IVA discriminado';
COMMENT ON COLUMN public.facturas.numero_factura IS 'Formato 001-001-0000001 (establecimiento-punto-secuencia)';
COMMENT ON COLUMN public.facturas.total_letras IS 'Total en letras (recomendado para facturas físicas)';

CREATE INDEX IF NOT EXISTS idx_facturas_tenant ON public.facturas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_facturas_pedido ON public.facturas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON public.facturas(tenant_id, fecha_emision DESC);

-- --------------------------------------------
-- 5. PRODUCTOS - Tasa de IVA
-- --------------------------------------------
-- 10% general, 5% canasta básica, 0% exento

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS tasa_iva NUMERIC(5,2) NOT NULL DEFAULT 10;

-- Aplicar CHECK después de agregar columna (evitar error si ya existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'productos_tasa_iva_check'
  ) THEN
    ALTER TABLE public.productos
      ADD CONSTRAINT productos_tasa_iva_check CHECK (tasa_iva IN (0, 5, 10));
  END IF;
END $$;

COMMENT ON COLUMN public.productos.tasa_iva IS 'IVA: 10=general, 5=canasta básica, 0=exento';

-- --------------------------------------------
-- 6. ITEMS_PEDIDO - IVA por línea
-- --------------------------------------------
-- Para detalle de transacción con IVA discriminado

ALTER TABLE public.items_pedido
  ADD COLUMN IF NOT EXISTS iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS monto_iva NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (monto_iva >= 0);

COMMENT ON COLUMN public.items_pedido.iva_porcentaje IS 'Porcentaje de IVA aplicado (10, 5 o 0)';
COMMENT ON COLUMN public.items_pedido.monto_iva IS 'Monto de IVA de la línea (discriminado)';

-- --------------------------------------------
-- 7. Trigger: actualizar updated_at en tenant_facturacion y facturas
-- --------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_tenant_facturacion_updated_at ON public.tenant_facturacion;
CREATE TRIGGER trigger_tenant_facturacion_updated_at
  BEFORE UPDATE ON public.tenant_facturacion
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_facturas_updated_at ON public.facturas;
CREATE TRIGGER trigger_facturas_updated_at
  BEFORE UPDATE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------
-- 8. Permisos (ajustar según tu RLS)
-- --------------------------------------------

GRANT SELECT, INSERT, UPDATE ON public.tenant_facturacion TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.facturas TO authenticated;

-- Opcional: RLS para tenant_facturacion y facturas (solo ver/editar su tenant)
-- ALTER TABLE public.tenant_facturacion ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
-- (Crear políticas según tu patrón existente por tenant_id)
