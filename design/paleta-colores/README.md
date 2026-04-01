# Paleta de colores — KarúBox / LomiPos

Documentación de referencia de los colores que usa la app. Los valores **Tailwind** (`orange-500`, etc.) mapean a la escala por defecto de Tailwind v3.

---

## 1. Marca y acentos principales

| Uso | Clases / token habitual | Notas |
|-----|-------------------------|--------|
| **Acento principal (CTA, bordes suaves, hover breadcrumb)** | `orange-500`, `orange-600`, `hover:text-orange-600` | Navbar, botones secundarios, enlaces |
| **Gradiente logo / highlights** | `from-orange-500 to-orange-600` | Bloque logo en `AppNavbar` |
| **Scrollbars personalizados** | `rgb(249 115 22)` thumb, hover `rgb(234 88 12)` | `globals.css` → `--scrollbar-color-thumb` |

**Tema layout (`src/utils/constants.ts`):**

- Claro: `bg-white`, `border-orange-100`, `text-gray-900`
- Oscuro: `bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900`, `border-gray-700`, `text-gray-100`

---

## 2. Sistema UI (shadcn / HSL)

Definido en `src/app/globals.css` (`:root` y `.dark`). Consumido vía Tailwind: `bg-background`, `text-foreground`, `border-border`, `destructive`, `chart-1`…

| Token | Rol |
|-------|-----|
| `--background` / `--foreground` | Fondo y texto base |
| `--primary` / `--primary-foreground` | Botones primarios (tono slate oscuro en claro) |
| `--destructive` | Acciones peligrosas / errores |
| `--chart-1` … `--chart-5` | Gráficos (tonos variados) |
| `--destructive` | Rojo error (HSL ~0°) |

Modo oscuro redefine los mismos tokens con luminosidad invertida.

---

## 3. Tarjetas del inicio (Dashboard)

Fuente: `src/features/common/components/AppDashboardCard.tsx` → `COLOR_MAP`.

Cada módulo tiene familia **Tailwind 500** para barra e icono, **50** para fondos suaves:

| Módulo | Familia | Texto icono (claro) | Texto icono (oscuro) |
|--------|---------|---------------------|-------------------------|
| Punto de Venta | `orange` | `text-orange-600` | `text-orange-400` |
| Historial de pedidos | `emerald` | `text-emerald-600` | `text-emerald-400` |
| Administración | `blue` | `text-blue-600` | `text-blue-400` |
| Clientes | `purple` | `text-purple-600` | `text-purple-400` |
| Cocina 3D | `red` | `text-red-600` | `text-red-400` |

Lista de datos: `src/features/home/constants/home.constants.ts` (`DASHBOARD_CARDS` + `color`).

---

## 4. Breadcrumb (Cocina 3D)

Fuente: `src/components/layout/Breadcrumb.tsx` (cuando `showCocinaQuickNav`).

| Segmento | Color |
|----------|--------|
| Inicio | Gris + hover naranja (como enlaces secundarios) |
| Administración | `blue-600` / `blue-400` |
| Cocina 3D (actual) | `red-600` / `red-400` |
| POS | `orange` |
| Admin | `blue` |
| Clientes | `purple` |
| Historial | `emerald` |

---

## 5. Cocina 3D — etapas de pedido

Fuente: `src/features/cocina/utils/cocina.utils.ts` → `STAGE_COLORS`.

| Etapa | Hex | Uso |
|-------|-----|-----|
| Nuevo (Recibido) | `#FF6B35` | Naranja marca |
| Cocinando | `#FF3E3E` | Rojo |
| Empacando | `#4CAF50` | Verde |
| Entregado | `#FFD700` | Dorado |

**KPIs / stats panel** (`CocinaVirtualView`): acentos `#FF6B35`, `#4CAF50`, `#FFD700`, `#9B59B6` en tarjetas.

**Confetti** (`KitchenCanvas`): `#FFD700`, `#FF6B35`, `#4CAF50`, `#4A90D9`, `#FF3E3E`, `#9B59B6`, `#FF69B4`.

---

## 6. Logros (medallas)

Fuente: `src/features/cocina/utils/achievements.ts` → `TIER_COLORS` (hex fijos).

| Tier | Hex | Tailwind aproximado |
|------|-----|---------------------|
| Bronce | `#CD7F32` | ámbar/bronce |
| Plata | `#C0C0C0` | gris |
| Oro | `#FFD700` | amarillo/dorado |
| Diamante | `#a78bfa` | violeta |

Fondos de tarjeta: `TIER_BG` (gradientes Tailwind con opacidad).

---

## 7. Diamante / holograma (UI)

En `AchievementsPanel` y trofeos: gradientes multi-color (`#f43f5e`, `#a855f7`, `#3b82f6`, `#06b6d4`, `#10b981`, `#f59e0b`).

---

## 8. Semántica habitual en la app

| Significado | Patrón típico |
|-------------|----------------|
| Éxito / caja abierta | `emerald-*`, `green-*` |
| Advertencia | `amber-*`, `orange-*`, `yellow-*` |
| Error / anular / cerrar sesión | `red-*`, `destructive` |
| Información | `blue-*` |
| Neutro | `gray-*` |

---

## 9. Archivos de referencia rápida

| Archivo | Contenido |
|---------|-----------|
| `src/app/globals.css` | Variables CSS, animaciones Cocina |
| `tailwind.config.ts` | Mapeo `hsl(var(--…))` |
| `src/utils/constants.ts` | `THEME_CONFIG` claro/oscuro |
| `src/features/common/components/AppDashboardCard.tsx` | `COLOR_MAP` tarjetas |
| `src/features/cocina/utils/cocina.utils.ts` | `STAGE_COLORS` |
| `src/features/cocina/utils/achievements.ts` | `TIER_COLORS` |

---

*Generado a partir del análisis del repositorio; al añadir nuevos módulos, actualizar esta carpeta para mantener una sola fuente de verdad visual.*
