# Plan de implementación: Reporte PDF de Clientes

## Objetivo
Permitir descargar la tabla de clientes como PDF con:
- **Header:** logo del sistema + nombre del reporte (y opcionalmente nombre del tenant).
- **Footer:** texto fijo "ARDENTIUM Software Technologies".

---

## 1. Tecnología recomendada

| Opción | Librería | Pros | Contras |
|--------|----------|------|---------|
| **A** | **jsPDF** + **jspdf-autotable** | Ligera, tablas listas, headers/footers por página, sin backend | Logo hay que embeber como imagen (base64 o URL) |
| B | @react-pdf/renderer | Componentes React → PDF | Más peso, curva de aprendizaje |
| C | Server (Puppeteer / API) | Control total, logo fácil | Complejidad y despliegue |

**Recomendación:** **jsPDF + jspdf-autotable** (generación en el cliente, buena para tablas y paginación con header/footer).

```bash
npm install jspdf jspdf-autotable
```

Tipado (opcional):
```bash
npm install -D @types/jspdf
```

---

## 2. Estructura del PDF

- **Página A4** (o Letter), márgenes que dejen espacio al header y footer.
- **Header (cada página):**
  - Izquierda: logo del sistema (si existe en `public/`, p. ej. `public/logo-ardentium.png`).
  - Centro/derecha: título "Reporte de Clientes" y, si aplica, nombre del negocio (tenant).
  - Línea separadora opcional.
- **Cuerpo:** tabla con columnas: Nombre, CI, Teléfono, Email, Puntos, Fecha de registro (igual que la tabla en pantalla).
- **Footer (cada página):**
  - Centro: "ARDENTIUM Software Technologies" (alineado con el branding de `AppFooter`).
  - Opcional: número de página "Página N de M".

---

## 3. Logo del sistema

- Añadir en el repo un logo para el sistema (p. ej. en `public/logo-ardentium.png` o `.svg`).
- En el PDF, cargar la imagen desde `/logo-ardentium.png` y embeberla en jsPDF (jsPDF acepta URL o base64). Si no existe el logo, el header puede mostrar solo texto (nombre del reporte + tenant).

---

## 4. Archivos a crear / tocar

| Archivo | Acción |
|---------|--------|
| `src/features/clientes/utils/generarPdfClientes.ts` | **Nuevo.** Función que recibe `clientes`, `tenantNombre?`, opciones de branding; usa jsPDF + autotable; dibuja header/footer en cada página; devuelve blob o trigger de descarga. |
| `src/features/clientes/components/ClientesTable.tsx` | Añadir botón "Descargar PDF" (o "Exportar reporte") que llame a la utilidad y descargue el archivo. |
| `public/logo-ardentium.png` | **Nuevo (opcional).** Logo para header del PDF. Si no está, header solo con texto. |
| `package.json` | Añadir dependencias `jspdf` y `jspdf-autotable`. |

---

## 5. Flujo de la función de generación (pseudocódigo)

```
1. Crear instancia de jsPDF (A4).
2. Definir márgenes y altura útil por página.
3. Obtener logo (fetch de /logo-ardentium.png o constante base64) — si falla, continuar sin imagen.
4. Configurar jspdf-autotable con:
   - columnas: Nombre, CI, Teléfono, Email, Puntos, Registrado
   - body: clientes mapeados a filas.
   - didDrawPage: callback que en cada página:
     - dibuja HEADER (logo + "Reporte de Clientes" + tenantNombre).
     - dibuja FOOTER ("ARDENTIUM Software Technologies" + "Página N de M").
5. Generar PDF y descargar: pdf.save('reporte-clientes-YYYY-MM-DD.pdf').
```

---

## 6. Consideraciones

- **Paginación:** Con muchos clientes, autotable reparte en varias páginas; en `didDrawPage` se dibuja header/footer en todas.
- **Orden:** Usar los mismos datos ya ordenados por puntos (el listado ya viene ordenado por puntos totales).
- **Búsqueda:** Decidir si el PDF exporta "todos los clientes" o "solo los resultados actuales de búsqueda". Recomendación: exportar los clientes que se están mostrando en la tabla (respeta filtro de búsqueda si existe).
- **Idioma y formato:** Fechas con el mismo formato que en la app (usar `formatearFecha` del módulo clientes).
- **Marca:** Mantener el texto exacto "ARDENTIUM Software Technologies" en el footer para consistencia con `AppFooter`.

---

## 7. Orden sugerido de implementación

1. Instalar `jspdf` y `jspdf-autotable`.
2. Crear `generarPdfClientes.ts` con header/footer y tabla básica (sin logo).
3. Añadir botón en `ClientesTable` (o en la barra de acciones de la vista de Clientes) que llame a la función y descargue el PDF.
4. Probar con pocos y con muchos clientes (varias páginas).
5. Añadir logo en `public/` e integrarlo en el header del PDF (opcional).
6. Ajustar estilos (tipografía, espaciado) si se desea un diseño más pulido.

---

## 8. Reutilización

La misma idea (header con logo del sistema + footer "ARDENTIUM Software Technologies") se puede extraer después a una utilidad común (p. ej. `src/lib/pdf/headerFooter.ts`) para otros reportes PDF del sistema (pedidos, inventario, etc.).
