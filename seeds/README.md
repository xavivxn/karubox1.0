# 🌱 Seeds - Datos Iniciales de Clientes

## 📋 ¿Qué son los "Seeds"?

Los **seeds** son scripts SQL que cargan datos iniciales en la base de datos. En nuestro caso, cada seed contiene:
- Información del tenant (lomitería)
- Categorías de productos
- Productos con precios
- Configuración inicial

## 📁 Estructura de Carpetas

```
seeds/
├── README.md                    (este archivo)
├── template-seed.sql            (plantilla para nuevos clientes)
├── atlas-burger.sql             (seed de Atlas Burger)
├── lomiteria-ejemplo.sql        (ejemplo de otro cliente)
└── todos-los-seeds.sql          (opcional: todos en uno)
```

## 🎯 Estrategias de Uso

### Estrategia 1: Un archivo por cliente (Recomendado)

**Ventajas:**
- ✅ Fácil de mantener
- ✅ Puedes ejecutar solo el cliente que necesitas
- ✅ Cada cliente es independiente
- ✅ Fácil de compartir/exportar un cliente específico

**Estructura:**
```
seeds/
  ├── atlas-burger.sql
  ├── lomiteria-la-esquina.sql
  └── burger-king-local.sql
```

### Estrategia 2: Un archivo con todos (Para testing)

**Ventajas:**
- ✅ Puedes cargar varios clientes de una vez
- ✅ Útil para ambientes de desarrollo/testing

**Desventajas:**
- ❌ Más difícil de mantener
- ❌ Si falla uno, pueden fallar todos

## 🚀 Cómo Usar

### Opción A: Ejecutar un seed individual

1. Abre Supabase SQL Editor
2. Copia y pega el contenido de `seeds/atlas-burger.sql`
3. Ejecuta (Ctrl + Enter)
4. ✅ Listo

### Opción B: Ejecutar todos los seeds

1. Abre `seeds/todos-los-seeds.sql`
2. Copia todo el contenido
3. Ejecuta en Supabase SQL Editor
4. ✅ Todos los clientes cargados

## 📝 Crear un Nuevo Seed

### Paso 1: Copiar el template

```bash
# Copia el template
cp seeds/template-seed.sql seeds/mi-nuevo-cliente.sql
```

### Paso 2: Editar el archivo

Abre `seeds/mi-nuevo-cliente.sql` y reemplaza:

1. **Nombre del tenant:**
```sql
nombre = 'Mi Nueva Lomitería',
slug = 'mi-nueva-lomiteria',
```

2. **Categorías:**
```sql
(v_tenant_id, 'Categoría 1', 'Descripción', 1, true),
(v_tenant_id, 'Categoría 2', 'Descripción', 2, true),
```

3. **Productos:**
```sql
(v_tenant_id, (SELECT id FROM categorias WHERE tenant_id = v_tenant_id AND nombre = 'Categoría 1'), 
 'Producto 1', 'Descripción del producto', 15000, true),
```

### Paso 3: Ejecutar

Sigue las instrucciones de "Cómo Usar" arriba.

## 🎨 Estructura de un Seed

Cada seed debe seguir esta estructura:

```sql
-- 1. Crear o actualizar el tenant
INSERT INTO tenants (nombre, slug, ...) VALUES (...)

-- 2. Obtener el tenant_id
DO $$ 
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'mi-slug';
  
  -- 3. Eliminar datos antiguos (si es actualización)
  DELETE FROM productos WHERE tenant_id = v_tenant_id;
  DELETE FROM categorias WHERE tenant_id = v_tenant_id;
  
  -- 4. Insertar categorías
  INSERT INTO categorias (...) VALUES (...);
  
  -- 5. Insertar productos
  INSERT INTO productos (...) VALUES (...);
  
END $$;
```

## 📊 Nomenclatura

Usa nombres descriptivos para los archivos:

✅ **Buenos:**
- `atlas-burger.sql`
- `lomiteria-la-esquina.sql`
- `burger-house.sql`
- `don-juan-version-2.sql`

❌ **Malos:**
- `seed1.sql`
- `cliente.sql`
- `nuevo.sql`

## 🔄 Actualizar un Seed Existente

Si necesitas actualizar los datos de un cliente existente:

1. **Opción 1:** Ejecutar el seed completo (borra y vuelve a insertar)
2. **Opción 2:** Crear un script de actualización separado:
   ```
   seeds/
     ├── atlas-burger.sql
     └── atlas-burger-update-2025-01.sql  (solo actualizaciones)
   ```

## ⚠️ Importante

### Los seeds NO crean usuarios

Los seeds solo cargan:
- ✅ Tenant (lomitería)
- ✅ Categorías
- ✅ Productos

**NO incluyen:**
- ❌ Usuarios (deben crearse en Supabase Auth primero)
- ❌ Clientes
- ❌ Pedidos

### Slug único

Cada tenant debe tener un **slug único**:
- ✅ `atlas-burger`
- ✅ `lomiteria-la-esquina`
- ✅ `burger-house`

## 📞 Ejemplos

Ver los archivos en esta carpeta:
- `atlas-burger.sql` - Ejemplo completo y funcional
- `template-seed.sql` - Plantilla para nuevos clientes

---

**💡 Tip:** Mantén los seeds en esta carpeta y documenta en el README qué clientes tienes.

