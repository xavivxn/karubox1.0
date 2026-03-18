P# Cocina 3D — Mejoras UI (panel en vivo + challenges) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar la experiencia en la pantalla Cocina 3D a nivel UI: unificar la sensación de “panel de control en vivo” del local con la capa de challenges (récords, trofeos, logros) para que se sienta una sola experiencia coherente y más atractiva.

**Architecture:** Cambios solo en front (React/Next). Se mantiene la vista `CocinaVirtualView` como contenedor y `KitchenCanvas` como panel principal; se refinan jerarquía visual, estados vacíos de columnas, integración del bloque “challenges/récord” en la barra del canvas, y pequeños ajustes de espaciado/contraste. Sin nuevos endpoints ni cambios en hooks de datos.

**Tech Stack:** React, Next.js (App Router), Tailwind CSS, animaciones en `src/app/globals.css`.

---

## Alcance

- **In scope:** jerarquía visual, estados vacíos del Kanban, integración visual de challenges/récord en el panel, accesibilidad de escaneo (contraste, espaciado).
- **Out of scope:** lógica de negocio, nuevos logros, backend, tests unitarios (validación manual en `/home/admin/cocina`).

---

## File structure

| Archivo | Responsabilidad |
|--------|------------------|
| `src/features/cocina/view/CocinaVirtualView.tsx` | Layout general: barra de KPIs, badges por etapa, contenedor del canvas, botón trofeo. Ajustes de grid/espaciado y colocación del hint de récord. |
| `src/features/cocina/components/KitchenCanvas.tsx` | Panel interior: barra superior (Facturado hoy, En cocina, Ritmo), récord/combo, columnas Kanban, ticker. Integrar récord/challenges en la barra; refinar estados vacíos por columna. |
| `src/app/globals.css` | Animaciones/utilidades CSS ya usadas por cocina; añadir solo si hace falta una animación nueva para estados vacíos o transiciones. |

No se crean archivos nuevos; se mantienen los componentes existentes y se modifican por responsabilidad ya definida.

---

## Tareas

### Task 1: Unificar hint de récord y trofeo en la barra superior del canvas

**Objetivo:** El texto "A X de tu récord" y el indicador de logros (9/29) deben sentirse parte del mismo bloque “challenges” dentro del panel en vivo, no elementos sueltos.

**Files:**
- Modify: `src/features/cocina/view/CocinaVirtualView.tsx` (stats bar + botón trofeo)
- Modify: `src/features/cocina/components/KitchenCanvas.tsx` (top bar con Facturado hoy, En cocina, Ritmo, récord)

- [ ] **Step 1: Mover el hint "A X de tu récord" desde CocinaVirtualView al canvas**

En `CocinaVirtualView.tsx`, quitar el bloque que muestra "A {bestDailyOrders - stats.todayTotal} de tu récord" junto al botón del trofeo (y cualquier duplicado en la zona de stats). Pasar `bestDailyOrders` ya al canvas; el canvas debe ser la única fuente de ese texto en la barra superior del panel.

- [ ] **Step 2: Mostrar récord + trofeo juntos en KitchenCanvas**

En `KitchenCanvas.tsx`, en la barra superior (donde están MoneyCounter, En cocina, Ritmo), agrupar a la derecha en un solo bloque:
- "A X de tu récord" (si aplica)
- Un botón o link "Ver logros" que dispare la misma acción que el botón trofeo actual (el canvas no tiene acceso directo a `setPanelOpen`; se puede pasar un callback `onOpenAchievements` desde la vista).

- [ ] **Step 3: Pasar callback de logros desde la vista al canvas**

En `CocinaVirtualView.tsx`, pasar a `KitchenCanvas` una prop `onOpenAchievements?: () => void` y usarla para el botón "Ver logros" / ícono trofeo en la barra del canvas. Opcional: mantener también el botón trofeo en la vista (stats bar) para no romper flujo actual; si se prefiere un solo punto de entrada, dejar solo el del canvas.

- [ ] **Step 4: Verificación manual**

Abrir `/home/admin/cocina`, comprobar que "A X de tu récord" y el acceso a logros aparecen en la barra superior del panel (dentro del área del canvas) y que al hacer clic se abre el panel de logros.

- [ ] **Step 5: Commit**

```bash
git add src/features/cocina/view/CocinaVirtualView.tsx src/features/cocina/components/KitchenCanvas.tsx
git commit -m "refactor(cocina): unificar hint récord y acceso logros en barra del canvas"
```

---

### Task 2: Mejorar estados vacíos de las columnas del Kanban

**Objetivo:** Cuando una columna (Recibido, Cocinando, Empacando, Entregado) tiene 0 pedidos, que el mensaje y la zona vacía sean más claros y visualmente atractivos, sin cambiar la lógica de etapas.

**Files:**
- Modify: `src/features/cocina/components/KitchenCanvas.tsx` (componente `StageColumn`, bloque `orders.length === 0`)

- [ ] **Step 1: Ajustar contenedor del estado vacío**

En `StageColumn`, dentro del bloque `{orders.length === 0 && (...)}`, envolver el mensaje (`EMPTY_MESSAGES[stage]`) en un contenedor con altura mínima (por ejemplo `min-h-[120px]`), centrado vertical y horizontal, y un fondo sutilmente distinto (ej. `bg-gray-50/80 dark:bg-gray-800/50`) para que la zona vacía se distinga sin competir con las columnas que tienen pedidos.

- [ ] **Step 2: Dar jerarquía al texto del estado vacío**

Usar un tamaño de texto un poco mayor para el mensaje (ej. `text-base` en lugar de `text-sm`) y un color que contraste bien en claro/oscuro (ej. `text-gray-600 dark:text-gray-400`). Mantener el ícono/emoji de la etapa en el header de la columna como ya está.

- [ ] **Step 3: Verificación manual**

Abrir Cocina 3D con columnas vacías (o con datos que dejen alguna vacía). Comprobar que las columnas sin pedidos se ven claras, con mensaje legible y zona bien delimitada.

- [ ] **Step 4: Commit**

```bash
git add src/features/cocina/components/KitchenCanvas.tsx
git commit -m "style(cocina): mejorar estados vacíos de columnas Kanban"
```

---

### Task 3: Refinar jerarquía visual de la barra de KPIs (vista principal)

**Objetivo:** La fila de StatCards (Pedidos del día, Facturado hoy, En cocina, Entregados, Ritmo) y el botón trofeo deben tener una jerarquía más clara: métricas operativas primero, challenges (trofeo) como acento.

**Files:**
- Modify: `src/features/cocina/view/CocinaVirtualView.tsx`

- [ ] **Step 1: Ajustar espaciado y agrupación de StatCards**

En la sección "Stats bar", asegurar que el grid de StatCards use `gap-3` o `gap-4` de forma consistente y que en viewports pequeños no se apelotonen (revisar `grid-cols-2 md:grid-cols-5`). Si el botón trofeo queda a la derecha, darle un margen izquierdo suficiente (`ml-auto` o `gap-4`) para separarlo visualmente del último StatCard.

- [ ] **Step 2: Diferenciar el botón trofeo como “challenges”**

Aplicar al botón del trofeo (🏆) una clase que lo diferencie como bloque de challenges: por ejemplo un borde o fondo que lo agrupe con la paleta de logros (amber/gold) sin cambiar la funcionalidad. Objetivo: que se lea como “récords/logros” y no como un KPI más.

- [ ] **Step 3: Verificación manual**

Revisar en `/home/admin/cocina` que la barra de KPIs se escanea bien y que el trofeo destaca como elemento de challenges.

- [ ] **Step 4: Commit**

```bash
git add src/features/cocina/view/CocinaVirtualView.tsx
git commit -m "style(cocina): jerarquía visual barra KPIs y botón challenges"
```

---

### Task 4: Ajustar contraste y legibilidad del ticker de actividad

**Objetivo:** El ticker inferior (nuevos pedidos, entregas, combos) debe ser fácil de leer en modo claro y oscuro, sin cambiar su comportamiento.

**Files:**
- Modify: `src/features/cocina/components/KitchenCanvas.tsx` (componente `ActivityTicker`)

- [ ] **Step 1: Revisar colores del ticker**

El contenedor del ticker usa `bg-gray-900`. Comprobar que los textos (`text-gray-400`, `text-gray-300`, `text-emerald-300`, etc.) tengan contraste suficiente (WCAG AA si es posible). Ajustar solo clases de color si hace falta (por ejemplo un gris un poco más claro para el texto secundario).

- [ ] **Step 2: Estado vacío del ticker**

Cuando `events.length === 0`, el mensaje "Esperando actividad..." debe ser visible (tamaño y color). Ajustar si está demasiado tenue.

- [ ] **Step 3: Verificación manual**

Comprobar el ticker con y sin eventos, en tema claro y oscuro (si la app tiene toggle), y que los high scores (amber) sigan destacando.

- [ ] **Step 4: Commit**

```bash
git add src/features/cocina/components/KitchenCanvas.tsx
git commit -m "style(cocina): contraste y legibilidad del ticker de actividad"
```

---

### Task 5: Pequeña animación de aparición para columnas con pedidos nuevos

**Objetivo:** Reforzar la sensación de “panel en vivo” cuando llega un pedido nuevo a una columna, sin ser intrusivo.

**Files:**
- Modify: `src/features/cocina/components/KitchenCanvas.tsx` (render de columnas / `StageColumn`)
- Modify (opcional): `src/app/globals.css` (solo si se añade una keyframe nueva)

- [ ] **Step 1: Aplicar animación suave al contenedor de columnas**

El grid de columnas ya existe. Si no está ya, aplicar una clase de entrada suave (por ejemplo `animate-in fade-in duration-300`) al contenedor del grid en `KitchenCanvas` para que al montar la vista el panel no aparezca brusco. No animar cada columna por separado para no recargar.

- [ ] **Step 2: Opcional — destacar columna con pedido recién llegado**

Si `hasNewOrder` ya se usa para algo en `StageColumn`, considerar un breve resaltado (por ejemplo `ring-2 ring-amber-400/50` durante 1–2 s) cuando `hasNewOrder` es true, o reutilizar una animación existente en `globals.css` (ej. `animate-shake` o similar). Si implica mucha lógica, dejarlo para una iteración posterior (YAGNI).

- [ ] **Step 3: Verificación manual**

Recargar la pantalla Cocina 3D y, si es posible, simular un pedido nuevo y comprobar que no hay regresiones y que la sensación de “en vivo” mejora.

- [ ] **Step 4: Commit**

```bash
git add src/features/cocina/components/KitchenCanvas.tsx
# y globals.css solo si se añadió algo
git commit -m "style(cocina): animación suave panel y opcional highlight columna con nuevo pedido"
```

---

## Resumen de commits esperados

1. `refactor(cocina): unificar hint récord y acceso logros en barra del canvas`
2. `style(cocina): mejorar estados vacíos de columnas Kanban`
3. `style(cocina): jerarquía visual barra KPIs y botón challenges`
4. `style(cocina): contraste y legibilidad del ticker de actividad`
5. `style(cocina): animación suave panel y opcional highlight columna con nuevo pedido`

---

## Notas para quien ejecute

- Todas las tareas son independientes de backend; solo UI/CSS.
- Probar siempre en `/home/admin/cocina` con un usuario admin y, si se puede, con caja abierta y pedidos en tiempo real.
- Si en Task 1 se decide dejar un solo punto de entrada a logros (solo en canvas), se puede eliminar el botón trofeo de la stats bar en la vista para evitar duplicados.
