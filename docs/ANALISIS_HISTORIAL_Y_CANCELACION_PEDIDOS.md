# Análisis: Historial de pedidos y cancelación (rollback) con control de fraude

## 1. Estado actual

### Roles en el POS
- **admin**: puede entrar al POS y al panel de administración (dashboard, clientes, etc.).
- **cajero**: solo puede entrar al POS (toma pedidos, cobra, emite factura si corresponde).
- **owner**: no usa el POS de un local concreto; gestiona tenants y usuarios (crea admins/cajeros).

No hay hoy:
- **Historial de pedidos**: pantalla para ver pedidos ya confirmados (por fecha, estado, número).
- **Cancelación de pedidos**: forma de “anular” un pedido y deshacer todo lo que se hizo al confirmar.

### Por qué no dar cancelación libre al cajero

Si el cajero puede cancelar sin control:
1. Cobra en efectivo al cliente.
2. Confirma el pedido (queda registrado, se descuenta stock, puntos, se imprime cocina).
3. Cancela el pedido él mismo → se revierte stock, puntos, etc.
4. El dinero ya está en su bolsillo y en el sistema “no pasó nada”.

Por eso la cancelación debe estar **restringida** (solo admin, o con aprobación/auditoría).

---

## 2. Qué hace hoy “confirmar pedido” (todo lo que habría que revertir)

Cuando se confirma un pedido en `orderService.confirmOrder` ocurre lo siguiente, **en este orden**:

| # | Acción | Tabla / efecto | Reversión al cancelar |
|---|--------|-----------------|------------------------|
| 1 | Crear cabecera del pedido | `pedidos` (estado_pedido = 'FACT', estado según schema) | Marcar pedido como anulado (estado_pedido = 'ANUL', estado = 'cancelado') |
| 2 | Crear ítems del pedido | `items_pedido` | No borrar; el pedido sigue existiendo pero “anulado” (auditoría) |
| 3 | Actualizar puntos del cliente | `clientes.puntos_totales` | Restar los puntos que se sumaron |
| 4 | Registrar transacción de puntos | `transacciones_puntos` (tipo 'ganado') | Insertar transacción “reversión” o “devolución” (puntos negativos / tipo anulación) |
| 5 | Descontar ingredientes (recetas) | `ingredientes.stock_actual` + `movimientos_ingredientes` (tipo 'salida') | Sumar de vuelta el stock y registrar movimiento de “devolución” o “anulación” por pedido |
| 6 | Descontar productos sin receta | `inventario.stock_actual` + `movimientos_inventario` (tipo 'salida') | Idem: devolver stock y registrar movimiento de anulación |
| 7 | (Opcional) Emitir factura | `facturas` + `tenant_facturacion.ultimo_numero` | **No** revertir número fiscal; en Paraguay la factura anulada suele quedar registrada como “anulada”, no se borra |
| 8 | Imprimir ticket cocina | Solo efecto externo (impresora) | No reversible; opcional: imprimir “ANULADO” si se quiere |

Resumen: el “rollback” no es borrar el pedido, sino:
- Marcar el pedido como **anulado** (estado_pedido = 'ANUL', estado = 'cancelado').
- **Reversar**: puntos (cliente + transacción), stock de ingredientes, stock de inventario (con movimientos de anulación/devolución).
- **Factura**: si existe factura, definir si solo se marca “anulada” en BD o si además se exige comprobante físico (eso es negocio/legal, no solo técnico).

---

## 3. Riesgo de fraude y opciones de control

### Riesgo
- **Cajero con permiso de cancelar**: puede cobrar, confirmar y luego cancelar → robo.
- **Solo admin puede cancelar**: el dueño o un encargado de confianza es quien anula; el cajero no tiene botón “Cancelar pedido” (o lo tiene deshabilitado).

### Opciones de diseño (de más simple a más estricta)

| Opción | Quién puede cancelar | Ventaja | Desventaja |
|-------|----------------------|---------|------------|
| **A** | Solo **admin** | Simple, bajo riesgo: el cajero nunca puede anular. | Si no hay admin presente, no se puede anular (o hay que llamar al dueño). |
| **B** | **Admin** siempre; **cajero** solo si el pedido es “reciente” (ej. últimos 5–10 min) | Permite corregir errores de carga sin esperar al admin. | Ventana de tiempo puede usarse para fraude si es muy larga. |
| **C** | **Cajero** puede solicitar anulación; **admin** la aprueba (flujo de “solicitud de anulación”) | Auditoría clara: quién pidió anular y quién aprobó. | Más desarrollo (estados, pantalla de “pendientes de aprobación”, notificaciones). |
| **D** | Solo **admin**, y además **segundo factor** (PIN o contraseña de supervisor) para confirmar la anulación | Máxima seguridad. | Más fricción y más código. |

Recomendación para empezar: **Opción A** (solo admin puede cancelar). Si más adelante hace falta que el cajero corrija algo recién hecho, se puede añadir **B** (ventana de tiempo corta, ej. 5 minutos) solo para cajero, o **C** si se prefiere trazabilidad explícita.

---

## 4. Auditoría imprescindible

Toda cancelación debe quedar registrada:

- **Quién** anuló: usuario (admin/cajero) + `usuario_id`.
- **Cuándo**: timestamp.
- **Qué pedido**: `pedido_id` (ya queda ligado al pedido con estado ANUL).
- **Motivo** (opcional pero recomendable): texto libre o lista fija (“Error de carga”, “Cliente se arrepintió”, “Duplicado”, etc.).

Opciones de implementación:
- Guardar en el propio **pedido**: columnas `cancelado_por_id`, `cancelado_at`, `motivo_cancelacion`.
- O tabla aparte **anulaciones_pedido** (pedido_id, usuario_id, fecha, motivo) para no tocar tanto la tabla `pedidos`.

Con eso el dueño puede revisar quién anuló qué y cuándo.

---

## 5. Casos borde a definir

- **Factura ya emitida**  
  Si el pedido tiene factura, la anulación fiscal en Paraguay suele ser “factura anulada”, no borrar. Conviene:
  - No permitir anular desde la app sin que antes se anule la factura en el régimen que use el negocio, **o**
  - Permitir anular el pedido pero dejar claro que la factura debe anularse por otro canal (contador/SET).  
  En BD: al menos marcar la factura como anulada (ej. columna `anulada` en `facturas`) y no reutilizar el número.

- **Tiempo transcurrido**  
  Opcional: no permitir anular pedidos de hace más de X horas o X días (política de negocio).

- **Número de factura**  
  No revertir `tenant_facturacion.ultimo_numero`: el número ya usado queda “quemado”; la siguiente factura sigue con el siguiente número. Si se anula, la factura queda con estado “anulada”.

- **Puntos**  
  Reversión: restar de `clientes.puntos_totales` e insertar una transacción de tipo “anulacion” o “devolucion” con puntos negativos (o saldo_anterior/saldo_nuevo coherentes) para que el historial de puntos sea consistente.

- **Stock**  
  Los movimientos de “devolución” o “anulación” deben quedar en `movimientos_ingredientes` y `movimientos_inventario` con tipo claro (ej. `anulacion_pedido`) y referencia al `pedido_id`, para no perder trazabilidad.

---

## 6. Propuesta de diseño (resumen)

### 6.1 Historial de pedidos
- **Pantalla nueva** (accesible desde el POS o desde el menú admin): “Historial de pedidos” o “Pedidos”.
- Filtros: por fecha (hoy, ayer, rango), por estado (confirmado, cancelado), por número de pedido.
- Columnas útiles: número de pedido, fecha/hora, cliente, total, estado (FACT/ANUL), tipo (local/delivery/etc.), cajero que tomó el pedido.
- **Permisos**: tanto **admin** como **cajero** pueden **ver** el historial (solo lectura); así el cajero puede buscar un pedido para decir “este fue el que quiero anular” cuando pide al admin que lo cancele.

### 6.2 Cancelación (rollback)
- **Quién**: solo **admin** (por ahora). En la UI, el botón “Cancelar pedido” / “Anular” solo se muestra si `usuario.rol === 'admin'`.
- **Dónde**: desde el historial de pedidos (o desde un detalle del pedido), con confirmación modal (“¿Anular pedido #X? Se revertirán puntos e inventario.”).
- **Backend**: función o servicio `cancelOrder(pedidoId, usuarioId, motivo?)` que:
  1. Comprueba que el pedido existe, está en estado FACT y no está ya anulado.
  2. Comprueba que el usuario es admin (en backend; no confiar solo en el front).
  3. Revierte puntos (cliente + transacción).
  4. Revierte stock (ingredientes + inventario), registrando movimientos de anulación.
  5. Marca factura como anulada si existe (columna en `facturas`).
  6. Marca pedido como estado_pedido = 'ANUL', estado = 'cancelado', y guarda cancelado_por_id, cancelado_at, motivo_cancelacion.
- **Base de datos**: agregar en `pedidos` (o en tabla de anulaciones) los campos de auditoría (cancelado_por_id, cancelado_at, motivo_cancelacion). Si hay factura, agregar en `facturas` un campo `anulada` (boolean) y opcionalmente `anulada_at`, `anulada_por_id`.

### 6.3 Seguridad
- En el **cliente**: no mostrar acción “Anular” a cajeros.
- En el **servidor**: al exponer la acción de cancelación (server action o API), validar que el usuario autenticado sea **admin** del tenant del pedido; si no, devolver 403.

---

## 7. Próximos pasos (cuando decidas implementar)

1. **BD**: migración con columnas de anulación en `pedidos` (y en `facturas` si aplica).
2. **Rollback de inventario**: función o módulo que, dado un `pedido_id`, lea los movimientos de ese pedido (movimientos_ingredientes y movimientos_inventario con pedido_id = X), y para cada uno haga la devolución de stock e inserte movimiento de tipo anulación.
3. **Rollback de puntos**: leer transacción(es) de tipo 'ganado' con ese pedido_id, restar esos puntos del cliente e insertar transacción de reversión.
4. **Servicio** `cancelOrder` en el backend que orqueste lo anterior y actualice pedido (y factura).
5. **UI**: historial de pedidos (lista + filtros) y, solo para admin, botón “Anular” con modal de confirmación y motivo.

Con este análisis se puede implementar el historial y la cancelación con control de fraude (solo admin puede anular) y buena auditoría. Si más adelante querés ventana de tiempo para el cajero o flujo de aprobación, se puede extender sobre esta base.
