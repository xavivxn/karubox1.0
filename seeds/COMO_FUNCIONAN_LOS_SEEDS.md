# 🌱 ¿Cómo Funcionan los Seeds?

## 📋 Concepto Simple

Imagina que tienes **3 lomiterías** como clientes:
- 🍔 Atlas Burger
- 🍔 Lomitería La Esquina  
- 🍔 Burger House

Cada una necesita sus propios productos y categorías en la base de datos. Los **seeds** son scripts SQL que cargan estos datos.

## 📁 Estructura Organizada

```
pos-lomiteria/
└── seeds/                          ← Carpeta de seeds
    ├── README.md                   ← Documentación principal
    ├── template-seed.sql           ← Plantilla para copiar
    ├── atlas-burger.sql            ← Seed de Atlas Burger
    ├── lomiteria-la-esquina.sql    ← Seed de La Esquina
    └── burger-house.sql            ← Seed de Burger House
```

## 🎯 Escenario Real: 3 Clientes

### Situación:
Tienes 3 lomiterías que quieren usar tu sistema. Cada una tiene su propio menú.

### Solución:
**Crear 3 seeds independientes**, uno por cada cliente.

### Estructura de Archivos:

```
seeds/
├── atlas-burger.sql              ← Cliente 1
├── lomiteria-la-esquina.sql      ← Cliente 2
└── burger-house.sql              ← Cliente 3
```

## 🚀 Cómo Cargar los Datos

### Opción 1: Ejecutar seeds individualmente (Recomendado)

**Para cada cliente:**

1. Abre Supabase → SQL Editor
2. Copia el contenido de `seeds/atlas-burger.sql`
3. Pega en el SQL Editor
4. Ejecuta (Ctrl + Enter)
5. ✅ Atlas Burger cargado

**Repite para cada cliente:**
- `seeds/lomiteria-la-esquina.sql` → Ejecutar → ✅ La Esquina cargada
- `seeds/burger-house.sql` → Ejecutar → ✅ Burger House cargado

**Ventajas:**
- ✅ Si uno falla, los otros no se afectan
- ✅ Puedes ejecutar solo el que necesitas
- ✅ Más fácil de depurar

### Opción 2: Ejecutar todos a la vez (No recomendado para producción)

1. Abre Supabase → SQL Editor
2. Copia el contenido de `atlas-burger.sql`
3. Pega
4. Copia el contenido de `lomiteria-la-esquina.sql`
5. Pega (después del anterior)
6. Copia el contenido de `burger-house.sql`
7. Pega (después del anterior)
8. Ejecuta todo junto (Ctrl + Enter)

**⚠️ Desventajas:**
- ❌ Si uno falla, puede afectar a los siguientes
- ❌ Más difícil de depurar

## 📝 Crear un Nuevo Seed

### Cuando llegue un 4to cliente:

1. **Copia el template:**
   ```
   Copiar: seeds/template-seed.sql
   Renombrar: seeds/mi-nuevo-cliente.sql
   ```

2. **Edita el archivo** y reemplaza:
   - `[NOMBRE_LOMITERIA]` → "Mi Nueva Lomitería"
   - `[SLUG_LOMITERIA]` → "mi-nueva-lomiteria"
   - Agregar categorías y productos

3. **Ejecuta en Supabase:**
   - Copia todo el contenido
   - Pega en SQL Editor
   - Ejecuta

4. ✅ ¡Nuevo cliente cargado!

## 🔄 Flujo de Trabajo Típico

```
1. Cliente nuevo quiere usar tu sistema
   ↓
2. Obtienes su menú (foto, Excel, etc.)
   ↓
3. Creas seed: seeds/cliente-nombre.sql
   ↓
4. Ejecutas el seed en Supabase
   ↓
5. Creas usuario en Supabase Auth
   ↓
6. Vinculas usuario al tenant del seed
   ↓
7. ✅ Cliente puede iniciar sesión y usar el sistema
```

## 📊 Ejemplo Visual

### Base de datos después de ejecutar 3 seeds:

```
TABLA: tenants
┌─────────────┬──────────────────────┬─────────────┐
│ id          │ nombre               │ slug        │
├─────────────┼──────────────────────┼─────────────┤
│ uuid-1      │ Atlas Burger         │ atlas-burger│
│ uuid-2      │ Lomitería La Esquina │ la-esquina  │
│ uuid-3      │ Burger House         │ burger-house│
└─────────────┴──────────────────────┴─────────────┘

TABLA: productos (filtrados por tenant)
┌─────────────┬───────────────┬───────────────────┬────────┐
│ tenant_id   │ categoria     │ producto          │ precio │
├─────────────┼───────────────┼───────────────────┼────────┤
│ uuid-1      │ Burger Atlas  │ Cheese Kids       │ 17000  │
│ uuid-1      │ Burger Atlas  │ Clásica           │ 20000  │
│ uuid-2      │ Lomitos       │ Lomito Completo   │ 35000  │
│ uuid-3      │ Hamburguesas  │ Classic Burger    │ 25000  │
└─────────────┴───────────────┴───────────────────┴────────┘
```

## ✅ Ventajas de Esta Estructura

1. **Organización:** Un archivo por cliente, fácil de encontrar
2. **Independencia:** Cada seed es autónomo
3. **Mantenimiento:** Puedes actualizar un cliente sin afectar a otros
4. **Escalabilidad:** Agregar más clientes es simple (copiar template)
5. **Versionado:** Puedes guardar seeds en Git para control de versiones

## ❓ Preguntas Frecuentes

### ¿Puedo ejecutar un seed varias veces?

**Sí**, pero ten cuidado:
- Si el seed usa `DELETE` primero (como Atlas Burger), se borran los datos antiguos
- Si no usa `DELETE`, puede crear duplicados

### ¿Dónde se guardan los seeds?

En la carpeta `seeds/` del proyecto. Puedes guardarlos en Git también.

### ¿Puedo modificar un seed después de ejecutarlo?

**Sí**, pero:
- Modifica el archivo `.sql`
- Vuelve a ejecutarlo
- O crea un script de actualización separado

### ¿Los seeds crean usuarios?

**No**. Los seeds solo cargan:
- ✅ Tenant (lomitería)
- ✅ Categorías
- ✅ Productos

Los usuarios se crean por separado en Supabase Auth.

---

## 📞 Resumen

**Para 3 clientes, tendrás:**
- 3 archivos seeds independientes
- Cada uno en la carpeta `seeds/`
- Ejecutas cada uno por separado en Supabase
- Cada uno carga su propio tenant con sus productos

**Es así de simple.** 🎉

