/**
 * Breakpoints compartidos para Cocina 3D (alineados con Tailwind md/lg/xl).
 * Un solo lugar evita desincronía entre shell (CocinaVirtualView) y canvas (KitchenCanvas).
 */

/** Ancho estrictamente menor = vista móvil (una columna + tabs de etapa). Coincide con Tailwind `md` (768px). */
export const COCINA_MOBILE_BREAKPOINT = 768

/**
 * Ancho estrictamente menor = shell compacto: stats arriba o FAB, sin barra full desktop en AppFrame.
 * Coincide con Tailwind `lg` (1024px).
 */
export const COCINA_COMPACT_SHELL_BREAKPOINT = 1024

/**
 * Kanban de 4 columnas solo desde este ancho (Tailwind `xl` = 1280px).
 * Entre 1024px y 1279px se usa el pager 2×2 como en tablet.
 */
export const COCINA_KANBAN_WIDE_BREAKPOINT = 1280

/** Tabs de etapa más compactos (emoji + contador) en móviles muy estrechos. */
export const COCINA_MOBILE_COMPACT_TABS_BREAKPOINT = 400

export function isCocinaMobileWidth(width: number): boolean {
  return width < COCINA_MOBILE_BREAKPOINT
}

export function isCocinaCompactShellWidth(width: number): boolean {
  return width < COCINA_COMPACT_SHELL_BREAKPOINT
}

/** Tablet + “narrow desktop”: pager 2×2, sin cuatro columnas apretadas. */
export function isCocinaKanbanPagerWidth(width: number): boolean {
  return width >= COCINA_MOBILE_BREAKPOINT && width < COCINA_KANBAN_WIDE_BREAKPOINT
}

export function isCocinaKanbanWideWidth(width: number): boolean {
  return width >= COCINA_KANBAN_WIDE_BREAKPOINT
}

/** KPI en banda superior del KitchenCanvas (cuatro mini tarjetas). */
export function isCocinaKitchenKpiDesktopWidth(width: number): boolean {
  return width >= COCINA_COMPACT_SHELL_BREAKPOINT
}

export function isCocinaMobileCompactTabsWidth(width: number): boolean {
  return width < COCINA_MOBILE_COMPACT_TABS_BREAKPOINT
}
