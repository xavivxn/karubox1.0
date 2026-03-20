# Diseno - CanjePuntosModal UX (secciones/acordeones) (2026-03-20)

## Objetivo
Mejorar la experiencia de usuario y la jerarquia visual del modal `CanjePuntosModal`, haciendo el flujo mas claro y responsive para moviles y tablets. En iPhone Safari se debe cuidar el `safe area`, evitando que el contenido o el CTA queden tapados por el home indicator.

## Alcance
- Componente objetivo: `src/features/pos/components/CanjePuntosModal.tsx`
- Refactor/UX interno del modal: contenido por secciones (acordeones), estados y CTA fijo.
- No se modifica la logica de negocio actual (canje solo 1 unidad, validacion de puntos vs saldo, confirmacion con `orderService`).

## Flujo UX propuesto (por secciones)
El modal funciona como un flujo escalonado con acordeones:
1. Acordeon "Cliente" (abierto por defecto)
2. Acordeon "Productos disponibles al canje" (se habilita al seleccionar cliente)
3. Acordeon "Tipo de pedido" (se habilita al seleccionar producto)
4. Acordeon "Resumen de canje" (se abre automaticamente cuando todo este listo)

### Step 1 - Acordeon "Cliente"
- Contiene el buscador (Nombre / CI / Telefono) y sugerencias (cuando existan).
- Al seleccionar un cliente:
  - se muestra una tarjeta compacta con: nombre, telefono/CI y puntos.
  - aparece "Cambiar" para volver al modo busqueda.
  - el Step 1 se marca como "Completado".
  - el Step 2 pasa a "Habilitado" (y se puede abrir automaticamente en movil si se desea).

### Step 2 - Acordeon "Productos disponibles al canje"
- Estado inicial: cerrado/deshabilitado si no hay cliente.
- Al tener cliente:
  - se habilita.
  - si ya hay producto seleccionado (en el estado actual se representa por `canjeDraft`):
    - se muestra una tarjeta resumen del producto seleccionado.
    - se muestra opcion para "Cambiar producto".
  - el listado permite elegir 1 producto (regla: solo 1 unidad por canje y solo 1 producto distinto).
  - botones de productos con feedback:
    - si no alcanza con puntos o ya hay producto seleccionado, el CTA queda deshabilitado o se oculta (segun implementacion elegida).

### Step 3 - Acordeon "Tipo de pedido"
- Estado inicial: deshabilitado/cerrado si no hay producto seleccionado.
- Al tener producto:
  - se habilita y se muestra seleccion de:
    - Delivery
    - Comer aqui
    - Para llevar
- Al elegir:
  - la opcion activa se resalta (pill/tarjeta con contraste).
  - Step 3 se marca como "Completado".

### Step 4 - Acordeon "Resumen de canje" + CTA fijo
- El Step 4 aparece como acordeon (por jerarquia) y se abre automaticamente cuando:
  - hay cliente seleccionado (`clienteSeleccionado`)
  - hay producto seleccionado (representado por `canjeDraft` no vacio)
  - hay tipo de pedido (`tipoCanje !== null`)
- Contenido del resumen:
  - tarjeta con cliente, producto, costo en puntos y tipo de pedido
  - recordatorio corto: "Solo se puede canjear 1 unidad por canje"
- CTA fijo abajo:
  - boton principal "Aplicar canje"
  - se mantiene siempre visible en movil/tablet
  - padding inferior incluye `env(safe-area-inset-bottom)`
  - boton deshabilitado hasta que `canjeAllowed` sea true
  - micro-hint (1 linea) debajo del boton indicando que falta (cliente/producto/tipo/saldo insuficiente)

## Responsive y safe area (iPhone Safari)
### Mobile (smaller widths)
- Modal tipo "bottom sheet":
  - contenedor con `max-h-[90dvh]` (o similar) para soportar Safari con viewport dinamico
  - header superior visible
  - area central con `overflow-y-auto overscroll-contain`
  - CTA fijo inferior con `pb-[calc(1rem+env(safe-area-inset-bottom))]` o equivalente
  - margen/spacing de lados con `env(safe-area-inset-left/right)` si corresponde

### Tablet / Desktop
- Mantener el mismo flujo por acordeones para consistencia.
- Ajustar anchos:
  - en pantallas medianas, usar card/grid para que el listado no quede apretado
  - en desktop, opcionalmente mantener el layout actual de 2 columnas, pero con acordeones para jerarquia (si el refactor lo permite sin complejidad).

## Jerarquia visual (UI)
- Titulos consistentes por step:
  - tamanos de fuente escalados (`text-sm`/`text-base` en mobile, `text-lg` en desktop)
  - subtitulos cortos para guiar (en 1 linea cuando sea posible)
- Estilos de estado:
  - "Pendiente": tono neutro
  - "Completado": tono verde/contraste
  - "Deshabilitado": opacity baja y sin hover efectivo
- Botones:
  - `min-h-[44px]` para compatibilidad tactil
  - spacing entre elementos para evitar taps accidentales

## Accesibilidad (A11y)
- Mantener `role="dialog" aria-modal="true"` y `aria-labelledby`.
- En cada acordeon:
  - usar un `button` con `aria-expanded`
  - cuando este deshabilitado, el button debe ser inaccesible via click (y opcionalmente con `aria-disabled`)
- Control de teclado:
  - ya existe cierre con `Escape`; mantenerlo
  - al abrir, enfocar el boton de cierre o el primer input relevante (para mejorar navegacion)

## Errores y estados
- Si `orderService.confirmOrder` falla:
  - mantener el comportamiento actual (alert con mensaje)
  - (opcional en implementacion) mostrar un mensaje inline en lugar de alert si se quiere mejorar UX.

## Criterios de aceptacion (checklist)
- En iPhone Safari:
  - el CTA fijo no queda tapado por safe area
  - el contenido central hace scroll sin “pelearse” con el scroll del body
- En flujos:
  - no es posible llegar a CTA activo sin completar cliente, producto y tipo
  - los acordeones reflejan "Pendiente/Completado/Habilitado" correctamente
- En responsive:
  - se puede completar el proceso solo con una mano en mobile (boton >= 44px y spacing razonable)

## Notas de implementacion (alto nivel)
- Convertir el contenido actual del modal en 4 acordeones controlados por estado (sin usar `details` sin control si afecta a Jerarquia).
- Reusar los estados actuales:
  - `clienteSeleccionado`
  - `canjeDraft` (producto seleccionado)
  - `tipoCanje`
- Derivar `canjeAllowed` existente para el CTA.

