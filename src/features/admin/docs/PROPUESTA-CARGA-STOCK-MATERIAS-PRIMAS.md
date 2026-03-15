# Propuesta: Carga de stock de materias primas existentes

## 1. Análisis del código actual

### 1.1 Flujo actual

| Acción en UI | Componente | Efecto |
|--------------|------------|--------|
| **"Registrar inventario"** (header) | `IngredienteModal` | Crea una **nueva** materia prima en `ingredientes` (nombre, unidad, stock inicial, etc.). |
| **"Nuevo movimiento"** (grid) | Mismo `IngredienteModal` | Igual: solo sirve para **crear** una materia prima nueva. |

No existe hoy una pantalla dedicada para **cargar stock** (entrada) de materias primas **ya registradas**. El usuario que compró, por ejemplo, 50 kg de harina y ya tiene "Harina" creada, no tiene un flujo claro para solo ingresar esa cantidad.

### 1.2 Datos y backend

- **`useAdminDashboard`**  
  - Carga: `stats`, `topClients`, `topProducts`, `inventory`, `ingredientsUsage`.  
  - `inventory` viene de **`fetchInventory`** → tabla **`inventario`** (filas por `producto_id`, stock en esa tabla).  
  - Expone `refetch()` que vuelve a llamar a `fetchDashboardData`.

- **Dos modelos de stock en el sistema**  
  1. **Ingredientes** (`ingredientes`): materias primas usadas en recetas. Stock en `ingredientes.stock_actual`, historial en `movimientos_ingredientes`.  
  2. **Inventario** (`inventario`): filas por producto (`producto_id`). Stock en `inventario.stock_actual`, historial en `movimientos_inventario`.

- **`IngredienteModal`**  
  - Inserta en `ingredientes` y, si hay stock inicial, en `movimientos_ingredientes` (tipo `inicial`).

- **`InventoryDrawer`** (existe pero no se usa en Admin)  
  - Lista **ingredientes** por slug/nombre.  
  - Para cada uno busca/crea un **producto** con el mismo nombre y trabaja sobre la fila de **`inventario`** (entrada/salida/ajuste).  
  - Escribe en `inventario` y `movimientos_inventario`.

- **`lib/db/ingredientes.ts`**  
  - `cargarStockIngrediente(ingredienteId, cantidad, motivo, usuarioId)`: entrada de stock en **ingredientes** y registro en `movimientos_ingredientes`.  
  - `updateStockIngrediente`: entrada/salida/ajuste sobre **ingredientes**.

El dashboard de admin muestra **inventario** (tabla `inventario`). Las recetas y el consumo del POS usan **ingredientes**. Según cómo esté armado tu negocio (productos “insumo” vinculados a ingredientes, vistas materializadas, etc.), puede que lo que el usuario ve como “materias primas” en el grid sea `inventario` y/o `ingredientes`. La propuesta siguiente cubre ambos casos con una UX clara.

---

## 2. Objetivo de experiencia de usuario

- **Registrar nueva materia prima**: flujo actual (modal de alta) sin cambiar.  
- **Cargar stock de existentes**: flujo **separado** y obvio: “Cargar stock” / “Entrada de stock”, solo para ítems ya creados, con cantidad + motivo (ej. “Compra mayorista”), sin tocar nombre/unidad/precio.

Recomendación: **dos acciones bien diferenciadas** en la UI (botones o pestañas) y, si hace falta, un acceso rápido “Cargar” por ítem en el grid.

---

## 3. Propuesta de implementación

### 3.1 Opción A: Reutilizar `InventoryDrawer` (inventario por producto)

**Idea**  
- El grid del admin sigue mostrando `inventory` (tabla `inventario`).  
- “Cargar stock” abre el **InventoryDrawer** ya existente: el usuario elige materia prima (por nombre), tipo de operación (entrada/salida/ajuste), cantidad y nota.  
- El drawer ya actualiza `inventario` y escribe en `movimientos_inventario`; además crea producto/categoría si no existe (por nombre del ingrediente).

**Ventajas**  
- Reaprovechas lógica y UX (entrada/salida/ajuste, nota, resumen de stock).  
- Una sola fuente de verdad para lo que se muestra en el grid (inventario).  

**Cambios necesarios**  
1. En **AdminView**:  
   - Mantener **IngredienteModal** para “Registrar nueva materia prima”.  
   - Añadir estado para abrir/cerrar **InventoryDrawer** (ej. `showStockDrawer`).  
   - Pasar `tenantId`, `usuarioId` (de `useTenant` o sesión), y `onSaved={() => refetch()}`.  
2. En **AdminHeader** y/o **InventoryGrid**:  
   - **Un botón** “Registrar materia prima” → abre `IngredienteModal`.  
   - **Otro botón** “Cargar stock” → abre `InventoryDrawer`.  
3. Opcional: en cada card del grid, botón “Cargar” que abra el drawer con el ítem preseleccionado (requiere que el drawer acepte un `inventoryId` o `productoId` inicial y, si hace falta, cargar ingrediente por producto).

**Hook**  
- `useAdminDashboard` no necesita cambios; solo asegurar que después de guardar en el drawer se llame `refetch()` (ya cubierto con `onSaved`).

---

### 3.2 Opción B: Flujo solo sobre `ingredientes` (materias primas = ingredientes)

**Idea**  
- Si para tu negocio “materias primas” = solo tabla **ingredientes** (sin pasar por productos/inventario), conviene un flujo que use `cargarStockIngrediente` / `updateStockIngrediente` y no el drawer de inventario.

**Implementación sugerida**  
1. **Nuevo componente**: `CargarStockIngredientesModal` (o drawer).  
   - Lista de ingredientes del tenant (desde `getIngredientes(tenantId)` o desde el hook si exponemos ingredientes).  
   - Selector de ingrediente (búsqueda por nombre).  
   - Solo operación **entrada** (o entrada + salida + ajuste si reutilizas `updateStockIngrediente`).  
   - Campos: cantidad, motivo/nota.  
   - Muestra stock actual del ingrediente (solo lectura).  
   - Al enviar: llamar `cargarStockIngrediente(id, cantidad, motivo, usuarioId)` y luego `refetch()`.  
2. **Servicio**  
   - Usar `cargarStockIngrediente` y `registrarMovimientoIngrediente` de `lib/db/ingredientes.ts` (ya existen).  
3. **AdminView**  
   - “Registrar materia prima” → `IngredienteModal`.  
   - “Cargar stock” → nuevo modal/drawer de ingredientes.  
4. **Dashboard**  
   - Si el grid debe seguir mostrando `inventory`, no cambia. Si en el futuro quieres una vista “solo ingredientes”, podrías añadir en el hook algo como `ingredientes: Ingrediente[]` con `fetchIngredientes(tenantId)` y mostrarla en otra sección o pestaña.

**Ventajas**  
- Alineado 100% con recetas y consumo (ingredientes + movimientos_ingredientes).  
- No depende de producto/inventario.  

**Desventaja**  
- Duplicación de concepto si también usas inventario por producto en el mismo dashboard; habría que dejar claro en la UI cuándo se usa cada uno.

---

### 3.3 Opción C (recomendada): Híbrida

- **Registrar nueva materia prima** → siempre **IngredienteModal** (tabla `ingredientes`).  
- **Cargar stock** en el admin → **InventoryDrawer** abierto desde AdminView (Opción A), para que lo que se ve en el grid (inventario) sea lo que se actualiza.  
- Si además necesitas entradas de stock **solo en ingredientes** (sin tocar inventario), añadir un segundo flujo “Cargar stock (ingredientes)” que use la Opción B (modal con `cargarStockIngrediente`), con un botón o pestaña diferenciada.

En la mayoría de los casos con **un solo modelo de stock** en pantalla, alcanza con **Opción A** (integrar InventoryDrawer) y dejar claro en la UI: “Registrar materia prima” vs “Cargar stock”.

---

## 4. Cambios concretos sugeridos (Opción A + mejora de UX)

### 4.1 `AdminView.tsx`

- Estado: `showIngredienteModal`, `showProductModal`, **`showStockDrawer`**.  
- Handlers:  
  - `onOpenIngredienteModal` → set true para IngredienteModal.  
  - `onOpenStockDrawer` → set true para InventoryDrawer.  
- Renderizar `<InventoryDrawer open={showStockDrawer} onClose={...} tenantId={...} usuarioId={usuario?.id} onSaved={() => { refetch(); setShowStockDrawer(false); }} />`.  
- Pasar a header y grid **dos callbacks**: `onOpenIngredienteModal` y `onOpenStockDrawer`.

### 4.2 `AdminHeader.tsx`

- Reemplazar un solo botón por dos (o mantener “Registrar inventario” y añadir “Cargar stock”):  
  - “Registrar materia prima” → `onOpenIngredienteModal`.  
  - “Cargar stock” → `onOpenStockDrawer`.

### 4.3 `InventoryGrid.tsx`

- “Nuevo movimiento” puede abrir el **InventoryDrawer** (`onOpenStockDrawer`) en lugar del modal de alta.  
- Opcional: en cada card, botón “Cargar” que abre el drawer (y, si el drawer lo soporta, preselecciona ese ítem).

### 4.4 `InventoryAlerts.tsx`

- El botón de alertas puede llevar a “Cargar stock” (drawer) en lugar de al modal de crear.

### 4.5 `useAdminDashboard.ts`

- Sin cambios de interfaz. Solo asegurar que `refetch` se llame después de guardar en el drawer/modal (ya lo hace AdminView vía `onSaved`).

### 4.6 Textos y accesibilidad

- Títulos: “Registrar materia prima” vs “Cargar stock de materias primas” (o “Entrada de stock”).  
- En el drawer: subtítulo tipo “Agregar o ajustar stock de insumos ya registrados”.

---

## 5. Resumen

| Qué | Cómo |
|-----|------|
| **Análisis** | Hoy solo existe flujo para **crear** materia prima; no hay flujo para **cargar stock** de existentes. El dashboard usa `inventory` (tabla `inventario`). Existe `InventoryDrawer` (no usado en admin) y `cargarStockIngrediente` para ingredientes. |
| **Objetivo UX** | Separar “Registrar nueva materia prima” y “Cargar stock de existentes”, con flujo claro para la entrada de cantidades compradas. |
| **Propuesta recomendada** | Integrar **InventoryDrawer** en AdminView para “Cargar stock”, mantener **IngredienteModal** para “Registrar materia prima”, y diferenciar ambos en header y grid. Opcional: segundo flujo con `cargarStockIngrediente` si se trabaja solo con tabla ingredientes. |
| **Hook** | `useAdminDashboard` se mantiene; solo se usa `refetch()` en `onSaved` del drawer/modal. |

Si indicas si en tu negocio las “materias primas” del admin son solo **ingredientes** o también **inventario** (productos), se puede afinar la propuesta a Opción A, B o C y bajar al detalle de props del drawer (por ejemplo preselección de ítem desde el grid).
