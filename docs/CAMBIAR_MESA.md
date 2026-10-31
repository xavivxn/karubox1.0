# Cambiar mesa

Mueve **toda la cuenta abierta** de una mesa ocupada a una mesa libre (los clientes se mudan de mesa).

## Dónde aparece

Botón **Cambiar mesa** dentro del detalle de la mesa (`DetalleMesaModal`), en:

- Panel **Mesas** (admin/caja) → al terminar, el detalle queda abierto en la mesa nueva.
- **Selector de mesas del POS** (mozos) → igual.
- **POS** con mesa → el POS pasa a trabajar sobre la mesa nueva (el carrito sin confirmar se conserva).

Se muestra solo si la pantalla pasa `onCambiarMesa` y está habilitado solo para mesas **ocupadas**, físicas (no "para llevar") y fuera de una unión activa.

## Cómo funciona

Todo lo hace la RPC `public.cambiar_mesa` (`database/33_cambiar_mesa.sql`) en **una transacción** con lock de las dos mesas:

1. Toma los pedidos de la **sesión vigente** de la mesa origen (mismo criterio que `sesionMesa.ts`: corte en el último `liberar_mesa` + pedidos vinculados después del corte). Históricos y cancelados no se tocan.
2. Les cambia `mesa_id` a la mesa destino y registra un `mover_pedido` por pedido en la mesa destino (así el resumen y el cierre de cuenta de la mesa destino los incluyen).
3. Mesa destino → `ocupada` (+ `ocupar_mesa`); mesa origen → `libre` (+ `liberar_mesa`).

No reimprime cocina, no toca factura, puntos ni inventario. No requiere cambios de esquema (usa tipos de evento existentes).

Rechaza: misma mesa, destino no libre (ocupada/reservada/bloqueada), mesa inactiva, otro local, mesa "para llevar", unión activa, destino "libre" con cuenta abierta (estado desfasado) y un pedido que se está confirmando en ese instante (EDIT de menos de 2 min que no sea división).

Dos personas a la vez: una gana y la otra recibe un error claro; nunca quedan estados cruzados.

## Archivos

| Archivo | Qué es |
|---|---|
| `database/33_cambiar_mesa.sql` | RPC `cambiar_mesa` (aplicar en Supabase) |
| `src/features/mesas/services/cambiarMesa.ts` | Reglas puras: destinos válidos, validación, mensajes |
| `src/features/mesas/services/cambiarMesaService.ts` | Llama la RPC y avisa por realtime |
| `src/features/mesas/components/CambiarMesaPanel.tsx` | Selector de mesa destino + confirmación |
| `DetalleMesaModal.tsx`, `MesasView.tsx`, `MesaPickerScreen.tsx`, `POSView.tsx` | Integración |

## Pruebas automáticas

```bash
npx vitest run src/features/mesas
```

- `cambiarMesa.test.ts` — reglas puras (33 casos).
- `cambiarMesaService.test.ts` — llamada a la RPC, errores, broadcast (8 casos).
- `CambiarMesaPanel.test.tsx` — selector: carga, selección, doble envío, errores, sin mesas, reintento, uniones (11 casos).
- `DetalleMesaModal.cambiarMesa.test.tsx` — botón y flujo dentro del detalle (8 casos).

SQL (Postgres descartable, nunca contra producción):

```bash
psql -f database/tests/schema_minimo.sql
psql -f database/33_cambiar_mesa.sql
psql -f database/tests/test_cambiar_mesa.sql      # 15 casos: sesión, validaciones, uniones, EDIT, ida y vuelta, grants
bash database/tests/test_concurrencia.sh          # dos personas a la vez
```

## Prueba manual en localhost (cuenta de prueba)

Impresión fuera de alcance.

1. Mesa A con 2 pedidos confirmados → Cambiar mesa → elegir mesa libre B → A libre, B ocupada, detalle de B muestra los 2 pedidos y el mismo total.
2. Cerrar cuenta en B → cobra los pedidos movidos; A sigue libre.
3. Cambiar A → B → C → A en seguida → la cuenta sigue completa en A.
4. Con una mesa ocupada sin pedidos → se puede cambiar (0 pedidos).
5. El selector no ofrece mesas ocupadas, reservadas, bloqueadas ni la propia.
6. Dos navegadores: ambos abren "Cambiar mesa" en A; el primero mueve a B; el segundo intenta a C → error "no está ocupada" y la lista se refresca.
7. Dos navegadores: A→C y B→C a la vez → uno solo gana.
8. En el selector del POS (mozo) y en el panel Mesas, el cambio se ve en el otro dispositivo sin refrescar.
9. Desde el POS de la mesa A con productos en el carrito → Cambiar mesa → el POS queda en B con el carrito intacto; confirmar el pedido lo carga en B.
10. Mesa en unión activa → botón deshabilitado.
11. Cuenta "para llevar" → no aparece el botón.
12. Sin la migración aplicada → mensaje "falta aplicar la migración 33_cambiar_mesa.sql".
