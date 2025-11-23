# 🍔 POS Lomitería - Multi-Tenant System

Sistema de punto de venta multi-tenant para múltiples lomiterías. Cada lomitería tiene sus propios datos, usuarios y configuración completamente aislados.

---

## 🚀 Quick Start

### 1. Configurar Supabase

```bash
# 1. Ejecutar el schema SQL
# Copiar TODO el contenido de database-multitenant.sql
# Ir a Supabase → SQL Editor → Pegar → Run
```

### 2. Crear primer usuario

```bash
# Supabase → Authentication → Add User
Email: admin@lomiteria-don-juan.com
Password: Admin123!

# Luego vincular con tenant (SQL Editor):
INSERT INTO usuarios (tenant_id, auth_user_id, email, nombre, rol)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'lomiteria-don-juan'),
  'UUID-DEL-USUARIO-DE-AUTH',
  'admin@lomiteria-don-juan.com',
  'Admin Don Juan',
  'admin'
);
```

### 3. Configurar Auth

```bash
# Supabase → Authentication → Settings
- Enable Email Auth
- Confirm email: OFF (desarrollo)
- Site URL: http://localhost:3000
```

### 4. Iniciar

```bash
npm install
npm run dev
```

Abrir http://localhost:3000 e iniciar sesión.

---

## 📁 Documentación

- **[RESUMEN_MULTITENANT.md](./RESUMEN_MULTITENANT.md)** - Resumen ejecutivo
- **[IMPLEMENTACION_COMPLETA.md](./IMPLEMENTACION_COMPLETA.md)** - Guía completa
- **[MIGRACION_MULTITENANT.md](./MIGRACION_MULTITENANT.md)** - Pasos detallados

---

## 🎯 Características

### Multi-Tenant
- ✅ Múltiples lomiterías en una sola instalación
- ✅ Datos completamente separados por tenant
- ✅ Row Level Security (RLS) automático
- ✅ Personalización por lomitería

### Roles y Permisos
- **Admin**: Acceso completo
- **Cajero**: Solo POS
- **Cocinero**: Solo KDS
- **Repartidor**: Solo delivery

### POS (Punto de Venta)
- Gestión de pedidos (local, delivery, para llevar)
- Catálogo de productos por categorías
- Sistema de puntos de fidelidad
- Búsqueda y creación de clientes

### Seguridad
- Autenticación con Supabase Auth
- RLS en todas las tablas
- Middleware de protección de rutas
- Separación automática por tenant

---

## 🏗️ Stack Tecnológico

- **Frontend**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Estado**: Zustand
- **Iconos**: Lucide React

---

## 📦 Estructura del Proyecto

```
pos-lomiteria/
├── database-multitenant.sql          # Schema SQL completo
├── src/
│   ├── app/
│   │   ├── login/                    # Pantalla de login
│   │   ├── (pos)/pos/                # Punto de venta
│   │   ├── (kds)/kds/                # Kitchen Display System
│   │   └── (admin)/admin/            # Panel de administración
│   ├── components/
│   │   └── pos/                      # Componentes del POS
│   ├── contexts/
│   │   └── TenantContext.tsx         # Context global tenant/usuario
│   ├── lib/
│   │   └── supabase.ts               # Cliente Supabase
│   └── store/
│       └── cartStore.ts              # Estado del carrito (Zustand)
├── middleware.ts                     # Protección de rutas
└── package.json
```

---

## 🔐 Seguridad con RLS

Todas las tablas tienen Row Level Security:

```sql
-- Usuario de Lomitería A consulta productos
SELECT * FROM productos;

-- RLS automáticamente filtra:
-- WHERE tenant_id = 'id-lomiteria-a'
```

**Resultado:** Cada lomitería ve SOLO sus datos.

---

## 🎨 Personalización por Tenant

Cada lomitería puede configurar:
- Nombre y datos de contacto
- Logo (próximamente)
- Configuración de impresión de tickets
- Productos y categorías propias
- Clientes propios

---

## 🖨️ Impresión de Tickets

El sistema está preparado para imprimir tickets térmicos con un Print Server local. Ver `GUIA_IMPRESION_TICKETS.md` para más detalles.

---

## 📊 Datos de Ejemplo

El sistema incluye 2 lomiterías de ejemplo:
- **Lomitería Don Juan**: 5 categorías, 8 productos, 3 clientes
- **El Lomito de la Esquina**: 3 categorías, 3 productos

---

## 🚀 Agregar Nueva Lomitería

Ver [IMPLEMENTACION_COMPLETA.md](./IMPLEMENTACION_COMPLETA.md) sección "Agregar otra lomitería" para instrucciones SQL.

---

## 🧪 Testing

```bash
# Iniciar sesión con usuario de prueba
Email: admin@lomiteria-don-juan.com
Password: Admin123!

# Verificar que:
✅ Solo ves productos de tu lomitería
✅ Solo ves clientes de tu lomitería
✅ Puedes crear pedidos
✅ Los pedidos registran tu usuario_id
```

---

## 📝 TODO

- [ ] Panel Super Admin para registrar tenants
- [ ] KDS multi-tenant
- [ ] Admin multi-tenant con reportes
- [ ] Print Server para tickets térmicos
- [ ] Upload de logos por tenant

---

## 🤝 Contribuir

Este es un proyecto privado para lomiterías. Para agregar funcionalidades, consultar con el equipo de desarrollo.

---

## 📄 Licencia

Propietario

---

## 🆘 Soporte

Para problemas o dudas:
1. Ver [IMPLEMENTACION_COMPLETA.md](./IMPLEMENTACION_COMPLETA.md)
2. Revisar sección "Troubleshooting"
3. Contactar al equipo de desarrollo

---

**Última actualización:** Noviembre 2025  
**Versión:** 2.0 Multi-tenant
