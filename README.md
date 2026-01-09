# 🍔 Sistema POS Multi-Tenant para Lomiterías

Sistema completo de Punto de Venta (POS) diseñado específicamente para lomiterías, con arquitectura multi-tenant que permite gestionar múltiples locales desde una sola plataforma.

## ✨ Características Principales

### 🎯 **Multi-Tenant**
- Cada lomitería tiene su propio espacio aislado
- Usuarios, productos, clientes e inventario separados por tenant
- Escalable a cientos de lomiterías

### 💳 **Sistema de Puntos Automático**
- 1 punto por cada 100 Guaraníes de compra
- Acreditación automática al entregar pedido
- Historial completo de transacciones
- Canje de puntos por productos

### 📦 **Gestión de Inventario**
- Control por ingredientes (no por producto final)
- Descuento automático al confirmar pedidos
- Alertas de stock bajo
- Historial de movimientos completo

### 🍕 **Ingredientes y Recetas**
- Catálogo de ingredientes con unidades y precios
- Recetas por producto (qué ingredientes lleva cada uno)
- Personalización de pedidos (agregar/quitar ingredientes)
- Cálculo automático de costos extras

### 📊 **Dashboard Administrativo**
- KPIs en tiempo real (ventas, clientes, productos top)
- Alertas de inventario
- Gestión de ingredientes y stock
- Reportes y estadísticas

### 🎨 **Interfaz Moderna**
- Diseño profesional con tema de lomitería
- Modo oscuro persistente
- Responsive (funciona en móviles, tablets y desktop)
- Optimizado para uso intensivo

---

## 🚀 **Inicio Rápido**

### **1. Clonar el Repositorio**

```bash
git clone <tu-repo>
cd pos-lomiteria
```

### **2. Instalar Dependencias**

```bash
npm install
```

### **3. Configurar Supabase**

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar scripts de base de datos:
   - `database/00_initial_schema.sql`
   - `seeds/atlas-burger.sql`
3. Copiar credenciales de Supabase

### **4. Configurar Variables de Entorno**

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
```

### **5. Levantar el Servidor**

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### **6. Login**

Usuario de prueba (creado por `atlas-burger.sql`):
- **Email:** `admin@atlasb.com`
- **Password:** (configurado en Supabase Auth)

---

## 🌐 **Deployment Automático**

Para configurar auto-deploy con Vercel (cada `git push` despliega automáticamente):

📖 **Ver guía completa:** [`DEPLOY.md`](./DEPLOY.md)

**Resumen rápido:**
1. Subir código a GitHub
2. Conectar con [Vercel](https://vercel.com)
3. Configurar variables de entorno en Vercel Dashboard
4. ¡Listo! Cada `git push` despliega automáticamente

---

## 📁 **Estructura del Proyecto**

```
pos-lomiteria/
├── src/
│   ├── app/
│   │   ├── (pos)/pos/          # Pantalla de toma de pedidos
│   │   ├── (admin)/admin/      # Dashboard administrativo
│   │   ├── login/              # Pantalla de login
│   │   └── page.tsx            # Menú principal
│   ├── components/
│   │   ├── pos/                # Componentes del POS
│   │   └── admin/              # Componentes del admin
│   ├── contexts/
│   │   └── TenantContext.tsx   # Estado global (usuario, tenant, dark mode)
│   ├── lib/
│   │   ├── supabase.ts         # Cliente de Supabase
│   │   ├── api/                # Funciones de API
│   │   └── inventory/          # Lógica de inventario
│   ├── store/
│   │   └── cartStore.ts        # Estado del carrito (Zustand)
│   └── types/
│       └── ingredients.ts      # Tipos TypeScript
├── database/
│   ├── 00_initial_schema.sql   # Schema base
│   ├── 01_migration_*.sql      # Migraciones futuras
│   └── README.md               # Guía de base de datos
├── seeds/
│   └── atlas-burger.sql        # Datos de prueba
└── middleware.ts               # Protección de rutas
```

---

## 🗄️ **Base de Datos**

Ver documentación completa en [`database/README.md`](./database/README.md)

### **Tablas Principales:**
- `tenants` - Lomiterías registradas
- `usuarios` - Usuarios por tenant (admin, cajero, cocinero, repartidor)
- `productos` - Productos del menú
- `clientes` - Clientes con sistema de puntos
- `pedidos` - Pedidos (local, delivery, para llevar)
- `ingredientes` - Catálogo de ingredientes
- `recetas_producto` - Qué ingredientes lleva cada producto
- `inventario` - Stock actual por ingrediente
- `movimientos_inventario` - Historial de movimientos
- `transacciones_puntos` - Historial de puntos

---

## 🛠️ **Tecnologías Utilizadas**

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **Estilos:** Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Estado:** Zustand (carrito), Context API (tenant, dark mode)
- **Iconos:** Lucide React

---

## 📱 **Roles de Usuario**

### **Admin (Dueño)**
- Acceso completo al dashboard
- Gestión de inventario y ingredientes
- Reportes y estadísticas
- Configuración del tenant

### **Cajero**
- Acceso al POS
- Toma de pedidos
- Gestión de clientes y puntos

### **Cocinero** (Futuro)
- Acceso al KDS (Kitchen Display System)
- Ver pedidos pendientes

### **Repartidor** (Futuro)
- Ver pedidos para delivery
- Actualizar estado de entregas

---

## 🔐 **Seguridad**

- **Autenticación:** Supabase Auth
- **Autorización:** Middleware de Next.js + RLS (Row Level Security)
- **Multi-Tenant:** Todos los datos filtrados por `tenant_id`
- **Variables de Entorno:** Credenciales nunca en el código

---

## 🎨 **Personalización**

### **Cambiar Tema de Colores**

Editar `tailwind.config.ts`:

```typescript
colors: {
  primary: '#FF6B35',  // Naranja lomitería
  // ... más colores
}
```

### **Agregar Nueva Lomitería**

```sql
-- 1. Crear tenant
INSERT INTO tenants (nombre, slug, telefono, email)
VALUES ('Mi Lomitería', 'mi-lomiteria', '+595123456789', 'contacto@mi.com');

-- 2. Crear usuario admin
INSERT INTO usuarios (tenant_id, email, nombre, rol)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'mi-lomiteria'),
  'admin@mi.com',
  'Admin',
  'admin'
);
```

---

## 🐛 **Troubleshooting**

### **Error: "supabaseUrl is required"**
✅ Verificar que `.env.local` existe y tiene las variables correctas

### **Error: "Port 3000 is in use"**
✅ Matar procesos de Node.js:
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
killall node
```

### **No redirige al login**
✅ Verificar que el middleware esté funcionando y que las variables de entorno estén configuradas

### **Dark mode no persiste**
✅ Verificar que `localStorage` esté habilitado en el navegador

---

## 📈 **Roadmap**

- [x] Sistema POS completo
- [x] Dashboard administrativo
- [x] Sistema de puntos automático
- [x] Inventario por ingredientes
- [x] Personalización de pedidos
- [ ] KDS (Kitchen Display System)
- [ ] Impresión de tickets
- [ ] App móvil (React Native)
- [ ] Reportes avanzados
- [ ] Integración con delivery apps

---

## 📄 **Licencia**

Proyecto privado - Todos los derechos reservados

---

## 👥 **Equipo**

Desarrollado para **Atlas Burger** y preparado para escalar a todas las lomiterías del país 🇵🇾

---

## 📞 **Soporte**

¿Dudas o problemas? Revisá:
1. [`database/README.md`](./database/README.md) - Guía de base de datos
2. Comentarios en el código - Están super documentados
3. Logs de la consola del navegador

---

**¡Buen provecho! 🍔🍟**

---
*Última actualización: Diciembre 2024*