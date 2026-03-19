# Especificación: Buscador rápido POS (cajero móvil)

**Fecha:** 2025-03-17  
**Estado:** Aprobado  
**Alcance:** Punto de venta (POS) — búsqueda de productos en tiempo real para cajero en celular.

---

## 1. Objetivo

Permitir al cajero encontrar productos rápido desde el celular sin depender solo de las categorías: un campo de búsqueda fijo que filtra por nombre, descripción y categoría, mostrando resultados en el mismo grid del POS.

---

## 2. Decisiones de diseño

| Tema | Decisión |
|------|----------|
| Alcance de búsqueda | Siempre sobre **todos** los productos del local (no solo la categoría seleccionada). |
| Ubicación | Barra **sticky** debajo del header del POS (siempre visible al hacer scroll). |
| Campos buscables | **Nombre** del producto, **descripción** y **nombre de la categoría**. |
| Vista con búsqueda activa | Categorías siguen visibles y clicables; el grid muestra **solo** productos que coinciden con la búsqueda. Con 0 o 1 carácter no se aplica filtro (vista normal por categoría). |
| Activación | Búsqueda activa solo con **≥ 2 caracteres**. |
| Origen de datos | Filtro **en memoria** sobre `productos` y `categorias` ya cargados por `usePOSData()`; sin llamadas al backend. |

---

## 3. UX y disposición

- **Barra sticky:** Debajo del header ("Punto de venta" + iconos). Contenedor con `position: sticky`, `top` según altura del header, mismo fondo que el contenido (claro/oscuro según tema).
- **Campo:** Input tipo search, ancho completo en móvil.
  - Placeholder: "Buscar producto..."
  - Icono de lupa a la izquierda.
  - Botón/ícono de limpiar (X) a la derecha, **solo cuando hay texto**.
- **Comportamiento:**
  - **0 o 1 carácter:** No se aplica búsqueda; vista actual por categoría (grid + "2 categorías siguientes").
  - **≥ 2 caracteres:** Filtro en memoria (nombre, descripción, nombre de categoría); grid muestra solo coincidencias. Bloque "2 categorías siguientes" **oculto** mientras hay búsqueda activa.
- **Estado vacío:** Si hay ≥2 caracteres y 0 resultados: mensaje "Ningún producto coincide con '[texto]'" y acción "Limpiar búsqueda" (mismo efecto que el botón X).

---

## 4. Flujo de datos y lógica

- **Estado:** `searchTerm` (string) en `POSView` (mismo nivel que `selectedCategory`).
- **Cálculo de la lista al grid:**
  - Si `searchTerm.trim().length < 2`: lista = productos por categoría actual (`filteredProducts`); se muestran las "2 categorías siguientes".
  - Si `searchTerm.trim().length >= 2`:
    - Map de `categoria_id` → nombre de categoría desde `categorias`.
    - Filtro sobre **todos** los `productos`: incluir si el término (normalizado) está en nombre, descripción o nombre de la categoría.
    - Esa lista se pasa al grid; se oculta el bloque "2 categorías siguientes".
- **Normalización:** Minúsculas y sin tildes (ej. `normalize('NFD').replace(/\p{Diacritic}/gu, '')`) tanto para el término como para los campos del producto.
- **Criterio de match:** Substring: el término normalizado está **contenido** en al menos uno de: nombre, descripción, nombre de categoría.

---

## 5. Componentes e integración

- **Nuevo componente:** `POSSearchBar` en `src/features/pos/components/`.
  - Props: `value`, `onChange`, `onClear`, `placeholder`, `darkMode`, `disabled` (opcional).
  - Solo presentación: input, ícono lupa, botón limpiar (visible cuando hay valor).
- **POSView:**
  - Barra entre el `<header>` y el contenedor de `CategoryList` + `ProductGrid`, dentro de un wrapper sticky (mismo fondo que la página).
  - Estado `searchTerm`; lista al grid = resultado de filtro cuando búsqueda activa, si no `filteredProducts`.
  - Cuando búsqueda activa y lista vacía: mostrar mensaje "Ningún producto coincide con '…'" y "Limpiar búsqueda" (en POSView o mediante prop `emptyMessage` a ProductGrid).
- **ProductGrid:** Se reutiliza sin cambios de API; opcionalmente prop `emptyMessage` para el estado vacío cuando la causa es búsqueda sin resultados.
- **CategoryList:** Sin cambios; siempre visible. Cambiar categoría no modifica `searchTerm`.

---

## 6. Casos borde y accesibilidad

- Teclado móvil: input no bloquea scroll; barra sticky visible para ver resultados al tipear.
- Limpiar: botón X y "Limpiar búsqueda" vacían `searchTerm`.
- **Accesibilidad:** `aria-label` en el input ("Buscar producto por nombre o categoría") y en el botón limpiar ("Limpiar búsqueda").
- **Rendimiento:** Filtro en `useMemo(productos, categorias, searchTerm)`; sin debounce en v1.

---

## 7. No incluido (v1)

- Debounce.
- Búsqueda por palabras (solo substring).
- Búsqueda en backend/API.
- Historial o sugerencias de búsquedas anteriores.
