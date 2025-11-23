# 🏗️ Sistema de Inventario y Puntos - Multi-Tenant

## 📋 Resumen

Este script agrega funcionalidades de **inventario automático** y **sistema de puntos** al sistema POS, **100% preparado para múltiples lomiterías**.

## ✅ Características Multi-Tenant

### 🔒 Seguridad por Tenant

- ✅ Todas las tablas tienen `tenant_id`
- ✅ Los triggers verifican `tenant_id` en cada operación
- ✅ Las vistas incluyen `tenant_id` para filtrar por lomitería
- ✅ Los índices están optimizados para búsquedas por tenant
- ✅ Cada lomitería es completamente independiente

### 📊 Tablas Creadas

1. **`inventario`** - Control de stock por producto y tenant
2. **`movimientos_inventario`** - Historial de movimientos

### 🔄 Triggers Automáticos

1. **Descuento de stock** - Se ejecuta cuando se crea un pedido
2. **Restauración de stock** - Se ejecuta si se cancela un pedido
3. **Acreditación de puntos** - Se ejecuta cuando un pedido pasa a 'entregado'

### 📈 Vistas Útiles

1. **`vista_stock_bajo`** - Productos con stock bajo (filtrable por tenant)
2. **`vista_cuenta_corriente_puntos`** - Resumen de puntos por cliente (filtrable por tenant)

## 🚀 Cómo Ejecutar

### Paso 1: Ejecutar el Script SQL

1. Abre **Supabase SQL Editor**
2. Copia el contenido de `database-inventario-y-puntos.sql`
3. Pégalo en el editor
4. Ejecuta (Ctrl + Enter)
5. ✅ Debe decir "Success"

### Paso 2: Verificar que se crearon las tablas

```sql
-- Ver tablas nuevas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventario', 'movimientos_inventario');

-- Ver triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%inventario%' OR trigger_name LIKE '%puntos%';
```

## 🎯 Ejemplos de Uso por Tenant

### 1. Configurar Inventario para Atlas Burger

```sql
-- Obtener el tenant_id de Atlas Burger
SELECT id FROM tenants WHERE slug = 'atlas-burger';

-- Habilitar control de stock para un producto
INSERT INTO inventario (
  tenant_id, 
  producto_id, 
  stock_actual, 
  stock_minimo, 
  controlar_stock
)
SELECT 
  (SELECT id FROM tenants WHERE slug = 'atlas-burger'),
  id,
  100,  -- stock inicial
  10,   -- stock mínimo (alertar cuando baje de 10)
  true  -- habilitar descuento automático
FROM productos 
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
  AND nombre = 'Clásica';
```

### 2. Consultar Stock Bajo de Atlas Burger

```sql
SELECT * 
FROM vista_stock_bajo 
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger');
```

### 3. Consultar Cuenta Corriente de Puntos

```sql
-- Todos los clientes de Atlas Burger con sus puntos
SELECT * 
FROM vista_cuenta_corriente_puntos 
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
ORDER BY saldo_actual DESC;
```

### 4. Agregar Stock a un Producto

```sql
UPDATE inventario 
SET stock_actual = stock_actual + 50
WHERE producto_id = 'producto-uuid'
  AND tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger');
```

### 5. Ver Movimientos de Inventario

```sql
-- Ver todos los movimientos de inventario de Atlas Burger
SELECT 
  mi.*,
  p.nombre as producto_nombre,
  i.stock_actual
FROM movimientos_inventario mi
JOIN inventario i ON mi.inventario_id = i.id
LEFT JOIN productos p ON i.producto_id = p.id
WHERE i.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
ORDER BY mi.created_at DESC
LIMIT 50;
```

## 🔄 Funcionamiento Automático

### Inventario

1. **Al crear un pedido:**
   - El trigger `trigger_descontar_inventario` se ejecuta
   - Verifica stock disponible (usando `tenant_id` del pedido)
   - Descuenta automáticamente la cantidad vendida
   - Registra el movimiento en `movimientos_inventario`

2. **Al cancelar un pedido:**
   - El trigger `trigger_restaurar_inventario` se ejecuta
   - Restaura el stock que se había descontado
   - Registra el movimiento como "entrada"

### Puntos

1. **Al entregar un pedido:**
   - El trigger `trigger_acreditar_puntos` se ejecuta
   - Calcula puntos (1 punto por cada 100 GS)
   - Acredita puntos al cliente
   - Registra la transacción en `transacciones_puntos`

## 🏢 Escalabilidad: Agregar Nuevas Lomiterías

Cuando agregues una nueva lomitería (ej: "Burger House"):

### 1. Crear el Tenant

```sql
INSERT INTO tenants (nombre, slug) 
VALUES ('Burger House', 'burger-house');
```

### 2. Configurar Inventario

```sql
-- Habilitar inventario para todos los productos de Burger House
INSERT INTO inventario (tenant_id, producto_id, stock_actual, stock_minimo, controlar_stock)
SELECT 
  (SELECT id FROM tenants WHERE slug = 'burger-house'),
  id,
  50,   -- stock inicial
  5,    -- stock mínimo
  true  -- habilitar control
FROM productos 
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'burger-house');
```

### 3. Listo

✅ El sistema automáticamente:
- Descontará stock cuando Burger House haga pedidos
- Acreditará puntos a sus clientes
- Mantendrá todo separado de otras lomiterías

## 🔍 Consultas Útiles

### Ver todos los productos con inventario de un tenant

```sql
SELECT 
  p.nombre,
  i.stock_actual,
  i.stock_minimo,
  i.controlar_stock
FROM productos p
LEFT JOIN inventario i ON i.producto_id = p.id
WHERE p.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
ORDER BY p.nombre;
```

### Ver historial de puntos de un cliente

```sql
SELECT 
  tp.*,
  p.numero_pedido
FROM transacciones_puntos tp
LEFT JOIN pedidos p ON tp.pedido_id = p.id
WHERE tp.cliente_id = 'cliente-uuid'
ORDER BY tp.created_at DESC;
```

## ⚠️ Importante

### Multi-Tenant Safety

- ✅ Todos los triggers verifican `tenant_id`
- ✅ Las funciones usan `tenant_id` del pedido
- ✅ Los JOINs incluyen filtros por `tenant_id`
- ✅ Las vistas incluyen `tenant_id` para filtrar

### En Producción

Cuando tengas múltiples lomiterías en producción:

1. **Habilitar RLS** en las tablas nuevas
2. **Crear políticas** que filtren por `tenant_id`
3. **Usar el contexto del usuario** para obtener `tenant_id`

## 📊 Estructura de Datos

```
tenants (1)
  ├── productos (N) ────┐
  │                     │
  └── clientes (N)      │
                        │
inventario (N) ◄────────┘ (tenant_id + producto_id)
  └── movimientos_inventario (N)

clientes (N)
  └── transacciones_puntos (N)
```

## 🎯 Próximos Pasos

1. ✅ Ejecutar el script SQL
2. ✅ Configurar inventario para productos de Atlas Burger
3. ✅ Probar creando un pedido y verificar que descuenta stock
4. ✅ Probar entregando un pedido y verificar que acredita puntos
5. ✅ Crear interfaces de administración (ver TODOs)

---

**¿Todo listo para ejecutar?** 🚀

Ejecuta `database-inventario-y-puntos.sql` en Supabase y tendrás el sistema completo de inventario y puntos funcionando para todas tus lomiterías.

