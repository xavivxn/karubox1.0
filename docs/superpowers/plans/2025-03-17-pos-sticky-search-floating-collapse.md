# POS sticky search — colapso en “lupa” flotante — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the POS search bar is sticky (after scroll), show a minimal floating circle (magnifying glass icon) instead of the full bar; tapping the circle opens the full search bar in an overlay. Close via backdrop tap, close button, or Escape; focus returns to the circle.

**Architecture:** State `searchOverlayOpen` in POSView; when `searchBarStuck` is true and overlay is closed, render only a circle button; when overlay is open, render a fixed overlay (backdrop + bar + close). POSSearchBar gets an optional close button for overlay mode. Focus trap and focus return on close per spec.

**Tech Stack:** React, Next.js, Tailwind CSS, lucide-react. Spec: `docs/superpowers/specs/2025-03-17-pos-sticky-search-floating-collapse-design.md`.

---

## File structure

| File | Role |
|------|------|
| `src/features/pos/view/POSView.tsx` | Add `searchOverlayOpen` state; conditional render: bar in flow / circle when sticky collapsed / overlay when sticky expanded; circle ref for focus return; close on unstick; padding by state; Escape + tap-outside. |
| `src/features/pos/components/POSSearchBar.tsx` | Optional `onClose?: () => void` and show close button when provided (overlay mode). Keep existing props. |
| (no new file) | Overlay and circle are inline in POSView; focus trap via refs and keydown. |

---

### Task 1: State and close when unstick

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`

- [ ] **Step 1: Add `searchOverlayOpen` and close on unstick**

In POSView, add state and effect:

```ts
const [searchOverlayOpen, setSearchOverlayOpen] = useState(false)

// When bar is no longer sticky, close overlay so we show full bar in flow again
useEffect(() => {
  if (!searchBarStuck) setSearchOverlayOpen(false)
}, [searchBarStuck])
```

Place after the existing `searchBarStuck` state (around line 42). Add the `useEffect` after the existing IntersectionObserver effect.

- [ ] **Step 2: Verify**

Run dev server; scroll POS so bar sticks, then scroll back up. Overlay state is not yet used in UI; this step only ensures no regression and state exists.

---

### Task 2: Circle button when sticky and overlay closed

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`

- [ ] **Step 1: Add ref for circle (focus return)**

Near other refs (e.g. after `searchSentinelRef`):

```ts
const searchCircleRef = useRef<HTMLButtonElement>(null)
```

- [ ] **Step 2: Render circle instead of bar when sticky and overlay closed**

In the sticky wrapper (the div that currently always renders `POSSearchBar`), conditionally render:

- If **not** `searchBarStuck`: render `POSSearchBar` as today (no `compact`; full bar in flow).
- If `searchBarStuck`: always render the **circle button** (so it stays in DOM for focus return and aria-expanded). When `searchOverlayOpen` is true, make the circle **invisible** (`invisible` or `opacity-0 pointer-events-none`) and set `aria-expanded={true}`; when false, circle is visible and `aria-expanded={false}`. `onClick` on circle sets `searchOverlayOpen(true)` only when not already open. When `searchBarStuck` and overlay open, the overlay (next task) is rendered on top.
- When **not** `searchBarStuck`: render full `POSSearchBar` in flow (no circle).

So the sticky block becomes something like:

```tsx
<div className={`sticky top-0 z-10 -mt-px px-0 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
  <div className="max-w-7xl mx-auto">
    {!searchBarStuck && (
      <POSSearchBar ... />
    )}
    {searchBarStuck && (
      <div className={`py-2 ${searchOverlayOpen ? 'invisible' : ''}`}>
        <button
          ref={searchCircleRef}
          type="button"
          onClick={() => !searchOverlayOpen && setSearchOverlayOpen(true)}
          aria-label="Abrir búsqueda"
          aria-expanded={searchOverlayOpen}
          className={...}
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    )}
  </div>
</div>
```

Style the button: `min-w-[44px] min-h-[44px] rounded-full`, border orange subtle, backdrop-blur, shadow; dark/light from `darkMode`. Import `Search` in POSView if not already.

- [ ] **Step 3: Verify**

Scroll so bar sticks; only the circle should show. Tap circle: nothing yet (overlay in next task).

---

### Task 3: Overlay (backdrop + bar + close button)

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`  
- Modify: `src/features/pos/components/POSSearchBar.tsx`

- [ ] **Step 1: Add optional close to POSSearchBar**

In `POSSearchBar.tsx`, extend props:

```ts
interface Props {
  // ... existing
  /** When set, shows a close button (for overlay mode) and calls this on close */
  onClose?: () => void
}
```

When `onClose` is provided, render a close button (e.g. X icon or “Cerrar”) that calls `onClose`. Place it so it’s visible in the bar (e.g. right side). Use `aria-label="Cerrar búsqueda"`. Reuse existing X icon from lucide-react if the bar already has a “clear” X; for overlay we need a separate “close overlay” control (can be another X or a distinct label). So: if `onClose` is provided, show an additional button that calls `onClose` (e.g. left of the clear button, or right; spec says “botón cerrar del overlay”).

- [ ] **Step 2: Render overlay in POSView when sticky and overlay open**

When `searchBarStuck && searchOverlayOpen`, render a **fixed overlay** that covers the viewport (or the POS content area). Use a wrapper with `position: fixed; inset: 0; z-index: 50` (or Tailwind `fixed inset-0 z-50`).

1. **Backdrop:** A div that fills the overlay, `bg-black/40` (or theme-equivalent), `aria-hidden`, `onClick` that calls `closeOverlay()`. `closeOverlay` will be a function that sets `searchOverlayOpen` to false and focuses `searchCircleRef.current`.
2. **Content layer:** A div that does NOT stop propagation for the bar (so clicks on the bar don’t close). Put the **search bar** in a max-width container (e.g. same as POS content), aligned top-left like the current bar. Inside it render `POSSearchBar` with `value`, `onChange`, `onClear`, `darkMode`, and **`onClose={closeOverlay}`** so the bar’s close button closes the overlay and returns focus.

Structure:

```tsx
{searchBarStuck && searchOverlayOpen && (
  <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Búsqueda">
    <div
      className="absolute inset-0 bg-black/40"
      aria-hidden
      onClick={closeOverlay}
    />
    <div className="relative z-10 pt-4 px-4 max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
      <POSSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onClear={() => setSearchTerm('')}
        placeholder="Buscar producto..."
        darkMode={darkMode}
        onClose={closeOverlay}
      />
    </div>
  </div>
)}
```

Define `closeOverlay` in POSView:

```ts
const closeOverlay = () => {
  setSearchOverlayOpen(false)
  setTimeout(() => searchCircleRef.current?.focus(), 0)
}
```

- [ ] **Step 3: Focus input when overlay opens**

When `searchOverlayOpen` becomes true, focus the search input inside the overlay. Use a ref on the input or a wrapper: either pass a ref into POSSearchBar for the input, or use a small effect in POSView that focuses a selector like `[data-pos-search-input]` when `searchOverlayOpen` is true. Easiest: add `data-pos-search-input` to the input in POSSearchBar and in POSView `useEffect(() => { if (searchOverlayOpen) { document.querySelector('[data-pos-search-input]')?.focus() } }, [searchOverlayOpen])`.

- [ ] **Step 4: Verify**

Scroll to stick, tap circle; overlay with bar and close should appear. Tap backdrop or bar’s close → overlay closes and focus returns to circle.

---

### Task 4: Escape to close

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`

- [ ] **Step 1: Escape key closes overlay**

In POSView, add a `useEffect` that subscribes to `keydown` when `searchOverlayOpen` is true. If `event.key === 'Escape'`, call `closeOverlay()` and `event.preventDefault()`. Cleanup the listener when overlay closes or on unmount.

- [ ] **Step 2: Verify**

Open overlay with circle tap; press Escape; overlay closes and focus is on circle (circle already has `aria-expanded={searchOverlayOpen}` from Task 2).

---

### Task 5: Focus trap inside overlay

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`

- [ ] **Step 1: Keep focus inside overlay while open**

When overlay is open, trap focus inside the overlay container. On Tab/Shift+Tab, if focus would leave the overlay, move it to the first/last focusable inside (e.g. close button, input, clear button). Option A: add a keydown listener on the overlay div that, when key is Tab, finds focusables and cycles. Option B: use a small focus-trap utility or a ref that holds the overlay and on keydown Tab check if focus is on last element and preventDefault + focus first (and vice versa). Implement a simple trap: query focusable elements inside the overlay (button, input, a with href), and on Tab if we’re on the last and not shift, preventDefault and focus first; on Shift+Tab if we’re on the first, preventDefault and focus last.

- [ ] **Step 2: Verify**

Open overlay, Tab through close button → input → clear (if any); focus should not leave the overlay until Escape or close.

---

### Task 6: Padding when circle only; optional scroll lock

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`

- [ ] **Step 1: Reduce top padding when only circle is shown**

Content below the sticky area currently gets `pt-14` when `searchBarStuck`. When only the circle is shown (searchBarStuck && !searchOverlayOpen), use less padding so more content is visible: e.g. `pt-2` or `pt-3`. When overlay is open, padding under the sticky area is irrelevant (overlay covers). So: when `searchBarStuck && !searchOverlayOpen` use `pt-2` (or `pt-3`); when `searchBarStuck && searchOverlayOpen` keep a small pt or none; when !searchBarStuck no extra pt. Apply to the same container that today has `searchBarStuck ? 'pt-14' : ''` — change to: if !searchBarStuck then no pt; if searchBarStuck && searchOverlayOpen then pt as needed for layout (or 0); if searchBarStuck && !searchOverlayOpen then pt-2.

- [ ] **Step 2: Optional scroll lock**

If implementing scroll lock (spec says optional): when `searchOverlayOpen` is true, set `overflow: hidden` on the scroll container (e.g. the div with `ref={scrollRef}`) or on body; when false, remove it. Use useEffect that sets document.body.style.overflow or a class on the POS scroll div.

- [ ] **Step 3: Verify**

Sticky + circle only: content has less top padding. Open overlay: no layout jump; optionally scroll is locked.

---

### Task 7: Polish and accessibility

**Files:**  
- Modify: `src/features/pos/view/POSView.tsx`  
- Modify: `src/features/pos/components/POSSearchBar.tsx`

- [ ] **Step 1: data attribute for focus**

In POSSearchBar, add `data-pos-search-input` to the input element so POSView can focus it when overlay opens (if not already done in Task 3).

- [ ] **Step 2: Verify all aria and focus**

Confirm: circle has `aria-label="Abrir búsqueda"` and `aria-expanded`; overlay container has `aria-modal="true"`; close control has `aria-label="Cerrar búsqueda"`; input keeps `aria-label="Buscar producto por nombre o categoría"`. Close (backdrop, button, Escape) returns focus to circle. No clearing of `searchTerm` on close.

- [ ] **Step 3: Manual test**

Full flow: load POS, scroll to stick → circle only; tap circle → overlay, input focused; type, close with backdrop → focus on circle, term kept; open again → term still there. Close with Escape and with bar close button. Scroll up → overlay closes, full bar in flow.

---

## Summary

- **POSView:** `searchOverlayOpen`, `searchCircleRef`, close when `!searchBarStuck`, conditional render (bar / circle / overlay), overlay with backdrop + bar + close, `closeOverlay` with focus return, Escape listener, focus trap, padding by state, optional scroll lock.
- **POSSearchBar:** optional `onClose` and close button for overlay mode; `data-pos-search-input` on input.
- **Spec:** `docs/superpowers/specs/2025-03-17-pos-sticky-search-floating-collapse-design.md`.
