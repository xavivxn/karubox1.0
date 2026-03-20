# CanjePuntosModal Implementation Plan (secciones/acordeones) (2026-03-20)

> **Para Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reestructurar `CanjePuntosModal` para que en movil/tablet el flujo sea claro por secciones (acordeones) con CTA fijo respetando safe area (iPhone Safari), mejorando jerarquia y UX sin cambiar la logica de negocio.

**Architecture:** Se refactoriza el markup del modal para dividir la UI en 4 acordeones controlados (cliente -> productos -> tipo -> resumen) manteniendo los estados existentes (`clienteSeleccionado`, `canjeDraft`, `tipoCanje`, `isProcessing`, `canjeAllowed`). En movil el modal se comporta como bottom sheet con scroll interno en el contenido y footer/CTA fijo con padding seguro.

**Tech Stack:** React/Next.js, Tailwind CSS, Lucide icons, `createPortal`, `env(safe-area-inset-*)`.

---

## Task 1: Base logica/estado para acordeones (pendiente/completado) 

**Files:**
- Modify: `src/features/pos/components/CanjePuntosModal.tsx`

**Step 1: Agregar helpers/booleans de progreso**
1. Derivar estados:
   - `stepClienteComplete` => `Boolean(clienteSeleccionado)`
   - `stepProductoComplete` => `canjeDraft.length > 0` (y/o valida regla actual)
   - `stepTipoComplete` => `tipoCanje !== null`
   - `stepResumenOpen` => `stepClienteComplete && stepProductoComplete && stepTipoComplete`
2. Derivar `canjeAllowed` existente para el CTA.

**Step 2: Ajustar markup para usar acordiones controlados**
- Definir estructura base (sin styles finales):
  - Acordeon Cliente: abierto por defecto
  - Acordeon Productos: habilitado si `stepClienteComplete`
  - Acordeon Tipo: habilitado si `stepProductoComplete`
  - Acordeon Resumen: `open` controlado por `stepResumenOpen` (y puede verse colapsado si falta info)

**Step 3: Verificacion estatica**
1. Ejecutar `npm run lint` (esperado: 0 errores).

**Step 4: Commit**
- Pendiente de tu autorizacion explicita (por politica del workspace no se hara commit sin permiso).

---

## Task 2: Step 1 acordeon "Cliente" (busqueda + seleccion + tarjeta)

**Files:**
- Modify: `src/features/pos/components/CanjePuntosModal.tsx`

**Step 1: Reubicar UI actual del panel izquierdo a acordeon**
1. Tomar la UI actual de inputs (`nombre`, `ci`, `telefono`) + sugerencias.
2. Cambiar jerarquia visual para mobile:
   - header/descripcion del acordeon
   - contenido del acordeon con `overflow-y-auto` delegado al scroll principal del modal
3. Mantener behavior existente:
   - `sugerencias` con debounce
   - seleccion ejecuta `onSelectCliente`

**Step 2: Tarjeta de cliente seleccionado**
1. Cuando `clienteSeleccionado` existe:
   - mostrar tarjeta compacta (nombre + telefono o fallback + puntos)
   - boton `Cambiar` que resetea `clienteSeleccionado` y `canjeDraft` (segun la UX aprobada).

**Step 3: Verificacion**
1. Ejecutar `npm run lint` (esperado: 0 errores).
2. Manual (mobile):
   - Abrir modal: acordeon Cliente abierto
   - Tipear nombre/CI/telefono: aparecen sugerencias
   - Seleccionar cliente: se muestra tarjeta y pasa a estado completo

**Step 4: Commit**
- Pendiente de tu autorizacion explicita.

---

## Task 3: Step 2 acordeon "Productos disponibles al canje"

**Files:**
- Modify: `src/features/pos/components/CanjePuntosModal.tsx`

**Step 1: Reestructurar el listado de productos en modo acordeon**
1. Usar la lista actual `productosParaCanje`.
2. Habilitar acordeon solo si `clienteSeleccionado` existe.
3. Si no hay cliente:
   - acordeon cerrado o contenido oculto
   - hint corto: “Elegí un cliente para continuar”

**Step 2: Seleccion de producto (1 unidad / 1 producto)**
1. Reemplazar “Agregar uno” por una accion coherente en el flujo por secciones:
   - si `canjeDraft` esta vacio: boton “Elegir” (o “Agregar” pero con copy menos ambiguo).
   - si ya existe producto seleccionado: mostrar tarjeta resumen y permitir “Cambiar producto”.
2. Mantener validaciones actuales:
   - `canjeCantidadTotal < 1`
   - `canjeCostoTotalPts + puntosUnidad <= saldoClientePts`
   - `existing` => solo 1 producto distinto por canje

**Step 3: Verificacion**
1. Ejecutar `npm run lint` (esperado: 0 errores).
2. Manual:
   - Sin cliente: step 2 no habilitado
   - Con cliente: elegir producto habilita el step 3
   - Si no alcanza con puntos: boton deshabilitado y hint visible (si se decide mostrar)

**Step 4: Commit**
- Pendiente de tu autorizacion explicita.

---

## Task 4: Step 3 acordeon "Tipo de pedido" (delivery / comer aqui / para llevar)

**Files:**
- Modify: `src/features/pos/components/CanjePuntosModal.tsx`

**Step 1: Botones tipo con estado activo**
1. Reutilizar `ORDER_TYPES` existente.
2. Renderizar como acordeon:
   - deshabilitado si `canjeDraft` vacio
   - al elegir setear `setTipoCanje(option.value)`

**Step 2: Validacion UI**
1. El acordeon muestra hint cuando esta deshabilitado.
2. Marcado activo con estilo consistente con el actual (utilizar clases existentes).

**Step 3: Verificacion**
1. Ejecutar `npm run lint` (esperado: 0 errores).
2. Manual:
   - Elegir tipo activa el paso 4

**Step 4: Commit**
- Pendiente de tu autorizacion explicita.

---

## Task 5: Step 4 acordeon "Resumen de canje" + CTA fijo con safe area

**Files:**
- Modify: `src/features/pos/components/CanjePuntosModal.tsx`

**Step 1: Resumen de canje**
1. Renderizar una tarjeta resumen con:
   - cliente (nombre + puntos)
   - producto seleccionado (nombre + puntos + valor)
   - tipo de pedido seleccionado
   - recordatorio: “Solo se puede canjear 1 unidad por canje”

**Step 2: CTA fijo (Aplicar canje)**
1. Crear footer fijo inferior dentro del bottom sheet:
   - `padding-bottom` incluye safe area
   - `min-h-[44px]` y `gap` consistentes
2. Deshabilitar el boton si `canjeAllowed` es false.
3. Mostrar micro-hint debajo cuando esta deshabilitado (1 linea):
   - faltan pasos o saldo insuficiente

**Step 3: safe area y scroll**
1. Asegurar que el scroll quede en el area central:
   - `overflow-y-auto overscroll-contain` en el contenedor de contenido
   - CTA fuera del scroll (footer fijo).

**Step 4: Verificacion**
1. Ejecutar `npm run lint` (esperado: 0 errores).
2. Ejecutar `npm run build` (esperado: build ok).
3. Manual iPhone Safari / movil:
   - el CTA no queda tapado por home indicator
   - el contenido scroll no se rompe (sin “jumps”/pelea con body)

**Step 4: Commit**
- Pendiente de tu autorizacion explicita.

---

## Task 6: Accesibilidad y ergonomia (teclado + foco)

**Files:**
- Modify: `src/features/pos/components/CanjePuntosModal.tsx`

**Step 1: Mejoras A11y**
1. Mantener `role="dialog" aria-modal="true"`.
2. En cada acordeon: buttons con `aria-expanded`.
3. Foco:
   - al abrir modal, enfocar boton cerrar o primer input (con `ref` y `useEffect`).

**Step 2: Comportamiento teclado**
1. Mantener `Escape` para cerrar.
2. Asegurar que el overlay captura click para cerrar como hoy.

**Step 3: Verificacion**
1. Manual:
   - navegar acordeones con teclado
   - Escape cierra y resetea

**Step 4: Commit**
- Pendiente de tu autorizacion explicita.

---

## Fin del plan

Este plan se guardo en `docs/plans/2026-03-20-canje-puntos-modal-secciones-implementation.md`.

### Autorizacion para commits
Antes de ejecutar cambios y commitear: necesito tu confirmacion para hacer `git commit`.

### Dos opciones de ejecucion
1. Subagent-Driven (esta misma sesion): ejecucion por tareas con revisiones entre cada tarea.
2. Paralela (otra sesion): no recomendado para este cambio; preferimos iterar.

Que opcion queres? (1 o 2)

