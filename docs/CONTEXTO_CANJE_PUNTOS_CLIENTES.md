# Contexto: Sistema de puntos de clientes (canje y suma)

Este documento resume el flujo del **sistema de puntos de clientes** dentro del POS multi-tenant (lomiterías), incluyendo **suma de puntos (acumulación)** y **canje de puntos**, con la actualización del **saldo**, el **registro en transacciones_puntos** y el **descuento de inventario/stock**.

---

## Conceptos clave

- Los puntos del cliente se encuentran en la tabla `clientes` como `puntos_totales`.
- El saldo del cliente se modifica mediante:
  - transacciones `tipo: 'ganado'` (suma)
  - transacciones `tipo: 'canjeado'` (canje)
- El canje ocurre en modo POS mediante el modal `CanjePuntosModal`.
- El canje consume puntos y crea un pedido (`pedidos`) con sus ítems (`items_pedido`).
- Al confirmar, también se descuenta stock en base a recetas/inventario.

---

## Conversión: cuánto cuesta un producto en puntos

En el frontend, la conversión se calcula así:

- Constante: `VALOR_PUNTO_GS = 1` (`src/features/pos/utils/pos.utils.ts`)
- Cálculo por producto: `puntosNecesarios = ceil(precioGs / VALOR_PUNTO_GS)`
  - Implementado en `getPuntosNecesariosPorProducto(precioGs)` dentro de `CanjePuntosModal`.

Importante:

- El canje se muestra en UI como “Valor: ₲ …”, pero el cobro real del canje es **en puntos** (no se cobra dinero).
- En el modal, el `subtotal` del ítem de canje se guarda como `0` para que el `total` del pedido no implique cálculo de puntos ganados.

---

## Acumulación: suma de puntos de clientes (puntos ganados)

La acumulación ocurre en el POS al confirmar un pedido de venta (no un canje).

### Cómo se calculan los puntos generados

En `orderService.confirmOrder` se calculan:

- `puntosAuto = calcularPuntos(total)` donde `calcularPuntos` usa el 5% del total:
  - `floor(total * 0.05)` (`src/features/pos/utils/pos.utils.ts`)
- `puntosBonus` suma puntos extra definidos por el admin por producto:
  - `puntosBonus = SUM(item.puntos_extra * item.cantidad)`
- `puntosGenerados = puntosAuto + puntosBonus`

La regla de `puntos_extra` está soportada por la migración:

- `database/10_puntos_extra_producto.sql`
  - `puntos_auto = FLOOR(total * 0.05)`
  - `puntos_extra = SUM(producto.puntos_extra × cantidad)`
  - `total_puntos = puntos_auto + puntos_extra`

### Dónde se guarda el resultado

- `orderService.confirmOrder` guarda el valor en:
  - `pedidos.puntos_generados` (se setea como `0` si no hay `cliente`)

### Cómo se acredita en el saldo del cliente (código)

Si `puntosGenerados > 0`, se llama:

- `registrarPuntosGanados(tenantId, cliente.id, puntosGenerados, pedido.id, descripcion)`

Archivo:

- `src/lib/db/puntos.ts` (`registrarPuntosGanados`)

Este método:

- lee `clientes.puntos_totales` (saldo anterior)
- inserta un registro en `transacciones_puntos` con `tipo: 'ganado'`
- actualiza `clientes.puntos_totales` con el saldo nuevo

Nota: en BD también existe un trigger llamado `acreditar_puntos_pedido()` que acredita cuando el pedido pasa a etapa `estado = 'entregado'`. El sistema actual del POS puede acreditar por código en `confirmOrder`; por lo tanto, el comportamiento final depende de cómo esté configurado el trigger en tu entorno.

---

## Reglas de canje (validaciones de negocio en UI)

### Acceso/activación del modal

- El botón “Canje de puntos” aparece en `POSView` para `isAdmin || isCajero`.
- El modal se abre solo si existe sesión de caja (`sesionAbierta`); si no, el botón queda deshabilitado.

### Restricciones del modal `CanjePuntosModal`

`CanjePuntosModal` trabaja con estos estados:

- `clienteSeleccionado`: cliente elegido (requiere tenant).
- `canjeDraft`: borrador del canje, actualmente modelado como una lista, pero con reglas que hacen que el canje sea efectivamente de **un solo producto** y **una sola unidad**.
- `tipoCanje`: tipo de entrega/pedido (`delivery | local | para_llevar`).

Reglas relevantes:

- Solo se puede canjear **1 unidad** por canje:
  - Se evita agregar si `canjeCantidadTotal >= 1`.
- Solo se puede canjear **1 producto distinto** por canje:
  - Se evita agregar si `existing` ya existe en `canjeByProductId` o si `canjeItems.length > 0`.
- El canje solo lista productos **simples**:
  - Se excluyen productos con `combo_items` (no se permiten combos).
- El CTA “Aplicar canje” se habilita cuando:
  - hay `clienteSeleccionado`
  - hay `canjeItems` (al menos 1)
  - `tipoCanje !== null`
  - `canjeCostoTotalPts <= saldoClientePts` (saldo en puntos)

---

## Flujo de confirmación (frontend -> backend)

Al presionar “Aplicar canje” en `CanjePuntosModal`:

1. Se valida que el modal tenga `tenant`, `usuario` y `clienteSeleccionado`.
2. Se arma `total` como suma de `subtotals` de `canjeItems`.
   - En canje, el modal guarda `subtotal: 0`, por lo que `total` queda `0`.
3. Se llama:
   - `orderService.confirmOrder({ ..., emitirFactura: false, facturaALNombreDelCliente: false })` — canje no genera factura (solo cocina).
   - Archivo: `src/features/pos/services/orderService.ts`

---

## Lógica backend: `orderService.confirmOrder`

Ruta principal en `src/features/pos/services/orderService.ts`:

### 1) Determinar puntos ganados vs puntos consumidos

- Calcula puntos ganados por la venta:
  - `puntosAuto = calcularPuntos(total)` donde `calcularPuntos` es `floor(total * 0.05)` (`src/features/pos/utils/pos.utils.ts`)
  - `puntosBonus` suma `item.puntos_extra * item.cantidad`
  - `puntosGenerados = puntosAuto + puntosBonus`
- Filtra ítems para canje:
  - `canjeItems = items.filter(i => i.modo === 'canje' && i.tipo === 'producto')`
- Calcula costo de canje:
  - `puntosCosteCanje = sum(item.puntos_canje * item.cantidad)`

En canje real (modal actual):

- `total` llega como `0` -> `puntosAuto` = `0`
- `puntosBonus` esperado = `0`
- por lo tanto `puntosGenerados` = `0`

### 2) Validaciones del canje (backend)

Si existen `canjeItems`:

- Requiere `cliente` (`Se requiere un cliente para canjear puntos`)
- Requiere que `puntosCosteCanje > 0`
- Requiere `puntosCosteCanje <= cliente.puntos_totales`

### 3) Crear pedido e insertar ítems

- Inserta en `pedidos` con:
  - `cliente_id`
  - `usuario_id`
  - `tipo`
  - `total`
  - `puntos_generados`
  - `estado_pedido: 'FACT'`
    - Comentario en código: “Dispara impresión automática vía Realtime”.
- Inserta `items_pedido`:
  - Para líneas de canje: `precio_unitario: 0` (y el total en dinero no impacta el cobro).
  - En `notas` agrega un sufijo:
    - `CANJE DE PUNTOS (X pts)`
    - Ver `itemsToInsert` y el cálculo de `puntosLinea`.

### 4) Registrar canje en BD

Si hay `cliente` y canje:

- `registrarCanjePuntos(tenantId, cliente.id, puntosSaldoConsumidos, pedido.id, ...)`

Archivo:
- `src/lib/db/puntos.ts` (`registrarCanjePuntos`)

### 5) Acreditar puntos (si aplica)

- `registrarPuntosGanados` solo si `puntosGenerados > 0`
- En canje actual, normalmente no aplica porque `puntosGenerados` es `0`.

### 6) Descontar stock/inventario

- Ejecuta:
  - `descontarIngredientesPorPedido({ tenantId, items: cartItemsConId, pedidoId, pedidoNumero: pedido.numero_pedido, usuarioId })`
  - Si falla, el pedido igual queda guardado (solo se loguea advertencia).

Archivo:
- `src/lib/inventory/consumption.ts`

---

## BD: cómo se descuenta el saldo de puntos

### `registrarCanjePuntos` (`src/lib/db/puntos.ts`)

Flujo:

1. Lee saldo actual del cliente: `getClientePorId(clienteId)`
2. Verifica suficiente saldo:
   - si `saldoAnterior < puntosARestar` => error
3. Calcula `saldoNuevo = saldoAnterior - puntosARestar`
4. Inserta en `transacciones_puntos`:
   - `tipo: 'canjeado'`
   - `puntos: -puntosARestar` (negativo para canje)
   - guarda `saldo_anterior` y `saldo_nuevo`
5. Actualiza `clientes.puntos_totales` con `actualizarPuntosCliente`:
   - Archivo: `src/lib/db/clientes.ts`
   - `actualizarPuntosCliente(clienteId, puntos)` hace `update({ puntos_totales: puntos })`

---

## BD: cómo se suma el saldo de puntos

### `registrarPuntosGanados` (`src/lib/db/puntos.ts`)

Flujo (código):

1. Lee saldo actual del cliente: `getClientePorId(clienteId)`
2. Calcula `saldoNuevo = saldoAnterior + puntos`
3. Inserta un registro en `transacciones_puntos`:
   - `tipo: 'ganado'`
   - `puntos` (positivo)
   - `saldo_anterior` y `saldo_nuevo`
4. Actualiza `clientes.puntos_totales` con `actualizarPuntosCliente(clienteId, saldoNuevo)`

---

## Inventario/stock en canje

`descontarIngredientesPorPedido` (`src/lib/inventory/consumption.ts`) no distingue “canje” vs “venta” a nivel de inventario: usa los `items` del pedido y aplica recetas para calcular consumos.

Puntos relevantes:

- Si un ítem es un `combo`, expande sus sub-productos para calcular consumos.
- Para productos con receta:
  - carga `recetas_producto` con JOIN a `ingredientes` (incluye `stock_actual` y `controlar_stock`)
  - acumula cantidades por ingrediente
  - actualiza stock y registra `movimientos_ingredientes`
- Para productos sin receta:
  - descuenta de `inventario` y registra `movimientos_inventario`

En el canje actual:

- como el modal evita combos y selecciona productos simples (`combo_items` vacío), normalmente el consumo se hace por recetas del producto simple y su cantidad (1).

---

## Manejo de errores y UX

### Errores en confirmación

- Si `orderService.confirmOrder` falla, `CanjePuntosModal`:
  - captura el error
  - muestra `FeedbackModal` tipo `error`
  - no cierra el modal bajo feedback visible (el `handleClose` está protegido por `if (feedback) return`)

### Errores de inventario

- `orderService` atrapa errores de `descontarIngredientesPorPedido` y:
  - loguea advertencias
  - no revierte el pedido (se asume que el pedido ya es válido y el fallo es “de stock”).

---

## Archivos principales (para referencia rápida)

- UI:
  - `src/features/pos/components/CanjePuntosModal.tsx`
  - `src/features/pos/view/POSView.tsx` (acceso al modal)
- Backend:
  - `src/features/pos/services/orderService.ts`
- Reglas de puntos:
  - `src/features/pos/utils/pos.utils.ts` (`VALOR_PUNTO_GS`, `calcularPuntos`)
- BD de puntos:
  - `src/lib/db/puntos.ts` (`registrarCanjePuntos`, `registrarPuntosGanados`)
  - `src/lib/db/clientes.ts` (`actualizarPuntosCliente`)
- Inventario:
  - `src/lib/inventory/consumption.ts` (`descontarIngredientesPorPedido`)

