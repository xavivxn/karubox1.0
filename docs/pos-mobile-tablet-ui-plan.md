# Plan de mejora UI/Layout POS — Móviles y Tablets

Objetivo: hacer el POS más intuitivo y fácil de usar en pantallas pequeñas y medianas sin cambiar la experiencia en desktop.

---

## 1. Diagnóstico actual

### Layout actual (mobile / < lg)
- **Orden en columna:** Header → Categorías → Productos → Carrito (al final).
- El carrito queda **muy abajo**; el usuario debe hacer scroll largo para ver ítems y confirmar.
- Ya existe un **FAB “Finalizar pedido”** (`ScrollToCartFAB`) que salta al carrito; ayuda pero no evita la sensación de “carrito lejano”.
- **Categorías:** scroll horizontal (chips), ya razonable en móvil.
- **Productos:** en móvil son lista compacta de filas; en `sm+` grid de cards. Bien diferenciado.

### Puntos débiles
1. **Carrito fuera de vista** hasta hacer scroll o tocar el FAB.
2. **Header** (título + subtítulo + 2 botones) ocupa bastante altura en móvil.
3. En **tablet (md)** sigue siendo una sola columna; el carrito sigue abajo.
4. **Feedback de “tengo ítems”** solo en FAB; no hay barra fija tipo “resumen + ir al carrito”.
5. **Áreas de toque** en botones/cards podrían afinarse para uso con el pulgar.

---

## 2. Objetivos de diseño

- **Menos scroll** para ver el carrito y confirmar.
- **Siempre visible** (o muy accesible) el resumen del pedido y la acción de finalizar en móvil/tablet.
- **Header más compacto** en pantallas pequeñas.
- **Tablet:** aprovechar ancho con 2 columnas (productos | carrito) donde tenga sentido.
- **Touch-friendly:** tamaños mínimos ~44px y espaciado claro.
- **Mantener** el layout actual en **desktop (lg+)**.

---

## 3. Plan por fases

### Fase 1 — Barra inferior fija (Mobile-first)
**Objetivo:** En móvil/tablet, una barra fija abajo que muestre resumen del pedido y lleve al carrito o a confirmar.

- **Qué:** Barra sticky/fixed en la parte inferior (solo `lg:hidden`).
- **Contenido:** 
  - Cantidad de ítems y total (ej. “3 ítems · 45.000 Gs”).
  - Botón “Ver carrito” o “Finalizar” que haga scroll al carrito o abra un sheet/drawer del carrito.
- **Comportamiento:** 
  - Ocultar si el carrito está vacío.
  - Misma línea visual que el FAB actual (colores, sombra) para no duplicar sensación.
- **Decisión:** ¿Mantener el FAB y esta barra, o reemplazar el FAB por esta barra?  
  **Recomendación:** Reemplazar el FAB por la barra inferior; la barra da más contexto (total + ítems) y un solo CTA claro.

**Archivos:** `POSView.tsx`, posible nuevo `CartBottomBar.tsx` o integrar en `ScrollToCartFAB.tsx` ampliado.

---

### Fase 2 — Header compacto en móvil
**Objetivo:** Reducir altura del header en pantallas pequeñas para ganar espacio para productos y carrito.

- **Qué:** 
  - En `sm` y abajo: título en una sola línea (“Punto de venta”), sin subtítulo o subtítulo colapsable.
  - Botones “Historial” y “Administración” más compactos (solo icono en móvil, texto en tablet) o en un menú “⋮”.
- **Opciones:**
  - **A:** Título + icono carrito a la izquierda; a la derecha solo iconos (FileText, LayoutDashboard) con `title`/tooltip.
  - **B:** Título corto; botones en un dropdown “Más” para ganar espacio.
- **Recomendación:** A (iconos con tooltip) para no esconder acciones.

**Archivos:** `POSView.tsx` (header con clases responsive).

---

### Fase 3 — Carrito como sheet/drawer en móvil
**Objetivo:** En móvil, el “carrito” puede ser un panel que sube desde abajo (sheet) en lugar de un bloque en el flujo de la página.

- **Qué:** 
  - En viewport `< lg`: el bloque del carrito actual puede mostrarse como **bottom sheet** (o drawer) al tocar “Ver carrito” / “Finalizar” en la barra inferior.
  - El contenido del sheet es el mismo `Cart` (ítems, cliente, tipo de pedido, confirmar).
  - Al confirmar pedido o cerrar, se cierra el sheet.
- **Ventaja:** El usuario no hace scroll; abre el carrito como overlay, revisa y confirma.
- **Implementación:** 
  - En móvil: no renderizar el `Cart` en el flujo; renderizarlo dentro de un `Sheet`/`Drawer` que se abre con la barra inferior o un FAB.
  - En `lg+`: mantener el `Cart` en la columna derecha como ahora.
- **Transición:** Reutilizar el mismo componente `Cart`; solo cambia el contenedor (flujo vs sheet).

**Archivos:** `POSView.tsx`, posible `CartSheet.tsx` o uso de un `Drawer`/`Sheet` existente, `Cart.tsx` sin cambios de lógica.

---

### Fase 4 — Tablet: 2 columnas (productos | carrito)
**Objetivo:** En tablet (md, ~768px–1023px), mostrar productos y carrito lado a lado.

- **Qué:** 
  - Breakpoint `md`: grid 2 columnas — columna 1: categorías + productos; columna 2: carrito (sticky).
  - Así se evita scroll largo en tablets; el carrito ya está a la vista.
- **Ajustes:** 
  - La barra inferior fija (Fase 1) puede ocultarse en `md` si el carrito ya es visible en columna.
  - En `lg` se mantiene el layout actual (2/3 + 1/3).

**Archivos:** `POSView.tsx` (grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, column spans adecuados).

---

### Fase 5 — Toque y accesibilidad
**Objetivo:** Áreas de toque suficientes y gestos claros.

- **Qué:** 
  - Botones y filas de producto con `min-h-[44px]` o `py-3` donde haga falta.
  - En `CategoryList`, chips con suficiente padding en móvil.
  - Asegurar que el sheet del carrito se pueda cerrar con gesto de arrastre (si se usa componente con soporte) o con botón “Cerrar” claro.
  - Revisar contraste y focus visible en modo oscuro.

**Archivos:** `CategoryList.tsx`, `ProductGrid.tsx`, `Cart.tsx`, componente del sheet.

---

## 4. Orden sugerido de implementación

| Orden | Fase                    | Impacto | Esfuerzo |
|-------|-------------------------|---------|----------|
| 1     | Barra inferior fija     | Alto    | Bajo     |
| 2     | Header compacto móvil   | Medio   | Bajo     |
| 3     | Tablet 2 columnas       | Alto    | Bajo     |
| 4     | Carrito como sheet móvil| Alto    | Medio    |
| 5     | Toque y a11y            | Medio   | Bajo     |

Recomendación: hacer **1 → 2 → 3** primero (barra, header, 2 columnas tablet); luego **4** (sheet) si se quiere evitar por completo el scroll al carrito en móvil; **5** en paralelo o después.

---

## 5. Resumen de cambios por archivo

| Archivo               | Cambios principales |
|-----------------------|----------------------|
| `POSView.tsx`         | Header responsive; grid `md:grid-cols-2 lg:grid-cols-3`; condición para mostrar Cart en flujo vs en sheet; integración barra inferior. |
| `ScrollToCartFAB.tsx` | Evolucionar a “Barra inferior” con ítems + total + CTA, o reemplazar por `CartBottomBar.tsx`. |
| Nuevo `CartBottomBar.tsx` (opcional) | Barra fija con resumen y “Ver carrito” / “Finalizar”. |
| Nuevo `CartSheet.tsx` (opcional) | Wrapper que muestra `Cart` en un bottom sheet en móvil. |
| `CategoryList.tsx`   | Revisar tamaño de touch en chips. |
| `ProductGrid.tsx`    | Revisar altura de filas en lista móvil. |
| `Cart.tsx`           | Sin cambios de lógica; posible prop `compact` para vista en sheet si se quiere reducir padding. |

---

## 6. Criterios de éxito

- En **móvil:** el usuario ve resumen del pedido y puede ir al carrito/finalizar sin scroll largo (barra fija o sheet).
- En **tablet:** productos y carrito visibles sin scroll (2 columnas).
- En **desktop:** sin cambios respecto al comportamiento actual.
- **Accesibilidad:** áreas de toque ≥ 44px y focus visible en elementos interactivos.

Si quieres, el siguiente paso puede ser implementar la **Fase 1 (barra inferior)** y la **Fase 2 (header compacto)** en el código.
