# Pruebas de tracing de impresión (Supabase)

Guía para repetir en el futuro el diagnóstico de latencias del flujo **agente desktop → cola de impresión (spool)**, usando la tabla `public.print_trace_events` y el RPC `public.log_print_event`.

## Requisitos previos

- En Supabase existen la tabla `print_trace_events` y la función `log_print_event(p_correlation_id, p_stage, p_source, p_order_id, p_meta)`.
- El agente de impresión está instrumentado (`packages/agent/print-trace.js` + `supabase-listener.js`) y usa la **anon key** con `GRANT EXECUTE` sobre `log_print_event` al rol `anon` si corresponde.
- Agente en ejecución en el PC que imprime.

## Cómo hacer una prueba

1. Abrí **Supabase → SQL Editor**.
2. Dejá el agente corriendo.
3. Desde el POS, generá un pedido real que dispare impresión (cocina y/o factura, según tu flujo).
4. Ejecutá las consultas de la sección siguiente.
5. Anotá el resultado en **Registro de pruebas** al final de este documento.

## Consultas SQL

### Último `correlation_id` registrado

```sql
select correlation_id
from public.print_trace_events
order by ts desc
limit 1;
```

### Timeline del último flujo (automático)

```sql
with last_corr as (
  select correlation_id
  from public.print_trace_events
  order by ts desc
  limit 1
)
select
  e.stage,
  e.ts,
  e.order_id,
  e.meta->>'ticket' as ticket,
  e.meta->>'render_ms' as render_ms,
  e.meta->>'spool_ms' as spool_ms,
  e.meta->>'total_agent_ms' as total_agent_ms,
  e.meta->>'copies' as copies
from public.print_trace_events e
where e.correlation_id = (select correlation_id from last_corr)
order by e.ts asc;
```

### Timeline de un `correlation_id` conocido

Sustituí el UUID:

```sql
select
  stage,
  ts,
  order_id,
  meta->>'ticket' as ticket,
  meta->>'render_ms' as render_ms,
  meta->>'spool_ms' as spool_ms,
  meta->>'total_agent_ms' as total_agent_ms
from public.print_trace_events
where correlation_id = 'PEGÁ_CORRELATION_ID_AQUÍ'
order by ts asc;
```

### Deltas en ms entre eventos consecutivos

Útil para ver en qué salto se “come” el tiempo (último flujo):

```sql
with last_corr as (
  select correlation_id
  from public.print_trace_events
  order by ts desc
  limit 1
),
ev as (
  select
    stage,
    ts,
    meta->>'ticket' as ticket,
    lag(ts) over (order by ts) as prev_ts
  from public.print_trace_events
  where correlation_id = (select correlation_id from last_corr)
)
select
  stage,
  ticket,
  ts,
  case
    when prev_ts is null then null
    else round(extract(epoch from (ts - prev_ts)) * 1000)::int
  end as delta_ms_desde_anterior
from ev
order by ts asc;
```

### Resumen de duración total del flujo (min/max `ts`)

```sql
with last_corr as (
  select correlation_id
  from public.print_trace_events
  order by ts desc
  limit 1
),
e as (
  select *
  from public.print_trace_events
  where correlation_id = (select correlation_id from last_corr)
)
select
  (select correlation_id from last_corr) as correlation_id,
  (select min(order_id) from e where order_id is not null) as order_id,
  (select min(ts) from e) as inicio,
  (select max(ts) from e) as fin,
  round(extract(epoch from ((select max(ts) from e) - (select min(ts) from e))) * 1000)::int
    as span_total_ms
from e
limit 1;
```

### Pedidos con trazas recientes (últimas 24 h)

```sql
select
  e.correlation_id,
  e.order_id,
  p.numero_pedido,
  min(e.ts) as primera_marca,
  max(e.ts) as ultima_marca,
  round(extract(epoch from (max(e.ts) - min(e.ts))) * 1000)::int as span_ms,
  count(*)::int as eventos
from public.print_trace_events e
left join public.pedidos p on p.id::text = e.order_id
where e.ts >= now() - interval '24 hours'
  and e.order_id is not null
group by e.correlation_id, e.order_id, p.numero_pedido
order by ultima_marca desc
limit 50;
```

## Cómo interpretar (resumen)

| Stage / tramo | Qué mide |
|---------------|----------|
| `agent_event_received` → `agent_render_start` | Trabajo previo al render en el agente (no incluido en `render_ms` del meta). |
| `agent_render_start` → `agent_render_done` | Generación del ticket (`render_ms` en meta en `render_done`). |
| `render_done` → `spool_submit` | Hasta entregar el trabajo al sistema de impresión. |
| `spool_submit` → `spool_ack` | Cola/driver de Windows (spooler) + aceptación del trabajo (`spool_ms` suele estar en `spool_ack`). |
| Dos pares `spool_*` en `factura` | Típico de **dos copias** de factura. |
| `agent_completed` | En la implementación actual suele cerrar un **sub-bloque** (p. ej. cocina), no siempre todo el pedido. |

**Cuello habitual** en las pruebas de marzo 2026: **~1,55–1,7 s por cada `spool_submit` → `spool_ack`** (optimización local: driver, RAW/ESC-POS, impresión directa, menos copias).

## Registro de pruebas

Copiá el bloque siguiente y pegá una nueva entrada arriba de la última cuando repitas la prueba.

---

### 2026-03-29 — Última prueba registrada

- **Fecha / hora (UTC de las marcas):** 2026-03-29 ~22:44:02–22:44:09  
- **`correlation_id`:** `9a042804-eb7e-4972-a39a-1e5805613e62`  
- **Resumen (deltas aproximados):**
  - Cocina: ~294 ms hasta render; **~701 ms** render; **~1709 ms** spool.
  - Entre cierre cocina y arranque factura: **~593 ms** (tras `agent_completed`).
  - Factura: **~123 ms** render; **~1556 ms** y **~1554 ms** spool (2 copias).
  - **`span_total_ms`** (min `ts` → max `ts` del flujo): **~6971 ms** (~7 s).
- **Notas:** Patrón alineado con prueba anterior (`80191b68-93fe-406c-9e9e-53c644828067`): spool estable ~1,55–1,71 s por envío.

### 2026-03-29 — Prueba anterior (referencia)

- **`correlation_id`:** `80191b68-93fe-406c-9e9e-53c644828067`  
- **Resumen:** Cocina render ~710 ms, spool ~1710 ms; factura render ~28 ms, dos spools ~1616 ms y ~1606 ms.

---

*Documento orientado a operación y diagnóstico; la UI de Karubox no es necesaria para estas pruebas.*
