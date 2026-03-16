# Plan de implementación: Cierre de caja y “Empezar el día”

## 1. Resumen ejecutivo

Objetivo: permitir que el **admin** (solo admin, no cajero) pueda **“Empezar el día”** (habilitar POS y Cocina 3D) y **“Cerrar caja”** con cálculos del día, recuentos y descuento del monto pagado a empleados de las ganancias. La experiencia debe ser clara, solo para admin, y soportar **light y dark mode**.

---

## 2. Análisis del estado actual

### 2.1 Roles y rutas

| Rol    | Ruta por defecto | Accesos |
|--------|------------------|--------|
| **admin**  | `/home`          | HOME, POS, PEDIDOS, ADMIN (panel admin, cocina, clientes) |
| **cajero** | `/home/pos`      | Solo POS y PEDIDOS |

- **Home** (`/home`) y **Admin** (`/home/admin`) están protegidos con `requireRole(['admin'])`.
- El cajero no ve el panel de administración ni el Inicio; entra directo al POS.

### 2.2 Cálculo del resumen: turno actual vs último cierre (implementado)

- **Caja abierta:** al hacer “Empezar el día”, el dashboard hace el recuento **desde `apertura_at`** (inicio del turno). Ingresos, Costo estimado y Ganancia estimada reflejan solo lo vendido desde que se abrió la caja. El label muestra “Turno actual (desde HH:MM)”.
- **Caja cerrada:** se muestra el **último cierre** guardado en `sesiones_caja` (total_ventas, total_costo_estimado, ganancia_neta, cantidad_pedidos). Ese resumen queda **registrado** hasta que se vuelva a abrir la caja otro día. El label muestra “Último cierre (dd/mmm/aaaa)”.
- **Al “Cerrar caja”** se calculan los totales del turno y se guardan en la sesión; al cerrar el modal, el header y KPIs pasan a mostrar esos datos como “Último cierre”.

### 2.3 Dónde vive la UI admin

- **AdminHeader** (`features/admin/components/AdminHeader.tsx`): resumen diario, KPIs (ingresos, costo, ganancia) y botones (Ir al POS, Cocina 3D, Clientes, Cargar stock, etc.).
- **AdminView**: contenedor que usa `AdminHeader` + KPI cards, inventario, etc.
- **TenantContext**: `darkMode`, `usuario.rol`, `tenant`; ya se usa en toda la app para tema y permisos.

### 2.4 Tema (light/dark)

- `TenantContext` expone `darkMode` y `toggleDarkMode`.
- Clases Tailwind con `dark:` y variables tipo `border-gray-100 dark:border-gray-800`, `bg-white/80 dark:bg-gray-900/70`, etc.
- Cualquier componente nuevo debe usar el mismo patrón para ser usable en ambos modos.

---

## 3. Modelo de datos propuesto

### 3.1 Sesión de caja (turno)

Se propone una tabla **por tenant** que represente cada “día operativo” (apertura → cierre).

**Tabla: `sesiones_caja`**

| Columna            | Tipo        | Descripción |
|--------------------|------------|-------------|
| id                 | UUID PK     | Identificador de la sesión |
| tenant_id          | UUID FK     | Lomitería |
| apertura_at        | TIMESTAMPTZ | Cuándo se abrió la caja (“Empezar el día”) |
| cierre_at          | TIMESTAMPTZ NULL | Cuándo se cerró (NULL = caja abierta) |
| abierto_por_id     | UUID FK usuarios | Usuario admin que abrió |
| cerrado_por_id     | UUID FK usuarios NULL | Usuario admin que cerró |
| total_ventas        | NUMERIC     | Suma de `total` de pedidos del turno (confirmados/facturados) |
| total_costo_estimado | NUMERIC   | Costo estimado del día (opcional, puede calcularse al cerrar) |
| monto_pagado_empleados | NUMERIC  | Monto ingresado al cerrar (sueldos/adelantos/etc.) |
| gastos_extra        | JSONB     | Array opcional de { descripcion, monto }; se restan de ganancia_neta (migración 13) |
| ganancia_neta       | NUMERIC    | total_ventas - total_costo_estimado - monto_pagado_empleados - sum(gastos_extra) |
| cantidad_pedidos    | INT        | Nº de pedidos del turno |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

- **Caja “abierta”**: existe una fila con `cierre_at IS NULL` para ese `tenant_id`.
- **“Empezar el día”**: insertar nueva fila con `cierre_at = NULL` y `abierto_por_id = usuario.id`.
- **“Cerrar caja”**: actualizar esa fila con `cierre_at = NOW()`, totales calculados y `monto_pagado_empleados` (y `ganancia_neta`).

### 3.2 Estado “caja abierta” por tenant

- **Opción A**: Derivar siempre de `sesiones_caja` (existencia de fila con `cierre_at IS NULL`).
- **Opción B**: Columna `caja_abierta BOOLEAN` en `tenants` (o tabla `estado_caja`) para lecturas rápidas y evitar consultas en cada carga del POS.

Recomendación: **Opción A** para una sola fuente de verdad; si más adelante se necesita rendimiento extra, se puede añadir un cache o columna derivada.

### 3.3 Pedidos asociados al turno

- Los pedidos ya tienen `tenant_id` y `created_at`.
- Al **cerrar caja** se consideran “del turno” los pedidos del tenant con `created_at >= sesion.apertura_at` y `created_at <= cierre_at` (y estado no anulado, según reglas actuales).
- No es estrictamente necesario una FK de `pedidos` → `sesiones_caja` en la primera versión: el cierre puede calcular sumas leyendo por rango de fechas. Si se quiere trazabilidad fuerte, se puede añadir `sesion_caja_id` a `pedidos` en una fase posterior.

---

## 4. Flujos de negocio

### 4.1 Empezar el día (solo admin)

1. Admin entra a **Inicio** o **Administración** (`/home` o `/home/admin`).
2. Si no hay sesión abierta para el tenant:
   - Se muestra el botón **“Empezar el día”** (y opcionalmente un aviso de que POS/Cocina están deshabilitados hasta abrir).
3. Al hacer clic:
   - Server action (o API) verifica `usuario.rol === 'admin'`.
   - Comprueba que no exista ya una sesión con `cierre_at IS NULL` para el tenant.
   - Inserta en `sesiones_caja`: `tenant_id`, `apertura_at = NOW()`, `abierto_por_id`, `cierre_at = NULL`.
4. Tras éxito: se actualiza estado en cliente (React state o contexto) y se muestran **“Cerrar caja”** y el resto de acciones (POS, Cocina, etc.) como disponibles.

### 4.2 Operación con caja abierta

- POS y Cocina 3D permiten uso normal.
- En el panel admin se muestra **“Cerrar caja”** (y opcionalmente “Caja abierta desde las HH:MM”).

### 4.3 Cerrar caja (solo admin)

1. Admin hace clic en **“Cerrar caja”**.
2. Se abre un **modal/drawer de cierre** que muestre:
   - Resumen del día (o del turno):
     - Total ventas (suma de pedidos del turno).
     - Costo estimado (si ya se calcula en admin).
     - Cantidad de pedidos.
   - Campo **“Monto pagado a empleados (hoy)”** (obligatorio o con valor 0 por defecto).
   - Cálculo en vivo: **Ganancia neta = Ventas - Costo estimado - Monto pagado empleados**.
   - Botón **“Confirmar cierre”**.
3. Al confirmar:
   - Server action verifica `usuario.rol === 'admin'`.
   - Obtiene la sesión abierta (`cierre_at IS NULL`).
   - Calcula totales desde `pedidos` (y opcionalmente costo desde la lógica actual del dashboard).
   - Actualiza la fila: `cierre_at`, `total_ventas`, `total_costo_estimado`, `monto_pagado_empleados`, `ganancia_neta`, `cantidad_pedidos`, `cerrado_por_id`.
4. Tras éxito: se cierra el modal y el estado pasa a “caja cerrada”. POS y Cocina deben volver a mostrarse bloqueados hasta un nuevo “Empezar el día”.

### 4.4 Comportamiento para cajero cuando la caja está cerrada

- Si el cajero tiene guardada la ruta `/home/pos` o navega al POS:
  - Se debe consultar si la caja está abierta (existencia de sesión abierta para el tenant).
  - Si está cerrada: mostrar **pantalla de bloqueo** con mensaje del tipo: “La caja está cerrada. Un administrador debe iniciar el día.” (sin opción de abrir caja).
- Cocina 3D (`/home/admin/cocina`): solo accesible por admin; si se quiere restringir por caja, mismo criterio: si caja cerrada, mensaje “Iniciar el día desde Administración”.

---

## 5. Ubicación de botones y UX (Admin)

### 5.1 Dónde colocar “Empezar el día” y “Cerrar caja”

- **Recomendación principal**: en el **AdminHeader** (panel de administración), dentro del bloque de “Acciones”, bien visibles.
  - Ventajas: el admin ya está en contexto “operación del negocio”; no hace falta una pantalla extra; coherente con “Ir al POS”, “Cocina 3D”, “Cargar stock”.
- Alternativa: en la **Home** (`/home`), arriba de las tarjetas, un banner o card “Estado de caja” con un solo CTA (“Empezar el día” o “Cerrar caja” según estado).

Sugerencia de implementación:

- **AdminHeader**:
  - Si **caja cerrada**: mostrar un botón destacado **“Empezar el día”** (ej. verde/primario) al inicio de la barra de acciones, y opcionalmente un texto: “Al iniciar el día se habilitan POS y Cocina.”
  - Si **caja abierta**: mostrar **“Cerrar caja”** (ej. naranja o secundario) en la misma barra; al lado o debajo, un indicador discreto: “Caja abierta desde 08:00” (usando `apertura_at`).
- **Home** (opcional): si se quiere que el admin vea el estado nada más entrar, un card pequeño bajo el header con el mismo estado y el mismo CTA (“Empezar el día” / “Cerrar caja”) que redirige a admin o ejecuta la misma acción.

### 5.2 Modal / drawer “Cerrar caja”

- Título: “Cerrar caja”.
- Resumen en cards o líneas:
  - Total ventas del día (turno).
  - Costo estimado.
  - Monto pagado a empleados (input).
  - Ganancia neta (calculada, solo lectura).
- Botones: “Cancelar” y “Confirmar cierre”.
- Diseño: reutilizar el mismo criterio de bordes, fondos y texto que el resto del admin (`border-gray-200 dark:border-gray-700`, `bg-white dark:bg-gray-800`, etc.) para light/dark.

### 5.3 Indicadores claros

- **Caja cerrada**: mensaje corto en AdminHeader tipo “Caja cerrada. Iniciá el día para operar POS y Cocina.” y botón “Empezar el día”.
- **Caja abierta**: texto “Caja abierta” + hora de apertura; botón “Cerrar caja”.
- En POS/Cocina (cuando caja cerrada): pantalla única con ícono + texto, sin acceso al flujo de ventas ni cocina.

---

## 6. Permisos y seguridad

- **Empezar el día**: solo `rol === 'admin'`. Verificar en server action (y opcionalmente en UI ocultando el botón para no-admin).
- **Cerrar caja**: solo `rol === 'admin'`. Misma verificación en server action; el modal solo se muestra a admins.
- **Cajero**: no debe tener rutas ni acciones para abrir/cerrar caja; solo ve POS (y si caja cerrada, la pantalla de bloqueo).
- RLS en Supabase: políticas en `sesiones_caja` para que solo usuarios del mismo `tenant_id` puedan leer; solo usuarios con rol admin (o un check en aplicación que inserte/actualice solo si es admin) puedan insertar/actualizar.

---

## 7. Diseño visual (light/dark)

- Usar siempre `darkMode` del `TenantContext` (o clase `dark` en el root) y clases condicionales:
  - Fondos: `bg-white dark:bg-gray-900`, `bg-gray-50 dark:bg-gray-800`.
  - Bordes: `border-gray-200 dark:border-gray-700`.
  - Texto: `text-gray-900 dark:text-white`, `text-gray-600 dark:text-gray-400`.
- Botones:
  - “Empezar el día”: estilo primario (ej. verde o naranja acorde a la app): `bg-emerald-600 dark:bg-emerald-500 text-white`.
  - “Cerrar caja”: secundario o warning: `border border-orange-500 text-orange-700 dark:text-orange-400`.
- Modal cierre: mismo contenedor que otros modales del admin (ej. `IngredienteModal`, `InventoryDrawer`): fondo overlay, panel redondeado, títulos y labels legibles en ambos modos.

---

## 8. Plan de implementación por fases

### Fase 1 – Base de datos y estado de caja

1. Crear migración SQL:
   - Tabla `sesiones_caja` con columnas descritas.
   - Índices: `(tenant_id, cierre_at)` para “sesión abierta” y listados.
   - RLS: SELECT/INSERT/UPDATE para usuarios del tenant; política restrictiva para que solo admins puedan INSERT/UPDATE (o control solo en app).
2. Tipos TypeScript: interfaces para `SesionCaja`, `SesionCajaAbierta`, payload de apertura y cierre.
3. Servicio o server actions:
   - `getSesionAbierta(tenantId)`: devuelve la sesión con `cierre_at IS NULL` o null.
   - `abrirCaja(tenantId, usuarioId)`: inserta sesión; solo si no hay abierta.
   - `cerrarCaja(sesionId, payload)`: actualiza con totales y `monto_pagado_empleados`.

### Fase 2 – Cálculos de cierre

1. Función (en servicio o SQL) que, dado `apertura_at` y `cierre_at` (o “ahora”):
   - Suma `total` de pedidos del tenant en ese rango (excluyendo anulados, según reglas actuales).
   - Opcional: calcula costo estimado del día (reutilizando lógica de `adminService` / `processDailyStats` y costos).
2. Al cerrar: calcular `ganancia_neta = total_ventas - total_costo_estimado - monto_pagado_empleados` y persistir en `sesiones_caja`.

### Fase 3 – UI Admin (Empezar / Cerrar)

1. Hook o fetcher: `useEstadoCaja(tenantId)` que devuelva `{ sesionAbierta, sesion, loading }` (sesión abierta o null).
2. **AdminHeader**:
   - Si no hay sesión: botón “Empezar el día” + mensaje; al clic → server action `abrirCaja` → refetch estado.
   - Si hay sesión: texto “Caja abierta desde HH:MM” + botón “Cerrar caja” → abrir modal.
3. Modal **CerrarCajaModal**:
   - Obtener totales (ventas, costo, pedidos) del turno (endpoint o action que use `apertura_at` y “ahora”).
   - Input “Monto pagado a empleados”; cálculo en vivo de ganancia neta.
   - Confirmar → `cerrarCaja` → cerrar modal y actualizar estado (caja cerrada).

### Fase 4 – Bloqueo POS y Cocina cuando caja cerrada

1. En layout o página del POS (`/home/pos`): antes de mostrar el POS, comprobar `getSesionAbierta(tenantId)` (o usar hook/context con estado de caja).
2. Si no hay sesión abierta: renderizar componente **CajaCerradaBlocker** (mensaje + ícono; sin botón de abrir para cajero).
3. Cocina 3D: igual criterio en la página `/home/admin/cocina` (solo admin llega aquí; si caja cerrada, mismo bloqueo o redirección a admin con mensaje “Iniciar el día”).

### Fase 5 – Refinamiento y historial (opcional)

1. Página o sección “Historial de cierres” en admin: listar `sesiones_caja` del tenant con fecha, totales, monto pagado, ganancia neta.
2. Ajustes de copy y accesibilidad (aria-labels, títulos de sección).
3. Tests: al menos que solo admin pueda abrir/cerrar y que los totales del cierre coincidan con los pedidos del rango.

---

## 9. Resumen de archivos a tocar / crear

| Área | Archivos |
|------|----------|
| DB | Nueva migración `database/XX_sesiones_caja.sql` |
| Tipos | `src/features/caja/types/caja.types.ts` (o en `admin`) |
| Servicios / actions | `src/app/actions/caja.ts` o `src/features/caja/services/cajaService.ts` + server actions |
| Cálculos | Reutilizar `adminService` (pedidos del día) o función específica por rango |
| UI estado caja | Hook `useEstadoCaja`, componente `CajaCerradaBlocker` |
| Admin | `AdminHeader.tsx`: botones Empezar día / Cerrar caja + indicador |
| Modal | `CerrarCajaModal.tsx` (o en `features/caja/components`) |
| POS | Página o layout POS: comprobar sesión abierta y mostrar blocker si no |
| Cocina | Página cocina: mismo check y blocker o redirección |
| Rutas | Sin cambios de rutas; solo lógica condicional según estado de caja |

---

## 10. Criterios de aceptación (resumen)

- Solo el rol **admin** puede hacer “Empezar el día” y “Cerrar caja”; el cajero no ve esos botones ni puede ejecutar las acciones.
- Al “Empezar el día” se habilita el uso de POS y Cocina 3D para ese tenant.
- Al “Cerrar caja” se pide el monto pagado a empleados y se calcula ganancia neta (ventas - costo - monto empleados - gastos extra). Opcionalmente se pueden agregar gastos extra (descripción + monto); todo se persiste y se incluye en el reporte PDF.
- Con caja cerrada, POS y Cocina muestran una pantalla de bloqueo clara (sin opción de abrir caja para el cajero).
- La UI de botones, modal e indicadores funciona correctamente en **light mode** y **dark mode** y es clara e intuitiva para el admin.

Con este plan se puede implementar el flujo de cierre de caja de forma ordenada y alineada con el resto de la aplicación.
