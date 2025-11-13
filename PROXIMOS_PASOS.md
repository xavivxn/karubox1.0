# 🎯 Próximos Pasos - POS Lomitería

## ✅ Completado

1. ✅ Proyecto Next.js 14 configurado con TypeScript
2. ✅ Tailwind CSS instalado y configurado
3. ✅ Estructura de carpetas creada:
   - `app/(pos)/pos` - Punto de venta
   - `app/(kds)/kds` - Pantalla de cocina
   - `app/(admin)/admin` - Panel administración
4. ✅ Supabase cliente configurado (`lib/supabase.ts`)
5. ✅ Dependencias instaladas:
   - @supabase/supabase-js
   - zustand (state management)
   - @tanstack/react-query (data fetching)
   - Utilidades para shadcn/ui

## 🔄 El servidor está corriendo

El proyecto está ejecutándose en: **http://localhost:3000**

### Rutas disponibles:
- **/** - Página de inicio con navegación
- **/pos** - Sistema de punto de venta
- **/kds** - Pantalla de cocina
- **/admin** - Panel de administración

---

## 🚀 Próximo Paso: Instalar Componentes shadcn/ui

Para instalar componentes individuales de shadcn/ui, usa estos comandos:

### Componentes recomendados para empezar:

```bash
# Botones
npx shadcn@latest add button

# Cards
npx shadcn@latest add card

# Inputs
npx shadcn@latest add input

# Selects
npx shadcn@latest add select

# Dialog/Modal
npx shadcn@latest add dialog

# Table
npx shadcn@latest add table

# Badge
npx shadcn@latest add badge

# Tabs
npx shadcn@latest add tabs

# Todos a la vez
npx shadcn@latest add button card input select dialog table badge tabs
```

---

## 📝 Siguiente: Configurar Supabase

### Paso 1: Crear proyecto en Supabase

1. Ve a https://supabase.com
2. Crea una cuenta / inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales

### Paso 2: Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 3: Crear esquema de base de datos

En el editor SQL de Supabase, ejecuta:

```sql
-- Tabla de categorías
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria_id UUID REFERENCES categorias(id),
  disponible BOOLEAN DEFAULT true,
  imagen_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  puntos_totales INTEGER DEFAULT 0,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN DEFAULT true
);

-- Tabla de pedidos
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido SERIAL,
  cliente_id UUID REFERENCES clientes(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('delivery', 'local', 'takeaway')),
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'listo', 'entregado', 'cancelado')),
  total DECIMAL(10,2) NOT NULL,
  puntos_generados INTEGER DEFAULT 0,
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items de pedido
CREATE TABLE items_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  personalizaciones JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones de puntos
CREATE TABLE transacciones_puntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  pedido_id UUID REFERENCES pedidos(id),
  tipo VARCHAR(20) CHECK (tipo IN ('ganado', 'canjeado', 'ajuste')),
  puntos INTEGER NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de promociones
CREATE TABLE promociones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  multiplicador DECIMAL(5,2) DEFAULT 1.0,
  dias_semana INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  fecha_inicio DATE,
  fecha_fin DATE,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejor performance
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_creacion);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_puntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo por ahora, ajustar según necesidad)
CREATE POLICY "Permitir lectura pública" ON categorias FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública" ON productos FOR SELECT USING (true);
CREATE POLICY "Permitir todo" ON pedidos FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON items_pedido FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo" ON transacciones_puntos FOR ALL USING (true);
CREATE POLICY "Permitir lectura pública" ON promociones FOR SELECT USING (true);
```

---

## 🎨 Siguiente: Desarrollar el POS

### Funcionalidades a implementar:

1. **Catálogo de productos**
   - Listar productos por categoría
   - Agregar al carrito
   - Mostrar precios

2. **Carrito de compras**
   - Agregar/quitar productos
   - Modificar cantidades
   - Calcular total

3. **Selección de tipo de pedido**
   - Delivery 🏠
   - Local 🍽️
   - Takeaway 📦

4. **Gestión de clientes**
   - Buscar por teléfono
   - Crear nuevo cliente
   - Mostrar puntos disponibles

5. **Confirmar pedido**
   - Guardar en Supabase
   - Calcular y sumar puntos
   - Enviar a cocina (realtime)
   - Imprimir ticket (opcional)

---

## 📊 Siguiente: Implementar KDS (Cocina)

### Funcionalidades:

1. **Suscripción realtime a pedidos**
```typescript
// Ejemplo de código para KDS
supabase
  .channel('pedidos')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'pedidos' },
    payload => {
      // Agregar pedido a la lista
    }
  )
  .subscribe()
```

2. **Visualización de pedidos**
   - Cards con colores según urgencia
   - Información clara y visible
   - Botones de acción grandes

3. **Estados de pedidos**
   - Marcar como "Preparando"
   - Marcar como "Listo"
   - Notificaciones

---

## 🎁 Siguiente: Sistema de Puntos

### Lógica de negocio:

```typescript
// Calcular puntos
const calcularPuntos = (total: number, dia: number, promociones: any[]) => {
  let puntos = Math.floor(total / 100); // 1 punto por cada $100
  
  // Aplicar multiplicador de promoción
  const promoActiva = promociones.find(p => 
    p.activa && 
    p.dias_semana.includes(dia) &&
    new Date() >= p.fecha_inicio &&
    new Date() <= p.fecha_fin
  );
  
  if (promoActiva) {
    puntos = Math.floor(puntos * promoActiva.multiplicador);
  }
  
  return puntos;
}
```

---

## 📦 Siguiente: Integración con Impresora

Para impresoras térmicas (ESC/POS):

```bash
npm install escpos escpos-usb
```

```typescript
import escpos from 'escpos';
import USB from 'escpos-usb';

const device = new USB();
const printer = new escpos.Printer(device);

device.open(() => {
  printer
    .font('a')
    .align('ct')
    .text('LOMITERÍA')
    .text('------------------------')
    .text('Pedido #1234')
    .text('Delivery')
    .text('------------------------')
    .text('2x Lomito Completo')
    .text('1x Coca Cola 500ml')
    .text('------------------------')
    .text('Total: $9.500')
    .cut()
    .close();
});
```

---

## 🔐 Autenticación (Opcional)

Si quieres proteger el sistema con login:

```bash
npx shadcn@latest add form
```

```typescript
// Login básico con Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@lomiteria.com',
  password: 'contraseña'
});
```

---

## 📚 Recursos Útiles

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Tailwind CSS:** https://tailwindcss.com/docs
- **React Query:** https://tanstack.com/query/latest

---

## 💡 Tips de Desarrollo

1. **Usa TypeScript**: Define interfaces para tus tipos
2. **Componentes pequeños**: Divide la UI en componentes reutilizables
3. **Server Components por defecto**: Usa 'use client' solo cuando necesites interactividad
4. **Optimistic Updates**: Mejora la UX actualizando la UI antes de recibir confirmación del servidor
5. **Error Handling**: Maneja errores de forma elegante
6. **Loading States**: Muestra spinners o skeletons mientras cargan datos

---

¿Dudas? Consultá el README.md o la documentación oficial de cada tecnología. 🚀

