# ProductModal - Modal de Registro de Productos

## Descripción
Componente modal para registrar nuevos productos directamente desde el panel de administración.

## Funcionalidad Implementada

### ✅ Características
- Modal grande con diseño consistente con el resto de la aplicación
- Formulario completo para registro de productos
- Validaciones de campos obligatorios
- Carga dinámica de categorías desde la BD
- Guardado directo a la base de datos
- Mensajes de éxito y error
- Indicador de carga durante el guardado

### 📝 Campos del Formulario
1. **Nombre del producto** (obligatorio)
   - Campo de texto
   - Placeholder: "Ej: Hamburguesa clásica"

2. **Descripción** (opcional)
   - Área de texto con 3 filas
   - Permite detalles adicionales del producto

3. **Precio** (obligatorio)
   - Campo numérico
   - En Guaraníes (Gs.)
   - Paso de 100
   - Validación: debe ser mayor a 0

4. **Categoría** (obligatorio)
   - Select dropdown
   - Carga automática desde la tabla `categorias`
   - Muestra solo categorías activas

5. **URL de imagen** (opcional)
   - Campo tipo URL
   - Icono visual de imagen
   - Placeholder: "https://ejemplo.com/imagen.jpg"

6. **Disponibilidad**
   - Checkbox
   - Por defecto: marcado (disponible)
   - Permite activar/desactivar el producto para venta

## Integración

### Componentes Modificados
1. **AdminHeader.tsx**
   - Botón "Cargar productos en POS" cambiado de Link a button
   - Añadido evento onClick para abrir el modal
   - Nueva prop: `onOpenProductModal`

2. **AdminView.tsx**
   - Estado `showProductModal` para controlar la visibilidad
   - Handler `handleProductSaved` para refrescar datos tras guardado
   - Importación del componente `ProductModal`

3. **index.ts**
   - Exportación del componente `ProductModal`

### Base de Datos
- Función utilizada: `crearProducto()` de `@/lib/db/productos`
- Tabla: `productos`
- Campos guardados:
  ```typescript
  {
    tenant_id: string,
    nombre: string,
    descripcion?: string,
    precio: number,
    categoria_id?: string,
    disponible: boolean,
    imagen_url?: string,
    is_deleted: boolean,
    deleted_at?: string,
    created_at: string,
    updated_at: string
  }
  ```

## Uso

```tsx
<ProductModal
  open={showProductModal}
  onClose={() => setShowProductModal(false)}
  tenantId={tenant.id}
  onSaved={handleProductSaved}
/>
```

## Estilo y Diseño
- Diseño consistente con FeedbackModal y InventoryDrawer
- Colores: 
  - Primario: Orange-500 (botón guardar)
  - Secundario: Gray-100 (botón cancelar)
- Bordes redondeados: rounded-2xl y rounded-3xl
- Backdrop blur para el overlay
- Animaciones: fade-in y zoom-in
- Responsive: max-w-3xl
- Dark mode compatible

## Validaciones
1. Nombre no vacío
2. Precio mayor a 0
3. Categoría seleccionada
4. Formato URL válido (si se proporciona imagen)

## Mensajes de Retroalimentación
- **Éxito**: "¡Producto '[nombre]' creado exitosamente!"
- **Error**: "No se pudo guardar el producto. Inténtalo de nuevo."
- Auto-cierre tras 1.5 segundos en caso de éxito
