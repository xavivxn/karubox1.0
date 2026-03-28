# Agente: dos copias de factura en emisión inicial (una en reimpresión)

Este documento es la **especificación de implementación** para el **agente de impresión** (repo aparte). El código del agente **no** vive en el monorepo web; la app solo persiste pedido/factura y dispara Realtime.

## Contrato resumido

| Origen del trabajo | Ticket cocina | Ticket factura |
|--------------------|---------------|----------------|
| **Emisión inicial** (`pedidos` → `estado_pedido = 'FACT'` y existe fila en `facturas` / `vista_factura_impresion` para ese `pedido_id`) | **1** | **2** (cliente + archivo del local; pueden ser el mismo layout o con leyenda “Cliente” / “Archivo”) |
| **INSERT en `reprint_solicitud`** con `tipo = 'factura'` | 0 | **1** por cada INSERT |
| **INSERT en `reprint_solicitud`** con `tipo = 'cocina'` | **1** | 0 |
| **Canje** (pedido sin fila en `facturas`) | **1** | **0** |

## Implementación en el agente (checklist)

1. **Listener de emisión inicial** (el que hoy reacciona a pedido confirmado / `FACT`):
   - Imprimir **una vez** el ticket de cocina (si aplica a tu flujo).
   - Si existe factura para ese `pedido_id` (consultar `vista_factura_impresion` o tabla `facturas`), armar el payload de factura y **enviar dos trabajos de impresión consecutivos** (o `copies: 2` en la API de la impresora, si soporta y separás cortes entre copias).
   - Si **no** existe factura (p. ej. canje), **no** imprimir factura.

2. **Listener de `reprint_solicitud`**:
   - `tipo === 'factura'` → **exactamente una** impresión de factura por evento (sin duplicar).
   - No mezclar esta ruta con la lógica de “2 copias” de la emisión inicial.

3. **Idempotencia**:
   - Si el mismo `pedido_id` en `FACT` dispara el listener más de una vez (reconexiones, updates), evitar imprimir de nuevo cocina + 2 facturas. Usar caché en memoria o tabla local de `pedido_id` ya impreso para emisión inicial.

4. **Opcional UX en papel**:
   - Primera copia: leyenda “Original – Cliente” (o equivalente).
   - Segunda copia: “Duplicado – Archivo del local”.

## Referencias en el repo web

- Reimpresión: [`AGENTE_REPRINT_SOLICITUD.md`](AGENTE_REPRINT_SOLICITUD.md), [`PROMPT_AGENTE_REIMPRESION.md`](PROMPT_AGENTE_REIMPRESION.md)
- Vista factura: `vista_factura_impresion` (ver `database/08_vista_factura_impresion.sql`)

## QA

- Venta con factura: 1 cocina + 2 facturas al confirmar.
- Reimprimir factura desde POS/historial: 1 factura por solicitud.
- Canje: solo cocina, 0 facturas.
