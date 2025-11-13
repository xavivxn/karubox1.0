# ✅ Supabase - Configuración Completa

## 🎉 ¡Todo configurado y listo para usar!

---

## 📦 Lo que se ha creado

### 1. Esquema de Base de Datos (`database.sql`)

✅ **7 Tablas principales:**
- `categorias` - Categorías de productos
- `productos` - Catálogo completo de productos
- `clientes` - Base de datos de clientes
- `pedidos` - Órdenes y pedidos
- `items_pedido` - Detalle de productos por pedido
- `transacciones_puntos` - Historial de puntos
- `promociones` - Configuración de promociones

✅ **Características:**
- Relaciones y foreign keys configuradas
- Índices para optimización de queries
- Triggers para actualización automática de timestamps
- Row Level Security (RLS) habilitado
- Políticas de acceso configuradas

✅ **3 Vistas (Views):**
- `vista_productos_completos` - Productos con info de categoría
- `vista_pedidos_completos` - Pedidos con info de cliente
- `vista_top_clientes` - Ranking de mejores clientes

✅ **Funciones:**
- `calcular_puntos(monto, dia_semana)` - Calcula puntos según promociones
- `update_updated_at_column()` - Actualiza timestamps automáticamente

✅ **Datos de ejemplo:**
- 5 categorías
- 20 productos típicos de lomitería
- 4 clientes de prueba
- 3 promociones de ejemplo

### 2. Tipos TypeScript (`src/types/supabase.ts`)

✅ **Tipos completos para todas las tablas:**
- `Categoria`, `Producto`, `Cliente`, `Pedido`, etc.
- Tipos para Insert y Update
- Tipos para las Vistas
- Tipos para funciones de base de datos

✅ **Type-safety completo:**
- Autocomplete en VS Code
- Errores en tiempo de compilación
- Mejor experiencia de desarrollo

### 3. Cliente Supabase Configurado (`src/lib/supabase.ts`)

✅ **Cliente optimizado:**
- Configuración de autenticación persistente
- Configuración de Realtime
- Helper para test de conexión
- Warnings si faltan credenciales

### 4. Funciones Helper por Módulo

#### 📦 Productos (`src/lib/db/productos.ts`)
```typescript
// Obtener todos los productos
getProductos()

// Obtener productos con info de categoría
getProductosCompletos()

// Filtrar por categoría
getProductosPorCategoria(categoriaId)

// Buscar productos
buscarProductos(termino)

// CRUD completo
crearProducto(producto)
actualizarProducto(id, cambios)
toggleDisponibilidadProducto(id, disponible)
```

#### 🏷️ Categorías (`src/lib/db/categorias.ts`)
```typescript
// Obtener categorías activas
getCategorias()

// Con conteo de productos
getCategoriasConProductos()

// CRUD completo
crearCategoria(nombre, descripcion, orden)
actualizarCategoria(id, cambios)
reordenarCategorias(categorias)
```

#### 👥 Clientes (`src/lib/db/clientes.ts`)
```typescript
// Buscar por teléfono
buscarClientePorTelefono(telefono)

// Buscar por nombre o teléfono
buscarClientes(termino)

// Gestión de puntos
sumarPuntos(clienteId, puntos)
restarPuntos(clienteId, puntos)

// Top clientes
getTopClientes(limite)

// Historial
getHistorialCliente(clienteId)

// CRUD completo
crearCliente(cliente)
```

#### 🍔 Pedidos (`src/lib/db/pedidos.ts`)
```typescript
// Crear pedido completo con items
crearPedido(datosPedido, items)

// Para KDS
getPedidosActivos()
getPedidosPorEstado(estado)

// Actualizar estado
actualizarEstadoPedido(pedidoId, nuevoEstado)

// Estadísticas
getPedidosDelDia()
getEstadisticasDelDia()

// Realtime (para cocina)
suscribirseAPedidos(callback)
desuscribirseDePedidos(channel)
```

#### ⭐ Puntos (`src/lib/db/puntos.ts`)
```typescript
// Calcular puntos según promociones
calcularPuntos(monto, diaSemana)

// Registrar movimientos
registrarPuntosGanados(clienteId, puntos, pedidoId)
registrarCanjePuntos(clienteId, puntos, pedidoId)

// Ajuste manual (admin)
ajustarPuntos(clienteId, ajuste, descripcion)

// Historial
getHistorialPuntos(clienteId)
getResumenPuntos(clienteId)

// Validaciones
verificarPuntosDisponibles(clienteId, puntos)
```

#### 🎁 Promociones (`src/lib/db/promociones.ts`)
```typescript
// Obtener promociones
getPromocionesActivas()
getPromocionDelDia()

// CRUD completo
crearPromocion(promocion)
actualizarPromocion(id, cambios)
togglePromocion(id, activa)
```

#### 📦 Index (`src/lib/db/index.ts`)
```typescript
// Importar todo desde un solo lugar
import { 
  getProductos, 
  getCategorias,
  crearPedido,
  calcularPuntos 
} from '@/lib/db'
```

---

## 🚀 Cómo Usar

### Paso 1: Ejecutar el SQL en Supabase

1. Ve a **https://supabase.com** y crea/abre tu proyecto
2. Ve a **SQL Editor** en el menú lateral
3. Click en **"New query"**
4. Copia TODO el contenido de `database.sql`
5. Click en **"Run"** (o Ctrl+Enter)
6. Verifica que aparezca: ✅ "Success"

### Paso 2: Habilitar Realtime

1. Ve a **Database** → **Replication** en Supabase
2. Busca la tabla `pedidos`
3. Activa el switch de Realtime
4. Repite para `items_pedido`

### Paso 3: Obtener Credenciales

1. Ve a **Settings** → **API**
2. Copia:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOi...`

### Paso 4: Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_key_aqui
```

Ver: `ENV_CONFIG.md` para instrucciones detalladas.

### Paso 5: Reiniciar el servidor

```bash
# Detener el servidor (Ctrl+C)
# Volver a iniciar
npm run dev
```

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Listar productos en el POS

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getProductosCompletos } from '@/lib/db'
import type { ProductoCompleto } from '@/types/supabase'

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoCompleto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarProductos() {
      try {
        const data = await getProductosCompletos()
        setProductos(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    cargarProductos()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      {productos.map(producto => (
        <div key={producto.id}>
          <h3>{producto.nombre}</h3>
          <p>{producto.categoria_nombre}</p>
          <p>${producto.precio}</p>
        </div>
      ))}
    </div>
  )
}
```

### Ejemplo 2: Crear un pedido

```typescript
import { crearPedido, calcularPuntos, registrarPuntosGanados } from '@/lib/db'

async function confirmarPedido() {
  // Datos del pedido
  const pedidoData = {
    cliente_id: 'uuid-del-cliente',
    tipo: 'delivery',
    total: 5200.00,
    puntos_generados: 52
  }

  // Items del pedido
  const items = [
    {
      producto_id: 'uuid-producto-1',
      producto_nombre: 'Lomito Completo',
      cantidad: 1,
      precio_unitario: 4500,
      subtotal: 4500
    },
    {
      producto_id: 'uuid-producto-2',
      producto_nombre: 'Coca Cola 500ml',
      cantidad: 1,
      precio_unitario: 1200,
      subtotal: 1200
    }
  ]

  // Crear pedido
  const pedido = await crearPedido(pedidoData, items)

  // Registrar puntos
  const puntos = await calcularPuntos(pedido.total)
  await registrarPuntosGanados(
    pedido.cliente_id!,
    puntos,
    pedido.id,
    `Puntos por pedido #${pedido.numero_pedido}`
  )

  return pedido
}
```

### Ejemplo 3: KDS con Realtime

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getPedidosActivos, suscribirseAPedidos } from '@/lib/db'
import type { PedidoCompleto } from '@/types/supabase'

export default function KitchenDisplay() {
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([])

  useEffect(() => {
    // Cargar pedidos iniciales
    async function cargarPedidos() {
      const data = await getPedidosActivos()
      setPedidos(data)
    }
    cargarPedidos()

    // Suscribirse a cambios en tiempo real
    const channel = suscribirseAPedidos((payload) => {
      console.log('Nuevo cambio:', payload)
      // Recargar pedidos cuando hay cambios
      cargarPedidos()
    })

    // Cleanup al desmontar
    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <div>
      <h1>Pedidos Activos</h1>
      {pedidos.map(pedido => (
        <div key={pedido.id}>
          <h2>Pedido #{pedido.numero_pedido}</h2>
          <p>Cliente: {pedido.cliente_nombre}</p>
          <p>Tipo: {pedido.tipo}</p>
          <p>Estado: {pedido.estado}</p>
        </div>
      ))}
    </div>
  )
}
```

### Ejemplo 4: Buscar cliente por teléfono

```typescript
import { buscarClientePorTelefono, crearCliente } from '@/lib/db'

async function buscarOCrearCliente(telefono: string, nombre: string) {
  // Buscar si existe
  let cliente = await buscarClientePorTelefono(telefono)
  
  // Si no existe, crear uno nuevo
  if (!cliente) {
    cliente = await crearCliente({
      telefono,
      nombre,
      puntos_totales: 0
    })
  }
  
  return cliente
}
```

---

## 📊 Verificar que todo funciona

### Desde el navegador (F12 → Console):

```javascript
// Test de conexión
const { testConnection } = await import('@/lib/supabase')
await testConnection()

// Listar productos
const { getProductos } = await import('@/lib/db')
const productos = await getProductos()
console.log(productos)

// Listar clientes
const { buscarClientes } = await import('@/lib/db')
const clientes = await buscarClientes('')
console.log(clientes)
```

---

## 🎯 Próximos Pasos

Con Supabase configurado, ahora podés:

1. ✅ **Desarrollar el POS:** Usar `getProductos()` y `crearPedido()`
2. ✅ **Implementar KDS:** Usar `getPedidosActivos()` y Realtime
3. ✅ **Sistema de puntos:** Usar `calcularPuntos()` y `registrarPuntosGanados()`
4. ✅ **Admin dashboard:** Usar `getEstadisticasDelDia()` y `getTopClientes()`

---

## 📚 Archivos Creados

```
pos-lomiteria/
├── database.sql                     # SQL completo
├── GUIA_SUPABASE.md                # Guía paso a paso
├── ENV_CONFIG.md                   # Configuración de .env.local
├── SUPABASE_COMPLETO.md            # Este archivo
├── src/
│   ├── types/
│   │   └── supabase.ts             # Tipos TypeScript
│   └── lib/
│       ├── supabase.ts             # Cliente Supabase
│       └── db/
│           ├── index.ts            # Exporta todo
│           ├── productos.ts        # Funciones de productos
│           ├── categorias.ts       # Funciones de categorías
│           ├── clientes.ts         # Funciones de clientes
│           ├── pedidos.ts          # Funciones de pedidos
│           ├── puntos.ts           # Funciones de puntos
│           └── promociones.ts      # Funciones de promociones
```

---

## ⚠️ Troubleshooting

### "Invalid API key"
- Verifica que uses la key `anon/public`, no la `service_role`
- Reinicia el servidor

### "relation does not exist"
- Ejecuta el SQL completo en Supabase
- Verifica que estés en el proyecto correcto

### "No rows returned"
- Normal si no hay datos aún
- Ejecuta la sección de INSERT del SQL

### Realtime no funciona
- Ve a Database → Replication
- Activa Realtime para las tablas `pedidos` e `items_pedido`

---

**¡Todo listo para empezar a desarrollar! 🚀**

La base de datos está configurada, los tipos están listos y las funciones helper están esperando ser usadas.

