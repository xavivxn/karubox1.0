# Panel de Clientes – Especificación y templates

Documento de diseño del panel de clientes: datos, acciones, envíos automáticos y propuestas de templates para WhatsApp y email. **Sin implementación de envío** (email/WhatsApp se configuran después).

---

## 1. Datos del cliente a mostrar en el panel

Cada fila o ficha del cliente debe incluir todo lo que tenemos en BD más lo calculado:

| Dato | Origen | Notas |
|------|--------|--------|
| **Nombre** | `clientes.nombre` | |
| **Teléfono** | `clientes.telefono` | Para WhatsApp y contacto |
| **Email** | `clientes.email` | Para email; puede ser opcional |
| **CI** | `clientes.ci` | |
| **RUC** | `clientes.ruc` | |
| **Dirección** | `clientes.direccion` | Útil para delivery |
| **Notas** | `clientes.notas` | Notas internas del negocio |
| **Puntos acumulados** | `clientes.puntos_totales` | Saldo actual |
| **Última vez que vino** | `MAX(pedidos.created_at)` donde `cliente_id = X` y pedido facturado/entregado | Días desde última visita |
| **Total pedidos (histórico)** | `COUNT(pedidos)` por `cliente_id` (FACT/entregado) | Frecuencia |
| **Total gastado (opcional)** | Suma de `pedidos.total` del cliente | Referencia |
| **Fecha de alta** | `clientes.created_at` | Cuándo se dio de alta |

**Cálculo “última vez que vino”:**  
Último `created_at` de `pedidos` con `cliente_id = cliente.id` y `estado_pedido = 'FACT'` (o `estado = 'entregado'` según criterio contable). Mostrar como fecha y/o “hace X días”.

---

## 2. Acciones y botones del panel

### 2.1 Envíos masivos por “inactividad”

- **“Enviar mensaje a quienes no vienen hace 15 días”**  
  - Filtro: clientes del tenant con última visita &lt; 15 días (o sin pedidos en los últimos 15 días).  
  - Envía el mismo mensaje (template) por **WhatsApp** y, si tiene email, por **email**.  
  - Opcional: regalo de puntos (ej. “Te regalamos X puntos si venís antes de [fecha]”).

- **“Enviar mensaje a quienes no vienen hace 30 días”**  
  - Igual que arriba, con filtro de 30 días.  
  - Puede usar otro texto/template más “te extrañamos” o oferta más fuerte (más puntos o beneficio).

### 2.2 Mensaje personalizado a todos

- **“Enviar mensaje personalizado a todos mis clientes”**  
  - Abre editor de mensaje (o elige template predefinido).  
  - Se envía a todos los clientes que tengan al menos teléfono o email.  
  - Mismo contenido por WhatsApp y por email (o dos textos: uno corto WA, uno con template lindo para email).  
  - Opcional: incluir regalo de puntos en el mensaje (ej. “De regalo te acreditamos X puntos”).

### 2.3 Switches (activar/desactivar envíos automáticos)

- **Switch: “Activar envío automático cada 15 días”**  
  - Si está activo: periódicamente (ej. cron/scheduled job) se envían mensajes a clientes que no vienen hace 15 días.  
  - El mensaje usado puede ser el template “15 días” (configurable después).

- **Switch: “Activar envío automático cada 30 días”**  
  - Igual para inactivos de 30 días.  
  - Puede coexistir con el de 15 (uno no excluye al otro).

Guardar estado de los switches en BD (ej. en `tenants.config_json` o tabla de configuración por tenant).

### 2.4 Recomendar mensaje personalizado

- **“Recomendar mensaje personalizado”**  
  - Botón o sección que **sugiere** un texto según contexto:  
    - Ej. “Clientes inactivos 15 días” → sugerencia: “Hola {{nombre}}, hace un tiempo que no te vemos. Tenés {{puntos}} puntos esperándote. Te regalamos 50 puntos extra si venís esta semana. ¡Te esperamos!”  
  - El usuario puede editar y luego usar “Enviar mensaje personalizado” o “Enviar a inactivos 15/30”.

---

## 3. Otras ideas para el panel (fidelizar y que vuelvan)

- **Filtros rápidos**  
  - Por “sin visita &gt; 15 días”, “&gt; 30 días”, “con email”, “con teléfono”, “con más de X puntos”.

- **Segmentos visibles**  
  - Tarjetas o contadores: “X clientes no vienen hace 15 días”, “Y clientes no vienen hace 30 días”, “Z con email”, “W con teléfono”.

- **Regalo de puntos desde el panel**  
  - Por cliente: “Regalar X puntos” (con motivo opcional).  
  - Masivo: “Regalar X puntos a todos los que no vienen hace 30 días” (y luego enviar mensaje informando el regalo).

- **Historial de puntos por cliente**  
  - En la ficha del cliente: últimas transacciones (ganado/canjeado/ajuste) para transparencia.

- **Historial de pedidos por cliente**  
  - Últimos N pedidos (fecha, total, número) para contexto.

- **“Próximo canje”**  
  - Si definís umbral (ej. 500 pts = descuento): mostrar “Te faltan X puntos para [beneficio]” en ficha o en el mensaje.

- **Plantillas guardadas**  
  - El negocio guarda 2–3 plantillas (nombre + cuerpo) para WhatsApp y para email, y elige cuál usar en cada envío.

- **Registro de envíos**  
  - Tabla o log: a quién se envió, cuándo, tipo (15 días / 30 días / personalizado), canal (email/WA). Para no repetir el mismo mensaje al mismo cliente el mismo día (y para auditoría).

- **Preferencia “no molestar”**  
  - Campo en cliente: “no enviar mensajes promocionales” (checkbox). Los filtros de envío lo excluyen.

---

## 4. Templates de mensaje (texto sugerido)

Los templates se usan cuando se implemente el envío por WhatsApp y por email. Aquí solo se define el **contenido y estructura**; el diseño visual del email se hará después.

### 4.1 Variables disponibles en todos los templates

- `{{nombre_lomiteria}}` – Nombre del negocio (tenant).
- `{{nombre_cliente}}` – Nombre del cliente.
- `{{puntos}}` – Puntos acumulados actuales.
- `{{puntos_regalo}}` – Puntos que se regalan en la campaña (ej. 50).
- `{{dias_inactivo}}` – Días desde última visita (15 o 30 según el caso).
- `{{mensaje_personalizado}}` – Texto que el usuario escribe en “mensaje personalizado”.

---

### 4.2 Template: “No venís hace 15 días” (WhatsApp – texto corto)

```
Hola {{nombre_cliente}} 👋

En {{nombre_lomiteria}} te extrañamos. Hace {{dias_inactivo}} días que no pasás por acá.

Tenés *{{puntos}} puntos* esperándote. Para que vuelvas con más ganas, te regalamos *{{puntos_regalo}} puntos* si venís esta semana.

¿Cuándo nos visitás? 🍔
```

---

### 4.3 Template: “No venís hace 30 días” (WhatsApp – texto más “reenganche”)

```
Hola {{nombre_cliente}} 👋

Hace {{dias_inactivo}} días que no te vemos en {{nombre_lomiteria}}. ¡Queremos que vuelvas!

Tu saldo: *{{puntos}} puntos*. Como regalo por ser parte de nosotros, te acreditamos *{{puntos_regalo}} puntos* solo por pasar a saludarnos esta quincena.

Te esperamos 🧡
```

---

### 4.4 Template: “Mensaje personalizado a todos” (WhatsApp – base)

```
Hola {{nombre_cliente}} 👋

{{mensaje_personalizado}}

Tu saldo actual: *{{puntos}} puntos*.

— {{nombre_lomiteria}}
```

(Opcional: si hay regalo de puntos en la campaña, agregar: “Además te regalamos {{puntos_regalo}} puntos.”)

---

### 4.5 Template: Email (estructura sugerida – “No venís hace 15/30 días”)

**Asunto sugerido:**  
`{{nombre_cliente}}, te extrañamos en {{nombre_lomiteria}} – Tenés {{puntos}} puntos + regalo`

**Estructura del cuerpo (secciones):**

1. **Header**  
   Logo o nombre de la lomitería.

2. **Saludo**  
   “Hola {{nombre_cliente}},”

3. **Mensaje principal**  
   - “En [nombre_lomiteria] te extrañamos. Hace [dias_inactivo] días que no pasás por acá.”  
   - “Tu saldo actual: **{{puntos}} puntos**.”  
   - “Para que vuelvas, te regalamos **{{puntos_regalo}} puntos** si venís esta semana.”

4. **Call to action**  
   Texto tipo: “Vení a vernos” / “Te esperamos” (sin link si no hay web; si hay, botón opcional).

5. **Pie**  
   Nombre del local, teléfono, dirección (datos del tenant).

**Nota:** El mismo contenido puede adaptarse para “30 días” cambiando el texto a “hace un mes” o “hace 30 días” y ajustando el tono (“reenganche”).

---

### 4.6 Template: Email – “Mensaje personalizado a todos”

**Asunto:**  
`{{nombre_cliente}} – Mensaje de {{nombre_lomiteria}}`

**Cuerpo:**  
- Header (logo/nombre).  
- “Hola {{nombre_cliente}},”  
- Bloque: `{{mensaje_personalizado}}`  
- “Tu saldo actual: **{{puntos}} puntos**.”  
- Si aplica: “Además te regalamos **{{puntos_regalo}} puntos**.”  
- Pie (local, contacto).

---

## 5. Regalo de puntos en los mensajes

- En el panel, al configurar la campaña (15 días, 30 días o mensaje personalizado), el usuario puede indicar: **“Regalar X puntos”** (número o 0 si no hay regalo).
- Esos puntos se acreditan al cliente cuando se envía el mensaje (o en un segundo paso “Acreditar regalos de la campaña”). Así el mensaje no miente: “te regalamos 50 puntos” y efectivamente se suman.
- Requiere: registro de “campaña” o “envío” con `puntos_regalo` y luego aplicar `ajuste` en `transacciones_puntos` y actualizar `clientes.puntos_totales` para cada destinatario que reciba el regalo.

---

## 6. Resumen de lo que NO se hace aún (como pediste)

- **No** se configura el envío real de email (SMTP/Resend/SendGrid, etc.).
- **No** se configura el envío real de WhatsApp (API/Business, etc.).
- **Sí** se deja definido el **texto y la estructura** de los templates (WhatsApp y email) y las variables, para cuando se implemente el envío.

Cuando quieras implementar, se podrá:  
- Crear plantillas HTML para email a partir de esta estructura.  
- Conectar los textos de WhatsApp a la API que elijas.  
- Usar las mismas variables en ambos canales.

---

## 7. Checklist rápido del panel

- [ ] Listado de clientes con todos los datos + última visita + puntos.
- [ ] Botón: “Enviar a quienes no vienen hace 15 días”.
- [ ] Botón: “Enviar a quienes no vienen hace 30 días”.
- [ ] Botón: “Enviar mensaje personalizado a todos”.
- [ ] Switch: activar/desactivar envío automático 15 días.
- [ ] Switch: activar/desactivar envío automático 30 días.
- [ ] “Recomendar mensaje personalizado” (sugerencia de texto).
- [ ] Templates definidos para WhatsApp y email (con variables y regalo de puntos).
- [ ] Posibilidad de regalar puntos en la campaña y acreditarlos al enviar.
- [ ] (Opcional) Filtros, segmentos, historial de puntos/pedidos, “no molestar”, registro de envíos.

Si querés, el siguiente paso puede ser bajar esto a tareas de implementación (qué pantallas, qué endpoints, qué campos en BD) sin tocar aún email/WhatsApp.
