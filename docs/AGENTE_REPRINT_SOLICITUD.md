# Agente: reimpresión solo cocina / solo factura (`reprint_solicitud`)

La app ya **no** hace `UPDATE pedidos.updated_at` para “Reimprimir cocina”, porque varios agentes tratan ese evento como **pedido FACT completo** y vuelven a imprimir **cocina y factura**.

En su lugar inserta filas en **`public.reprint_solicitud`** (`tipo` = `'cocina'` | `'factura'`). El agente debe reaccionar a **INSERT** en esa tabla y respetar el tipo.

## Qué hacer en el agente (listener Supabase)

1. Suscribirse a `postgres_changes` con `event: 'INSERT'`, `schema: 'public'`, `table: 'reprint_solicitud'`, filtrando por `tenant_id` como ya hacés con pedidos.
2. Al recibir un registro nuevo:
   - **`tipo === 'cocina'`** → **solo** ticket de cocina (p. ej. `vista_items_ticket_cocina` + pedido/tenant/cliente). No factura.
   - **`tipo === 'factura'`** → **solo** factura (p. ej. `vista_factura_impresion` por `pedido_id`). No ticket de cocina.

3. Deduplicación: podés usar `reprint_solicitud.id` (siempre nuevo) o `id + created_at`.

## SQL en Supabase

Ejecutar [`database/14_reprint_solicitud.sql`](../database/14_reprint_solicitud.sql) y habilitar **Realtime** para la tabla `reprint_solicitud` si la publicación no la incluyó automáticamente. Para alinear el RPC `bump_factura_reprint` con la cola: [`15_bump_factura_reprint_solicitud.sql`](../database/15_bump_factura_reprint_solicitud.sql).

## RPC

- Tras **14**: `bump_pedido_reprint_cocina` hace **INSERT** en `reprint_solicitud` (tipo cocina), no actualiza `pedidos`.
- Tras **15**: `bump_factura_reprint` hace **INSERT** en `reprint_solicitud` (tipo factura), no actualiza `facturas.updated_at`.

## Prompt listo para pegar en el repo del agente

Ver **[`PROMPT_AGENTE_REIMPRESION.md`](PROMPT_AGENTE_REIMPRESION.md)** (bloque copiable con contexto, qué suscribir y qué implementar).
