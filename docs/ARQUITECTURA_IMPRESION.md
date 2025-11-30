# 📄 Documentación: Arquitectura de Impresión Multi-Tenant

**Sistema**: Ka'u Manager - POS para Lomiterías  
**Fecha**: 2025  
**Versión**: 1.0

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Flujo Paso a Paso](#flujo-paso-a-paso)
3. [Requisitos Técnicos](#requisitos-técnicos)
4. [Casos de Uso](#casos-de-uso)
5. [Ventajas de la Arquitectura](#ventajas-de-la-arquitectura)
6. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
7. [Preguntas para Validar](#preguntas-para-validar)

---

## 🏗️ Arquitectura General

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│  DISPOSITIVO MÓVIL/TABLET (Empleado)                      │
│  - App Web Next.js (PWA)                                   │
│  - Usuario logueado → lomiteriaId identificado            │
│  - Misma red WiFi que PC central                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP POST
                      │ http://[agentIP]:[puerto]/print
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  SUPABASE (Cloud)                                          │
│  - Tabla: printer_config                                    │
│  - Mapeo: lomiteria_id → printerId → agentIP               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Consulta configuración
                      │
┌─────────────────────▼───────────────────────────────────────┐
│  PC CENTRAL (Local físico)                                 │
│  - Agente Node.js/Express                                   │
│  - Escucha en 0.0.0.0:[puerto] (red local)                │
│  - Map<printerId, dispositivo físico>                      │
│  - Impresora conectada (USB o Red)                         │
└─────────────────────────────────────────────────────────────┘
```

### Componentes del Sistema

1. **App Web Next.js (Dispositivo Móvil/Tablet)**
   - PWA que funciona en cualquier dispositivo
   - Identifica `lomiteriaId` del usuario logueado
   - Consulta configuración en Supabase
   - Envía solicitud de impresión al agente

2. **Supabase (Cloud)**
   - Tabla `printer_config` con mapeo de lomiterías a impresoras
   - Almacena: `lomiteria_id`, `printer_id`, `agent_ip`, `agent_port`

3. **Agente de Impresión (PC Central)**
   - Servicio Node.js/Express corriendo en PC del local
   - Mantiene Map en memoria: `printerId → dispositivo físico`
   - Recibe solicitudes HTTP POST
   - Genera comandos ESC/POS y envía a impresora

4. **Impresora Térmica (Hardware)**
   - Conectada a PC central (USB o Red)
   - Recibe comandos ESC/POS
   - Imprime tickets de cocina o facturas

---

## 🔄 Flujo Paso a Paso

### 1. Inicio de Sesión (Dispositivo Móvil)

**Acción**: Empleado inicia sesión en la app web desde celular/tablet

**Proceso**:
- El sistema identifica el `lomiteriaId` del usuario autenticado
- El `lomiteriaId` queda disponible en el contexto/sesión de la aplicación
- El usuario puede operar normalmente desde el dispositivo móvil

**Resultado**: Usuario autenticado con `lomiteriaId` identificado

---

### 2. Confirmación de Pedido (Dispositivo Móvil)

**Acción**: Empleado confirma un pedido desde el celular/tablet

**Proceso**:
- El sistema guarda el pedido en Supabase (tabla `pedidos`)
- Se dispara automáticamente el proceso de impresión
- El pedido se guarda independientemente del resultado de la impresión

**Resultado**: Pedido guardado en base de datos, proceso de impresión iniciado

---

### 3. Consulta de Configuración de Impresora

**Acción**: La app consulta qué impresora usar para esta lomitería

**Proceso**:
- Consulta a Supabase: tabla `printer_config`
- Filtro: `WHERE lomiteria_id = [lomiteriaId del usuario]`
- Obtiene los siguientes datos:
  - `printer_id`: Identificador único de la impresora física
  - `agent_ip`: IP de la PC donde corre el agente (ej: "192.168.1.100")
  - `agent_port`: Puerto donde escucha el agente (ej: 3001)

**Resultado**: Configuración de impresora obtenida para la lomitería

---

### 4. Envío de Solicitud de Impresión

**Acción**: La app envía HTTP POST al agente de impresión

**Proceso**:
- URL: `http://[agentIP]:[agentPort]/print`
- Método: POST
- Headers: `Content-Type: application/json`
- Body incluye:
  - `printerId`: Para identificar qué impresora física usar
  - `tipo`: "cocina" o "factura"
  - `data`: Datos completos del pedido:
    - Número de pedido
    - Items con cantidades y personalizaciones
    - Total
    - Cliente (si aplica)
    - Fecha/hora

**Resultado**: Solicitud enviada al agente en la PC central

---

### 5. Procesamiento en el Agente (PC Central)

**Acción**: El agente recibe y procesa la solicitud

**Proceso**:
- El agente recibe el POST en el endpoint `/print`
- Extrae el `printerId` del body
- Busca la impresora física en su Map en memoria usando el `printerId`
- Si no encuentra la impresora → responde 404
- Si encuentra la impresora → continúa con la generación

**Resultado**: Impresora física identificada y lista para imprimir

---

### 6. Generación de Comandos ESC/POS

**Acción**: El agente genera los comandos de impresión

**Proceso**:
- Usa un `TicketGenerator` que formatea los datos
- Genera comandos ESC/POS según el tipo:
  - **Ticket de cocina**: Número de pedido, items, personalizaciones, notas
  - **Factura**: Datos del cliente, items, totales, información fiscal
- Incluye formato, alineación, tamaños de texto según diseño

**Resultado**: Comandos ESC/POS listos para enviar a la impresora

---

### 7. Impresión Física

**Acción**: El agente envía comandos a la impresora

**Proceso**:
- El agente envía los comandos ESC/POS a la impresora física
- La impresora recibe y procesa los comandos
- Imprime el ticket en papel térmico
- El agente espera confirmación de impresión exitosa

**Resultado**: Ticket impreso físicamente en la cocina o caja

---

### 8. Manejo de Errores

**Acción**: Sistema maneja errores sin afectar el pedido

**Proceso**:
- Si falla la impresión, **NO se cancela el pedido**
- El pedido ya está guardado en Supabase
- Se registra el error para revisión posterior
- La app puede mostrar un aviso al empleado
- Opción de reimprimir manualmente más tarde

**Resultado**: Pedido guardado, error registrado, usuario notificado

---

## ⚙️ Requisitos Técnicos

### Red Local

**Requisitos**:
- ✅ El dispositivo móvil y la PC central deben estar en la **misma red WiFi**
- ✅ El agente debe escuchar en `0.0.0.0` (no solo `localhost`)
- ✅ La PC central debe tener IP fija o conocida en la red local
- ✅ No debe haber firewall bloqueando el puerto del agente

**Configuración del Agente**:
```
❌ INCORRECTO: app.listen(3001, 'localhost')
✅ CORRECTO: app.listen(3001, '0.0.0.0')
```

---

### Base de Datos (Supabase)

**Tabla: `printer_config`**

Estructura sugerida:
```sql
CREATE TABLE printer_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lomiteria_id UUID NOT NULL REFERENCES tenants(id),
  printer_id TEXT UNIQUE NOT NULL,
  agent_ip TEXT NOT NULL,
  agent_port INTEGER DEFAULT 3001,
  tipo_impresora TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos**:
- `lomiteria_id`: FK a la tabla de tenants (identifica la lomitería)
- `printer_id`: Identificador único de la impresora (ej: "atlas-burger-printer-1")
- `agent_ip`: IP de la PC donde corre el agente (ej: "192.168.1.100")
- `agent_port`: Puerto donde escucha el agente (ej: 3001)
- `tipo_impresora`: Opcional, para configuraciones específicas

**Índices**:
- Índice único en `lomiteria_id` (una configuración por lomitería)
- Índice en `printer_id` para búsquedas rápidas

---

### Agente de Impresión

**Requisitos**:
- ✅ Debe estar corriendo como servicio en la PC central
- ✅ Debe mantener un Map en memoria: `printerId → dispositivo físico`
- ✅ Debe exponer endpoint POST `/print`
- ✅ Debe manejar errores (impresora desconectada, sin papel, etc.)
- ✅ Debe poder manejar múltiples impresoras simultáneamente

**Inicialización del Map**:
- Al iniciar, el agente debe cargar todas las impresoras configuradas
- Mapear cada `printerId` a su dispositivo físico correspondiente
- Mantener este Map en memoria para acceso rápido

**Endpoint**:
```
POST /print
Content-Type: application/json

Body:
{
  "printerId": "atlas-burger-printer-1",
  "tipo": "cocina", // o "factura"
  "data": {
    "numeroPedido": 42,
    "tipoPedido": "local",
    "items": [...],
    "total": 50000,
    "cliente": {...},
    "fecha": "2025-01-15T14:30:00Z"
  }
}
```

---

### App Web (Next.js)

**Requisitos**:
- ✅ Debe poder hacer requests HTTP a IPs locales
- ✅ Debe consultar `printer_config` antes de imprimir
- ✅ Debe manejar errores de red (agente no disponible)
- ✅ **NO debe fallar el pedido si falla la impresión**
- ✅ Debe ser responsive para funcionar en móviles/tablets

**Flujo en la App**:
1. Usuario confirma pedido
2. Guardar pedido en Supabase
3. Consultar `printer_config` con `lomiteriaId`
4. Si hay configuración → enviar POST al agente
5. Si no hay configuración → solo guardar pedido (sin imprimir)
6. Si falla la impresión → mostrar aviso pero mantener pedido guardado

---

## 📱 Casos de Uso

### Caso 1: Impresión Exitosa

**Escenario**: Todo funciona correctamente

**Flujo**:
1. Empleado confirma pedido desde celular
2. App consulta `printer_config` → obtiene IP y `printerId`
3. App envía POST al agente
4. Agente encuentra impresora por `printerId`
5. Agente genera comandos ESC/POS
6. Impresora imprime ticket en cocina
7. Empleado ve confirmación en celular: "Pedido confirmado e impreso"

**Resultado**: ✅ Pedido guardado y ticket impreso

---

### Caso 2: Agente No Disponible

**Escenario**: La PC central está apagada o el agente no está corriendo

**Flujo**:
1. Empleado confirma pedido
2. App consulta `printer_config` → obtiene IP
3. App intenta enviar POST al agente
4. **Timeout o error de conexión** (agente no responde)
5. El pedido **se guarda igual** en Supabase
6. App muestra aviso: "Pedido guardado, pero no se pudo imprimir"
7. Opción de reimprimir más tarde cuando el agente esté disponible

**Resultado**: ✅ Pedido guardado, ⚠️ Impresión fallida (reintentable)

---

### Caso 3: Impresora Desconectada

**Escenario**: El agente está corriendo pero la impresora está desconectada

**Flujo**:
1. Empleado confirma pedido
2. App envía POST al agente
3. Agente recibe solicitud
4. Agente busca impresora por `printerId` → la encuentra en el Map
5. Agente intenta enviar comandos ESC/POS
6. **Error: impresora no responde** (desconectada, sin papel, etc.)
7. Agente responde error a la app
8. El pedido **se guarda igual** en Supabase
9. App muestra aviso: "Pedido guardado, pero la impresora no está disponible"

**Resultado**: ✅ Pedido guardado, ⚠️ Impresión fallida (reintentable)

---

### Caso 4: Múltiples Lomiterías, Mismo Agente

**Escenario**: Varias lomiterías comparten la misma PC/agente

**Flujo**:
1. Lomitería A: Empleado confirma pedido
   - App consulta `printer_config` → `printerId: "lomiteria-a-printer"`
   - Agente busca impresora con ese `printerId` → imprime en Impresora A
2. Lomitería B: Empleado confirma pedido (mismo agente)
   - App consulta `printer_config` → `printerId: "lomiteria-b-printer"`
   - Agente busca impresora con ese `printerId` → imprime en Impresora B

**Resultado**: ✅ Cada lomitería imprime en su impresora correcta

**Ventaja**: Un solo agente puede manejar múltiples impresoras simultáneamente

---

### Caso 5: Lomitería Sin Configuración de Impresora

**Escenario**: La lomitería no tiene impresora configurada

**Flujo**:
1. Empleado confirma pedido
2. App consulta `printer_config` con `lomiteriaId`
3. **No se encuentra configuración** (no hay registro)
4. El pedido **se guarda igual** en Supabase
5. No se intenta imprimir
6. App funciona normalmente (solo sin impresión)

**Resultado**: ✅ Pedido guardado, ℹ️ Sin impresión (configuración pendiente)

---

## ✨ Ventajas de esta Arquitectura

### 1. Multi-Tenant Nativo
- Cada lomitería tiene su propia configuración de impresora
- Fácil agregar/quitar lomiterías sin afectar otras
- Configuración centralizada en Supabase

### 2. Escalable
- Un agente puede manejar múltiples impresoras
- Múltiples lomiterías pueden compartir el mismo agente
- O cada lomitería puede tener su propio agente

### 3. Flexible
- Cada lomitería puede tener su propia PC/agente
- O varias lomiterías pueden compartir un agente central
- Fácil cambiar configuración sin tocar código

### 4. Resiliente
- Si falla la impresión, el pedido se guarda igual
- No se pierden ventas por problemas de impresión
- Opción de reimprimir manualmente más tarde

### 5. Móvil-First
- Funciona desde cualquier dispositivo en la red local
- No requiere instalación de software en móviles
- PWA funciona offline (guardar pedidos, imprimir cuando haya conexión)

### 6. Centralizado
- Configuración en Supabase (fácil de actualizar)
- No requiere cambios en código para agregar impresoras
- Administración simple desde la base de datos

---

## 🔒 Consideraciones de Seguridad

### 1. Acceso a la Red Local
- ⚠️ El agente solo debe estar accesible en la red local
- ❌ **NO exponer el agente a internet** (riesgo de seguridad)
- ✅ Usar firewall para bloquear acceso externo
- ✅ Considerar autenticación básica (API key o token)

### 2. Validación de Datos
- ✅ Validar que el `printerId` corresponda a la `lomiteria_id` del usuario
- ✅ Validar que el usuario tenga permiso para imprimir
- ✅ Sanitizar datos antes de generar comandos ESC/POS

### 3. Autenticación del Agente
- ✅ El agente puede requerir autenticación (token o API key)
- ✅ Validar que las solicitudes vengan de la app autorizada
- ✅ Considerar rate limiting para evitar abusos

### 4. Auditoría
- ✅ Registrar todos los intentos de impresión
- ✅ Log de errores para debugging
- ✅ Historial de qué se imprimió y cuándo

### 5. Manejo de Errores
- ✅ No exponer información sensible en errores
- ✅ Logs detallados en servidor, mensajes simples en cliente
- ✅ Manejar timeouts apropiadamente

---

## ❓ Preguntas para Validar

### Sobre el Agente
1. ✅ ¿El agente ya está corriendo y accesible en la red local?
2. ✅ ¿El agente escucha en `0.0.0.0` o solo en `localhost`?
3. ✅ ¿Cómo se inicializa el Map de impresoras en el agente?
4. ✅ ¿El agente maneja reconexión si la impresora se desconecta?
5. ✅ ¿El agente tiene algún sistema de autenticación?

### Sobre la Base de Datos
1. ✅ ¿La tabla `printer_config` ya existe en Supabase?
2. ✅ ¿Hay datos de prueba configurados?
3. ✅ ¿Cómo se relaciona `printer_id` con el dispositivo físico?

### Sobre la Red
1. ✅ ¿Hay algún firewall que pueda bloquear las conexiones?
2. ✅ ¿La PC central tiene IP fija o dinámica?
3. ✅ ¿Todos los dispositivos están en la misma red WiFi?

### Sobre la App Web
1. ✅ ¿La app puede hacer requests a IPs locales?
2. ✅ ¿Hay algún CORS configurado en el agente?
3. ✅ ¿Cómo se maneja el caso de agente no disponible?

### Sobre las Impresoras
1. ✅ ¿Qué tipo de conexión usan las impresoras? (USB/Red/Bluetooth)
2. ✅ ¿Las impresoras soportan ESC/POS?
3. ✅ ¿Hay múltiples impresoras por lomitería?

---

## 📝 Notas Adicionales

### Tipos de Impresión

**Ticket de Cocina**:
- Número de pedido
- Tipo de pedido (local/delivery/para llevar)
- Items con cantidades
- Personalizaciones (sin cebolla, extra queso, etc.)
- Notas del pedido
- Hora de creación

**Factura**:
- Datos del cliente (nombre, CI, dirección)
- Número de factura
- Items con precios
- Subtotal, impuestos, total
- Información fiscal
- Fecha y hora

### Formato de Datos

El agente debe recibir datos estructurados que permitan generar ambos tipos de tickets. El `TicketGenerator` debe formatear según el `tipo` recibido.

### Reimpresión

Si falla la impresión inicial, debe haber una opción para reimprimir manualmente:
- Desde el dashboard administrativo
- Seleccionar pedido y opción "Reimprimir ticket"
- Mismo flujo: consultar `printer_config` → enviar al agente

---

## 🎯 Conclusión

Esta arquitectura permite que empleados tomen pedidos desde cualquier dispositivo móvil en la red local, y que los tickets se impriman automáticamente en la impresora física conectada a la PC central. El sistema es robusto, escalable y no pierde pedidos aunque falle la impresión.

**Puntos Clave**:
- ✅ Multi-tenant: cada lomitería tiene su configuración
- ✅ Resiliente: pedidos se guardan aunque falle impresión
- ✅ Flexible: múltiples configuraciones posibles
- ✅ Móvil: funciona desde cualquier dispositivo
- ✅ Centralizado: configuración en Supabase

---

**Documento creado**: 2025  
**Última actualización**: 2025  
**Versión**: 1.0




