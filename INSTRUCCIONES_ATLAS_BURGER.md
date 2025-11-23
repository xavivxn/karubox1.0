# 🍔 Atlas Burger - Instrucciones para Cargar Datos

## 📋 Resumen

Este script actualiza el tenant existente "Lomitería Don Juan" a **"Atlas Burger"** y carga todos los productos y precios reales del menú.

## ✅ Lo que hace el script

1. ✅ **Actualiza el nombre del tenant** de "Lomitería Don Juan" a "Atlas Burger"
2. ✅ **Cambia el slug** a "atlas-burger"
3. ✅ **Elimina** todos los productos y categorías antiguas
4. ✅ **Inserta las nuevas categorías** del menú real:
   - Burger Atlas
   - Smash Atlas
   - Entradas
   - Árabes
   - Bebidas
   - Agregados
5. ✅ **Inserta todos los productos** con sus precios en Guaraníes (GS)
6. ✅ **Mantiene tu usuario de login** existente (no se borra)

## 🚀 Cómo ejecutar

### Paso 1: Abrir Supabase SQL Editor

1. Ve a **https://supabase.com**
2. Selecciona tu proyecto
3. En el menú lateral, click en **"SQL Editor"** (ícono de base de datos con rayo)
4. Click en **"New query"**

### Paso 2: Copiar y pegar el script

1. Abre el archivo `seeds/atlas-burger.sql` en tu editor
2. **Copia TODO el contenido** del archivo
3. Pégalo en el SQL Editor de Supabase

### Paso 3: Ejecutar

1. Click en **"Run"** (o presiona `Ctrl + Enter`)
2. Espera a que termine de ejecutar
3. Deberías ver mensajes como:
   - ✅ "Atlas Burger: Datos insertados correctamente"
   - Las tablas de verificación con productos y categorías

### Paso 4: Verificar

Ejecuta esta consulta para ver todos los productos:

```sql
SELECT 
  c.nombre as categoria,
  p.nombre as producto,
  p.precio
FROM productos p
JOIN categorias c ON p.categoria_id = c.id
WHERE p.tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger')
ORDER BY c.orden, p.nombre;
```

## 📦 Productos incluidos

### Burger Atlas (11 productos)
- Cheese Kids - 17.000 GS
- Clásica - 20.000 GS
- Mega de Luxe - 23.000 GS
- Mega BBQ - 23.000 GS
- Mega Onion - 23.000 GS
- Mega Bacon - 23.000 GS
- Burcheddar - 27.000 GS
- Big Atlas Doble Libra - 27.000 GS
- Big Atlas - 30.000 GS
- Yaguamboom - 25.000 GS
- Resacona - 25.000 GS

### Smash Atlas (3 productos)
- Smash Atlas - 20.000 GS
- Smash Bacon - 23.000 GS
- Smash American Cuádruple - 32.000 GS

### Entradas (5 productos)
- Papas Pequeñas - 8.000 GS
- Papas Medianas - 10.000 GS
- Papas Grandes - 12.000 GS
- Nuggets - 12.000 GS
- Agregado de Cheddar y Bacon - 2.000 GS

### Árabes (4 productos)
- Árabe Pollo - 22.000 GS
- Árabe Mixto - 22.000 GS
- Árabe de Carne - 25.000 GS
- Árabe XXL - 30.000 GS

### Bebidas (6 productos)
- Coca Cola Personal - 5.000 GS
- Coca Cola ½ - 8.000 GS
- Coca Cola Lata - 8.000 GS
- Coca Cola 1,5L - 15.000 GS
- Del Valle Jugo 200ml - 5.000 GS
- Del Valle Jugo 1.5LTS - 15.000 GS

### Agregados (5 productos)
- Salsa de Ajo - 0 GS (sin costo)
- Ketchup - 0 GS (sin costo)
- Papitas - 0 GS (sin costo)
- Barbacoa - 2.000 GS
- Cheddar Derretido - 3.000 GS

**Total: 34 productos** 📊

## ⚠️ Importante

### Tu usuario de login sigue funcionando

- ✅ El usuario que ya tienes creado **NO se borra**
- ✅ Solo cambia el nombre del tenant en la base de datos
- ✅ Puedes seguir usando el mismo email y contraseña para iniciar sesión
- ✅ Verás "Atlas Burger" en lugar de "Lomitería Don Juan" cuando inicies sesión

### Si algo sale mal

Si necesitas volver atrás, puedes:

1. **Verificar qué tenant tienes:**
```sql
SELECT id, nombre, slug FROM tenants;
```

2. **Ver tus usuarios:**
```sql
SELECT u.email, u.nombre, u.rol, t.nombre as tenant
FROM usuarios u
JOIN tenants t ON u.tenant_id = t.id;
```

3. **Si necesitas revertir** (volver a Don Juan):
```sql
UPDATE tenants 
SET nombre = 'Lomitería Don Juan', slug = 'lomiteria-don-juan'
WHERE slug = 'atlas-burger';
```

## ✅ Verificar que funcionó

1. Inicia sesión en tu app
2. Deberías ver **"Atlas Burger"** como nombre del tenant
3. En el módulo POS, deberías ver todas las categorías y productos nuevos
4. Los precios deben estar en Guaraníes (GS)

## 🎯 Próximos pasos

Después de ejecutar el script:

1. ✅ Verifica que todos los productos estén visibles
2. ✅ Prueba crear un pedido de prueba
3. ✅ Si necesitas ajustar precios, puedes hacerlo desde el admin o ejecutando:

```sql
UPDATE productos 
SET precio = [NUEVO_PRECIO]
WHERE nombre = '[NOMBRE_PRODUCTO]'
AND tenant_id = (SELECT id FROM tenants WHERE slug = 'atlas-burger');
```

## 📞 Soporte

Si encuentras algún problema:
- Verifica que el tenant "lomiteria-don-juan" exista antes de ejecutar
- Revisa los mensajes de error en el SQL Editor
- Verifica que todos los productos se insertaron correctamente

¡Listo! 🎉 Ahora Atlas Burger tiene su menú completo cargado en la base de datos.

