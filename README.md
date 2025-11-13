# 🍔 POS Lomitería

Sistema integral de punto de venta para lomitería con gestión de pedidos en tiempo real, pantalla de cocina (KDS) y programa de fidelización.

## 🚀 Stack Tecnológico

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **Supabase** - Base de datos PostgreSQL + Realtime
- **shadcn/ui** - Componentes UI (próximamente)

## 📂 Estructura del Proyecto

```
pos-lomiteria/
├── src/
│   ├── app/
│   │   ├── (pos)/         # Punto de venta
│   │   │   └── pos/
│   │   ├── (kds)/         # Kitchen Display System
│   │   │   └── kds/
│   │   ├── (admin)/       # Panel de administración
│   │   │   └── admin/
│   │   ├── layout.tsx     # Layout principal
│   │   ├── page.tsx       # Página de inicio
│   │   └── globals.css    # Estilos globales
│   ├── components/        # Componentes reutilizables
│   └── lib/
│       └── supabase.ts    # Cliente de Supabase
├── public/               # Archivos estáticos
└── ...archivos de config
```

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase (opcional para empezar)

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Instalar shadcn/ui (próximo paso)

```bash
npx shadcn@latest init
```

## 🏃‍♂️ Ejecutar el Proyecto

### Modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Build para producción

```bash
npm run build
npm start
```

## 📱 Módulos del Sistema

### 🖥️ POS (Punto de Venta)
- Toma de pedidos
- Selección de tipo (Delivery/Local/Takeaway)
- Gestión de clientes y puntos
- Impresión de tickets

**Acceso:** [/pos](http://localhost:3000/pos)

### 🍳 KDS (Kitchen Display System)
- Visualización de pedidos en tiempo real
- Estados de pedidos (Pendiente/Preparando/Listo)
- Alertas visuales por tiempo
- Interfaz optimizada para cocina

**Acceso:** [/kds](http://localhost:3000/kds)

### 📊 Admin (Administración)
- Dashboard de estadísticas
- Gestión de productos y categorías
- Top clientes y puntos
- Configuración de promociones
- Reportes

**Acceso:** [/admin](http://localhost:3000/admin)

## 🗄️ Base de Datos (Supabase)

### Tablas principales (a crear):

- `clientes` - Información de clientes
- `pedidos` - Órdenes realizadas
- `items_pedido` - Detalle de productos por pedido
- `productos` - Catálogo de productos
- `categorias` - Categorías de productos
- `transacciones_puntos` - Historial de puntos
- `promociones` - Configuración de promociones

## 🎨 Próximos Pasos

1. ✅ Setup inicial del proyecto
2. ⏳ Instalar y configurar shadcn/ui
3. ⏳ Configurar Supabase y crear esquema de base de datos
4. ⏳ Implementar autenticación
5. ⏳ Desarrollar funcionalidad del POS
6. ⏳ Implementar sincronización realtime para KDS
7. ⏳ Sistema de puntos y fidelización
8. ⏳ Integración con impresora térmica

## 📝 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint

# Instalar componente shadcn/ui
npx shadcn@latest add [componente]
```

## 🤝 Contribuir

Este es un proyecto privado para la lomitería.

## 📄 Licencia

Privado - Todos los derechos reservados

