# Datos de la factura (contrato único)

Este módulo expone **todos** los datos que lleva una factura fiscal.  
Fuente: tipo `FacturaParaImpresion` y servicio `facturacionService`.

---

## 1. Emisor (quien vende / local)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ruc` | string \| null | RUC del establecimiento |
| `razon_social` | string | Razón social o nombre del dueño/empresa |
| `direccion` | string \| null | Dirección del establecimiento |
| `telefono` | string \| null | Teléfono |
| `email` | string \| null | Correo electrónico |
| `actividad_economica` | string \| null | Descripción de la actividad económica |

---

## 2. Receptor (cliente)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ruc` | string \| null | RUC del cliente (o null si usa CI) |
| `ci` | string \| null | Cédula de identidad |
| `nombre` | string \| null | Nombre o razón social del cliente |
| `direccion` | string \| null | Dirección del cliente |
| `telefono` | string \| null | Teléfono |
| `email` | string \| null | Correo electrónico |

---

## 3. Documento (validez fiscal)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `numero_factura` | string | Numeración consecutiva (ej. 001-001-0000001) |
| `timbrado` | string | Timbrado 8 dígitos (DNIT) |
| `timbrado_vigencia_inicio` | string | Inicio vigencia del timbrado |
| `timbrado_vigencia_fin` | string | Fin vigencia del timbrado |
| `fecha_emision` | string | Fecha y hora de emisión |

---

## 4. Detalle (productos/servicios con IVA discriminado)

Cada ítem del array `detalle`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `producto_nombre` | string | Descripción del ítem |
| `cantidad` | number | Cantidad |
| `precio_unitario` | number | Precio unitario |
| `subtotal` | number | Subtotal de la línea |
| `iva_porcentaje` | number | 5 o 10 (IVA discriminado) |
| `monto_iva` | number | Monto de IVA de la línea |

---

## 5. Totales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_iva_10` | number | Total gravado con IVA 10% |
| `total_iva_5` | number | Total gravado con IVA 5% |
| `total_exento` | number | Total exento |
| `total_a_pagar` | number | Total a pagar |
| `total_letras` | string \| null | Total en letras (opcional) |

---

## 6. Identificadores

| Campo | Tipo |
|-------|------|
| `factura_id` | string |
| `pedido_id` | string |
| `tenant_id` | string |
| `numero_pedido` | number |

---

## Uso del servicio

```ts
import { facturacionService } from '@/features/facturacion'

// Por ID de factura
const factura = await facturacionService.getFacturaParaImpresionPorId(facturaId)

// Por ID de pedido (ej. cuando la impresora recibe el pedido facturado)
const factura = await facturacionService.getFacturaParaImpresionPorPedidoId(pedidoId)

if (factura) {
  factura.emisor.ruc
  factura.emisor.razon_social
  factura.emisor.direccion
  factura.receptor.nombre
  factura.receptor.direccion
  factura.documento.numero_factura
  factura.documento.timbrado
  factura.documento.fecha_emision
  factura.detalle  // array con IVA por línea
  factura.totales.total_a_pagar
  factura.totales.total_iva_10
  factura.totales.total_iva_5
  factura.totales.total_exento
}
```

Vista en BD (para la impresora/agente): `vista_factura_impresion`.
