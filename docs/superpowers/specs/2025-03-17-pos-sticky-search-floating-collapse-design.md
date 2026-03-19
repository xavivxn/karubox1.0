# Especificación: Barra de búsqueda POS — colapso en “lupa” flotante (sticky)

**Fecha:** 2025-03-17  
**Estado:** Aprobado (diseño)  
**Alcance:** Punto de venta (POS) — cuando la barra de búsqueda queda sticky al hacer scroll, se colapsa en un círculo con lupa que al tocar abre la barra en overlay.

---

## 1. Objetivo

Reducir la presencia visual de la barra de búsqueda cuando el cajero hace scroll: en lugar de una barra ancha pegada arriba, mostrar un **objeto flotante mínimo** (círculo con ícono de lupa) que al tocarse expande la barra completa en un overlay. Máxima visibilidad del listado cuando no se está buscando; búsqueda rápida con un toque cuando hace falta.

---

## 2. Decisiones de diseño

| Tema | Decisión |
|------|----------|
| Estado sticky colapsado | Solo **círculo con lupa** (sin texto), misma posición izquierda que la barra. |
| Apertura | Tap en el círculo → barra completa en **overlay** (misma apariencia que la barra actual). |
| Cierre del overlay | Tap en el **backdrop** (fuera de la barra), **botón cerrar** o tecla **Escape** (requerido en v1). |
| Scroll hacia arriba | Si la barra deja de ser sticky, se cierra el overlay (si estaba abierto) y se muestra la barra normal en flujo. |
| Texto ya escrito | Al cerrar el overlay **no** se borra `searchTerm`; al reabrir se mantiene el término y los resultados. |

---

## 3. Comportamiento y estados

1. **Barra en flujo (no sticky)**  
   Sin cambio respecto al comportamiento actual: barra completa visible (input + lupa + limpiar si hay texto).

2. **Sticky y colapsado**  
   Al quedar la barra “pegada” por scroll, se muestra solo un **círculo con el ícono de lupa** en la misma posición (alineado a la izquierda). No hay input visible.

3. **Sticky y expandido (overlay)**  
   Tap en el círculo → se abre la **barra de búsqueda completa** en una capa por encima del contenido (overlay), con backdrop semitransparente. El input recibe foco.

4. **Cierre del overlay**  
   Cierre por: tap en el backdrop, botón/ícono cerrar en la barra, o tecla Escape. Al hacer scroll hacia arriba y dejar de estar sticky, el overlay se cierra y se muestra la barra normal en flujo.

---

## 4. Detalles visuales y animación

- **Círculo:** Mínimo ~44px de alto/ancho (zona táctil). Mismo criterio de tema (claro/oscuro), borde sutil naranja, fondo con blur (glass), sombra suave. Solo ícono de lupa centrado.

- **Colapsado → expandido:** El círculo crece en ancho hasta la barra completa en 200–300 ms (ease-out). Backdrop aparece en fade-in. Foco en el input al final de la animación.

- **Overlay y backdrop:** Fondo semitransparente (ej. `bg-black/40` o equivalente en tema claro); opcional blur suave. La barra expandida mantiene la apariencia actual del POS (misma forma, colores, lupa, botón limpiar).

- **Expandido → colapsado:** Barra se achica de nuevo al círculo (misma duración), backdrop fade-out.

---

## 5. Integración técnica

- **Estado en POSView:**  
  - `searchBarStuck` (existente): indica si la barra está pegada (IntersectionObserver).  
  - `searchOverlayOpen` (nuevo): `true` cuando el overlay está abierto; solo relevante cuando `searchBarStuck === true`.

- **Renderizado:**  
  - No sticky → barra completa en flujo.  
  - Sticky y `!searchOverlayOpen` → solo botón círculo (lupa).  
  - Sticky y `searchOverlayOpen` → overlay (backdrop + barra completa).  
  - Al pasar `searchBarStuck` a `false` (scroll hacia arriba), cerrar overlay (`searchOverlayOpen = false`).

- **Tap outside:** Backdrop clickeable; si el target del evento no es la barra ni un hijo, cerrar overlay.

- **Componentes:** POSSearchBar se reutiliza en el overlay (mismas props). El botón círculo puede ser un `<button>` con ícono de lupa en POSView o un pequeño subcomponente. Overlay con `position: fixed` (o absoluto respecto al área del POS) y **z-index** alto (p. ej. `z-50` o superior respecto al contenido del POS).

- **Padding del contenido:** Cuando solo se muestra el círculo sticky, reducir el padding superior a p. ej. `pt-2` o `pt-3` (recomendado para ganar espacio vertical). Con la barra completa en flujo se mantiene el padding actual (ej. `pt-14` cuando corresponda).

---

## 6. Casos borde y accesibilidad

- **Teclado móvil:** Al abrir el overlay y enfocar el input, el teclado se abre; el overlay no se cierra por ello. Cierre solo por tap fuera, botón cerrar o Escape (requerido en v1).

- **Escape:** Con foco en el input (o en cualquier elemento del overlay), Escape cierra el overlay. Al cerrar (backdrop, botón cerrar o Escape), **devolver el foco al botón círculo (trigger)** por accesibilidad.

- **Accesibilidad:**  
  - Botón círculo: `aria-label="Abrir búsqueda"` (o "Buscar producto"); `aria-expanded="true"` cuando el overlay está abierto, `false` cuando está cerrado.  
  - Input: mismo `aria-label` actual ("Buscar producto por nombre o categoría").  
  - Botón cerrar del overlay: `aria-label="Cerrar búsqueda"`.  
  - Con el overlay abierto, **mantener el foco dentro del overlay (focus trap)** hasta cerrar. Si se usa `aria-modal="true"` en el contenedor del overlay, el focus trap es obligatorio para cumplir con el patrón modal.

- **Texto al cerrar:** No limpiar `searchTerm` al cerrar el overlay; al reabrir se conserva término y resultados.

- **Scroll de fondo (opcional v1):** Bloquear scroll del contenido detrás mientras el overlay está abierto; restaurar al cerrar. Si se implementa: p. ej. `overflow: hidden` en el contenedor scrollable del POS o en `body` mientras el overlay está abierto.

---

## 7. Relación con la spec anterior

Esta especificación **extiende** la de buscador rápido POS (`2025-03-17-pos-quick-search-design.md`): la lógica de búsqueda (filtro en memoria, ≥2 caracteres, nombre/descripción/categoría) y la barra en flujo se mantienen. Solo se añade el comportamiento de **colapso en círculo + overlay** cuando la barra está en estado sticky.
