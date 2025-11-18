# 🖨️ Guía de Integración: Impresión de Tickets para Cocina

**Sistema**: POS Lomitería  
**Impresora**: 58MM Portable MINI Thermal Printer  
**Framework**: Next.js 15 + TypeScript

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Opciones de Conectividad](#opciones-de-conectividad)
3. [Arquitectura de Integración](#arquitectura-de-integración)
4. [Protocolo ESC/POS](#protocolo-escpos)
5. [Estrategias de Implementación](#estrategias-de-implementación)
6. [Librerías y Herramientas](#librerías-y-herramientas)
7. [Flujo de Trabajo Recomendado](#flujo-de-trabajo-recomendado)
8. [Consideraciones Técnicas](#consideraciones-técnicas)
9. [Solución de Problemas](#solución-de-problemas)
10. [Casos de Uso](#casos-de-uso)

---

## 🎯 Resumen Ejecutivo

Las impresoras térmicas de 58mm son dispositivos compactos ideales para imprimir tickets de cocina en restaurantes. Utilizan el protocolo **ESC/POS** (Epson Standard Code for Point of Sale), un estándar de la industria para comunicarse con impresoras de punto de venta.

### Ventajas de las Impresoras Térmicas de 58mm

- **Compactas**: Ideales para cocinas con espacio limitado
- **Sin tinta**: Usan papel térmico, reduciendo costos operativos
- **Rápidas**: Impresión instantánea de tickets
- **Duraderas**: Diseñadas para ambientes de alta demanda
- **Bajo mantenimiento**: Sin cartuchos ni cintas

---

## 🔌 Opciones de Conectividad

Tu impresora de 58mm puede conectarse de diferentes formas. Es crucial identificar qué tipo de conexión soporta tu modelo específico.

### 1. **USB (Recomendado para Escritorio)**

**Características:**
- Conexión física directa a la computadora
- Más estable y confiable
- No requiere configuración de red
- Ideal para sistemas POS fijos

**Ventajas:**
- ✅ Sin latencia
- ✅ Sin problemas de conectividad inalámbrica
- ✅ Configuración simple

**Desventajas:**
- ❌ Requiere cable físico
- ❌ Limitada a un solo dispositivo
- ❌ No funciona desde navegador web (requiere solución adicional)

---

### 2. **Bluetooth (Recomendado para Movilidad)**

**Características:**
- Conexión inalámbrica de corto alcance (hasta 10m)
- Ideal para tablets o dispositivos móviles
- Sin cables

**Ventajas:**
- ✅ Portabilidad
- ✅ Múltiples dispositivos pueden conectarse
- ✅ Fácil emparejamiento

**Desventajas:**
- ❌ Alcance limitado
- ❌ Puede tener interferencias
- ❌ Requiere emparejamiento inicial

---

### 3. **WiFi / Ethernet (Recomendado para Producción)**

**Características:**
- Conexión de red (WiFi o cable Ethernet)
- Impresora tiene dirección IP propia
- Múltiples dispositivos pueden imprimir

**Ventajas:**
- ✅ Alcance ilimitado (dentro de la red)
- ✅ Múltiples POS pueden imprimir a la misma impresora
- ✅ Más profesional y escalable
- ✅ Puede imprimirse desde cualquier dispositivo en la red

**Desventajas:**
- ❌ Requiere configuración de red
- ❌ Depende de la estabilidad de la red WiFi
- ❌ Puede requerir configuración de firewall

---

## 🏗️ Arquitectura de Integración

### Opción 1: Arquitectura Cliente-Servidor (Recomendada)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                   │
│  ┌────────────┐        ┌────────────┐                  │
│  │  POS App   │───────▶│  API POST  │                  │
│  │ (Navegador)│        │  /print    │                  │
│  └────────────┘        └─────┬──────┘                  │
└──────────────────────────────┼──────────────────────────┘
                               │
                               │ HTTP Request
                               │ (Datos del ticket)
                               │
┌──────────────────────────────▼──────────────────────────┐
│              BACKEND / PRINT SERVER                     │
│  ┌────────────────────────────────────────────┐        │
│  │  Node.js Server / Electron / Service       │        │
│  │  - Recibe datos del pedido                 │        │
│  │  - Formatea con comandos ESC/POS           │        │
│  │  - Envía a impresora                       │        │
│  └─────────────────────┬──────────────────────┘        │
└────────────────────────┼───────────────────────────────┘
                         │
                         │ ESC/POS Commands
                         │
              ┌──────────▼──────────┐
              │   IMPRESORA 58MM    │
              │  (Térmica ESC/POS)  │
              └─────────────────────┘
```

**Flujo:**
1. El usuario confirma el pedido en el POS (navegador)
2. El frontend envía los datos a una API endpoint `/api/print`
3. Un servidor Node.js o servicio local procesa la petición
4. El servidor formatea el ticket con comandos ESC/POS
5. Envía los comandos a la impresora mediante USB/Bluetooth/WiFi

---

### Opción 2: Arquitectura con Electron (App de Escritorio)

```
┌─────────────────────────────────────────────────────────┐
│              ELECTRON APP (Next.js + Node)              │
│                                                          │
│  ┌──────────────┐          ┌────────────────┐          │
│  │   Renderer   │          │  Main Process  │          │
│  │  (Next.js)   │◀────────▶│   (Node.js)    │          │
│  │              │   IPC    │                │          │
│  │  - UI/UX     │          │  - Acceso USB  │          │
│  │  - POS       │          │  - ESC/POS     │          │
│  └──────────────┘          └────────┬───────┘          │
│                                     │                   │
└─────────────────────────────────────┼───────────────────┘
                                      │
                                      │ Comandos ESC/POS
                                      │
                           ┌──────────▼──────────┐
                           │   IMPRESORA 58MM    │
                           └─────────────────────┘
```

**Ventajas:**
- Acceso directo al hardware (USB, puertos serie)
- No requiere servidor separado
- Aplicación standalone

---

### Opción 3: Arquitectura con Impresora de Red (WiFi/Ethernet)

```
┌─────────────────────────────────────────────────────────┐
│               FRONTEND (Next.js - Navegador)            │
│  ┌────────────────────────────────────────────┐        │
│  │  POS App                                    │        │
│  │  - Usuario confirma pedido                 │        │
│  │  - Envía a API /api/print                  │        │
│  └─────────────────────┬──────────────────────┘        │
└────────────────────────┼───────────────────────────────┘
                         │
                         │ HTTP POST
                         │
┌────────────────────────▼───────────────────────────────┐
│           BACKEND (Next.js API Routes)                 │
│  ┌────────────────────────────────────────────┐       │
│  │  /api/print endpoint                       │       │
│  │  - Formatea ticket ESC/POS                 │       │
│  │  - Envía por Socket TCP/IP                 │       │
│  └─────────────────────┬──────────────────────┘       │
└────────────────────────┼──────────────────────────────┘
                         │
                         │ TCP Socket (puerto 9100)
                         │ Comandos ESC/POS
                         │
              ┌──────────▼──────────┐
              │   IMPRESORA 58MM    │
              │   IP: 192.168.1.100 │
              │   Puerto: 9100      │
              └─────────────────────┘
```

**Ventajas:**
- Impresión desde múltiples dispositivos
- Escalable (varias impresoras en la red)
- Compatible con navegadores

---

## 📜 Protocolo ESC/POS

### ¿Qué es ESC/POS?

**ESC/POS** (Epson Standard Code for Point of Sale) es un lenguaje de comandos usado para controlar impresoras térmicas de punto de venta. Consiste en secuencias de bytes que indican a la impresora qué hacer.

### Comandos Básicos ESC/POS

#### 1. **Inicialización**
```
ESC @ (0x1B 0x40)
```
Reinicia la impresora a su estado por defecto.

---

#### 2. **Formato de Texto**

| Comando | Descripción | Bytes |
|---------|-------------|-------|
| **Negrita ON** | Activa texto en negrita | `ESC E 1` (0x1B 0x45 0x01) |
| **Negrita OFF** | Desactiva negrita | `ESC E 0` (0x1B 0x45 0x00) |
| **Tamaño doble** | Texto grande | `GS ! n` (0x1D 0x21 0x11) |
| **Subrayado** | Activa subrayado | `ESC - 1` (0x1B 0x2D 0x01) |

---

#### 3. **Alineación**

| Comando | Descripción | Bytes |
|---------|-------------|-------|
| **Izquierda** | Alinea a la izquierda | `ESC a 0` (0x1B 0x61 0x00) |
| **Centro** | Centra el texto | `ESC a 1` (0x1B 0x61 0x01) |
| **Derecha** | Alinea a la derecha | `ESC a 2` (0x1B 0x61 0x02) |

---

#### 4. **Corte de Papel**

```
Corte parcial: GS V 1 (0x1D 0x56 0x01)
Corte completo: GS V 0 (0x1D 0x56 0x00)
```

---

#### 5. **Salto de Línea**

```
LF (Line Feed): 0x0A
```

---

### Ejemplo de Ticket de Cocina (Secuencia ESC/POS)

**Ticket Visual:**
```
================================
     🍔 COCINA - LOMITERÍA
================================

PEDIDO #0042
Tipo: LOCAL
Hora: 14:35

--------------------------------
2x LOMITO COMPLETO
   - Sin cebolla
   
1x HAMBURGUESA DOBLE
   - Con queso extra
   
3x PAPAS FRITAS
--------------------------------

NOTAS:
Cliente pide lo antes posible

================================
```

**Comandos ESC/POS (conceptual):**
```
1. ESC @ (Inicializar)
2. ESC a 1 (Centrar)
3. GS ! 0x11 (Texto doble)
4. "🍔 COCINA - LOMITERÍA"
5. LF LF
6. ESC a 0 (Izquierda)
7. GS ! 0x00 (Texto normal)
8. "================================"
9. LF LF
10. ESC E 1 (Negrita ON)
11. "PEDIDO #0042"
12. ESC E 0 (Negrita OFF)
13. LF
14. "Tipo: LOCAL"
15. LF
16. "Hora: 14:35"
17. LF LF
18. "--------------------------------"
19. LF
20. ESC E 1 (Negrita ON)
21. "2x LOMITO COMPLETO"
22. ESC E 0
23. LF
24. "   - Sin cebolla"
25. LF LF
26. ... (continuar con productos)
27. "================================"
28. LF LF LF
29. GS V 1 (Cortar papel)
```

---

## 🛠️ Estrategias de Implementación

### Estrategia 1: Servidor de Impresión Local (Recomendado para USB/Bluetooth)

**Descripción:**
Crear un pequeño servidor Node.js que corra en la máquina donde está conectada la impresora. Este servidor expone una API HTTP que tu aplicación Next.js puede llamar.

**Componentes:**
1. **Servidor de impresión** (Node.js standalone)
   - Express.js para API HTTP
   - Librería ESC/POS para formateo
   - Driver para comunicación USB/Bluetooth

2. **Frontend Next.js**
   - Llama a la API local (ej: `http://localhost:3001/print`)
   - Envía datos del pedido en JSON
   - Recibe confirmación de impresión

**Ventajas:**
- ✅ Funciona con cualquier tipo de conexión
- ✅ Navegador no necesita acceso directo al hardware
- ✅ Fácil de depurar y mantener

**Flujo:**
```
POS Web (Next.js) → HTTP POST → Servidor Local → USB/BT → Impresora
```

---

### Estrategia 2: Aplicación Electron (App de Escritorio)

**Descripción:**
Convertir tu aplicación Next.js en una aplicación de escritorio usando Electron. Esto permite acceso directo al hardware desde JavaScript.

**Componentes:**
1. **Main Process (Node.js)** - Backend de Electron
   - Maneja comunicación con impresora
   - Tiene acceso completo al sistema operativo

2. **Renderer Process (Next.js)** - Frontend
   - Tu aplicación actual sin cambios
   - Se comunica con Main via IPC

**Ventajas:**
- ✅ Todo en una sola aplicación
- ✅ No requiere servidor separado
- ✅ Fácil distribución (instalador único)

**Desventajas:**
- ❌ Mayor tamaño de aplicación
- ❌ Requiere instalación en cada máquina
- ❌ No accesible desde otros dispositivos

---

### Estrategia 3: Impresora de Red (WiFi/Ethernet) + API Routes

**Descripción:**
Si tu impresora soporta conexión de red, puedes enviar comandos ESC/POS directamente desde tu backend Next.js usando sockets TCP.

**Componentes:**
1. **Next.js API Routes** (`/api/print`)
   - Genera comandos ESC/POS
   - Abre socket TCP a la IP de la impresora (puerto 9100)
   - Envía comandos y cierra conexión

2. **Frontend**
   - Llama a `/api/print` con datos del pedido
   - Totalmente agnóstico del hardware

**Ventajas:**
- ✅ Sin software adicional
- ✅ Escalable (múltiples impresoras)
- ✅ Funciona desde cualquier navegador
- ✅ Cloud-ready (con VPN)

**Configuración:**
```
Impresora → Configuración → Red → WiFi/Ethernet
IP estática: 192.168.1.100
Puerto: 9100 (estándar ESC/POS)
```

---

### Estrategia 4: PWA + Web Bluetooth API (Experimental)

**Descripción:**
Para impresoras Bluetooth, usar la Web Bluetooth API del navegador. Solo funciona en HTTPS y navegadores compatibles (Chrome/Edge).

**Ventajas:**
- ✅ No requiere software adicional
- ✅ Funciona desde navegador

**Desventajas:**
- ❌ Solo Chrome/Edge
- ❌ Requiere HTTPS
- ❌ Usuario debe autorizar conexión Bluetooth
- ❌ API experimental

---

## 📚 Librerías y Herramientas

### Para Node.js (Servidor de Impresión / Electron)

#### 1. **node-escpos**
- URL: https://github.com/song940/node-escpos
- Funciones: Formateo ESC/POS completo
- Conexiones: USB, Bluetooth, Network
- Popularidad: ⭐⭐⭐⭐ (más usado)

**Características:**
- API de alto nivel
- Soporte para imágenes y códigos de barras
- Múltiples conexiones

---

#### 2. **escpos**
- URL: https://github.com/receipt-print-hq/escpos-tools
- Similar a node-escpos
- Muy documentado

---

#### 3. **node-thermal-printer**
- URL: https://github.com/Klemen1337/node-thermal-printer
- Especializado en impresoras térmicas
- API simple y directa

---

#### 4. **node-usb**
- Para comunicación USB de bajo nivel
- Más complejo pero más control

---

### Para Network Printing (TCP/IP)

#### 1. **net** (módulo nativo Node.js)
- No requiere dependencias
- Socket TCP directo
- Ideal para impresoras de red

**Uso conceptual:**
```
1. Crear cliente TCP
2. Conectar a IP:Puerto (ej: 192.168.1.100:9100)
3. Enviar buffer ESC/POS
4. Cerrar conexión
```

---

### Para Electron

#### 1. **electron-pos-printer**
- Específico para Electron
- Simplifica impresión

---

### Herramientas de Testing

#### 1. **RawBT** (Android)
- App para probar comandos ESC/POS
- Útil para debugging

#### 2. **ESCPOS Printer Test App** (Windows)
- Probar impresoras conectadas
- Enviar comandos manuales

---

## 🔄 Flujo de Trabajo Recomendado

### Fase 1: Identificación y Testing del Hardware

**Pasos:**

1. **Identificar el modelo exacto de tu impresora**
   - Buscar manual del fabricante
   - Verificar protocolos soportados (ESC/POS, CPCL, etc.)
   - Confirmar métodos de conexión (USB, BT, WiFi)

2. **Probar conectividad básica**
   - USB: Verificar que Windows/Mac detecta el dispositivo
   - Bluetooth: Emparejar desde configuración del sistema
   - WiFi: Configurar IP estática, probar ping

3. **Hacer impresión de prueba**
   - Usar botón físico de la impresora (si tiene)
   - O usar software del fabricante

---

### Fase 2: Desarrollo del Print Server

**Opción Recomendada: Servidor Local Node.js**

**Componentes:**

1. **Crear proyecto Node.js separado**
   ```
   lomiteria-print-server/
   ├── package.json
   ├── server.js
   ├── printer.js (lógica ESC/POS)
   └── config.json (configuración impresora)
   ```

2. **Instalar dependencias**
   - Express (API HTTP)
   - node-escpos (o similar)
   - cors (para aceptar requests del frontend)

3. **Crear endpoint `/print`**
   - Recibe JSON con datos del pedido
   - Valida datos
   - Formatea ticket con ESC/POS
   - Envía a impresora
   - Retorna status

4. **Manejar errores**
   - Impresora desconectada
   - Sin papel
   - Timeout

---

### Fase 3: Integración con Frontend Next.js

**En tu aplicación POS:**

1. **Crear servicio de impresión**
   ```
   src/services/printerService.ts
   ```
   - Función para enviar pedido a imprimir
   - Manejo de errores
   - Estado de impresora (online/offline)

2. **Modificar flujo de confirmación de pedido**
   - Después de guardar pedido en Supabase
   - Llamar a función de impresión
   - Mostrar feedback al usuario

3. **Agregar configuración**
   - IP/Puerto del print server
   - Habilitar/deshabilitar impresión automática
   - Tipos de pedido que se imprimen (solo Local, todos, etc.)

---

### Fase 4: Testing en Producción

**Pruebas:**

1. ✅ Impresión correcta de todos los campos
2. ✅ Formato legible (no cortado, bien alineado)
3. ✅ Manejo de caracteres especiales (tildes, ñ)
4. ✅ Productos con nombres largos
5. ✅ Pedidos con muchos items
6. ✅ Notas largas del cliente
7. ✅ Comportamiento con impresora desconectada
8. ✅ Reconexión automática

---

## 🔧 Consideraciones Técnicas

### 1. Ancho del Papel (58mm)

**Limitaciones:**
- Máximo ~32 caracteres por línea (fuente normal)
- ~16 caracteres con texto doble
- Planificar diseño de ticket con estas restricciones

**Recomendaciones:**
- Abreviar nombres largos
- Usar saltos de línea inteligentes
- Priorizar información crítica

---

### 2. Calidad de Impresión

**Factores:**
- **Densidad de impresión**: Ajustable en algunas impresoras
- **Velocidad**: Mayor velocidad = menor calidad
- **Temperatura**: Afecta contraste

**Configuración óptima:**
- Velocidad media
- Densidad media-alta
- Prueba y ajusta según tu papel térmico

---

### 3. Papel Térmico

**Tipos:**
- **Estándar**: Para recibos normales (3-5 años)
- **Larga duración**: Hasta 10 años
- **Alta temperatura**: Para cocinas

**Para cocina:**
- ✅ Usar papel de alta temperatura
- ✅ Resistente a grasa y agua
- ✅ Mayor grosor (80gsm)

---

### 4. Codificación de Caracteres

**Problema:**
Caracteres especiales español (á, é, í, ó, ú, ñ, ¿, ¡) pueden no imprimirse correctamente.

**Solución:**
- Configurar codepage correcto (CP850 para español)
- Comando: `ESC t n` donde n es el codepage
- O usar tabla de caracteres ASCII extendido

**Alternativa:**
- Convertir caracteres problemáticos
  - á → a
  - ñ → n
  - ¿ → ?

---

### 5. Duración del Ticket

**Problema:**
El papel térmico se desvanece con el tiempo, calor y luz.

**Para tickets de cocina (uso inmediato):**
- No es problema crítico
- El ticket se usa y descarta en minutos

**Para tickets de cliente (archivo):**
- Usar papel de larga duración
- O sistema de tickets digitales adicional

---

### 6. Velocidad de Impresión

**Típica:**
- ~50-90mm por segundo
- Ticket completo: 2-4 segundos

**Optimización:**
- Limitar largo del ticket (info esencial)
- Evitar gráficos complejos
- Usar comandos eficientes

---

### 7. Conectividad y Fiabilidad

**USB:**
- Más estable
- Requiere drivers (a veces)
- Cable puede desconectarse

**Bluetooth:**
- Puede perder conexión
- Implementar reconexión automática
- Verificar batería (si es inalámbrica)

**WiFi:**
- Depende de red estable
- Configurar IP estática
- Firewall puede bloquear

**Recomendación:**
- Siempre tener modo manual alternativo
- Permitir re-imprimir tickets
- Log de intentos de impresión

---

## 🐛 Solución de Problemas

### Problema 1: Impresora No Detectada

**USB:**
- ✅ Verificar que el cable está bien conectado
- ✅ Probar otro puerto USB
- ✅ Verificar en Administrador de Dispositivos (Windows)
- ✅ Instalar drivers del fabricante

**Bluetooth:**
- ✅ Emparejar desde configuración del sistema primero
- ✅ Verificar que impresora está encendida y en modo pairing
- ✅ Eliminar pairing antiguo y re-emparejar

**WiFi:**
- ✅ Verificar que está en la misma red
- ✅ Hacer ping a la IP
- ✅ Verificar firewall
- ✅ Probar puerto 9100 con telnet

---

### Problema 2: Imprime Caracteres Extraños

**Causa:**
- Codepage incorrecto
- Comandos ESC/POS mal formados

**Solución:**
- Enviar comando reset al inicio (ESC @)
- Configurar codepage correcto
- Verificar encoding del texto (UTF-8 vs ASCII)

---

### Problema 3: Texto Cortado o Mal Alineado

**Causa:**
- Líneas muy largas
- No considerar ancho del papel

**Solución:**
- Calcular ancho disponible (32 chars para 58mm)
- Agregar saltos de línea manuales
- Usar padding/spacing adecuado

---

### Problema 4: No Corta el Papel

**Causa:**
- Comando de corte no soportado
- Impresora sin cuchilla automática

**Solución:**
- Verificar manual de la impresora
- Algunos modelos requieren corte manual
- Usar comando de avance de papel en su lugar (LF x N)

---

### Problema 5: Impresión Demasiado Clara o Oscura

**Causa:**
- Densidad de impresión incorrecta
- Papel térmico de baja calidad

**Solución:**
- Ajustar densidad en configuración de impresora
- Probar con papel de mejor calidad
- Limpiar cabezal térmico

---

## 📋 Casos de Uso

### Caso 1: Ticket de Cocina Básico

**Contenido:**
- Número de pedido
- Tipo (Local/Delivery/Takeaway)
- Hora
- Lista de productos con cantidad
- Modificaciones/notas de cada producto
- Notas generales del pedido

**Imprime cuando:**
- Cliente confirma el pedido en POS

---

### Caso 2: Ticket con Prioridad

**Contenido adicional:**
- Indicador de urgencia (⚠️ URGENTE)
- Tiempo estimado de preparación
- Categoría destacada (DELIVERY - Domicilio)

**Imprime cuando:**
- Pedido marcado como urgente
- Cliente esperando en local

---

### Caso 3: Ticket de Modificación

**Contenido:**
- "MODIFICACIÓN - Pedido #0042"
- Solo cambios realizados
  - ❌ Producto cancelado
  - ➕ Producto agregado
  - 🔄 Producto modificado

**Imprime cuando:**
- Se modifica un pedido existente

---

### Caso 4: Ticket de Cancelación

**Contenido:**
- "❌ CANCELAR - Pedido #0042"
- Razón de cancelación
- Hora de cancelación

**Imprime cuando:**
- Se cancela un pedido

---

### Caso 5: Resumen de Turno (Cierre)

**Contenido:**
- Total pedidos del turno
- Productos más vendidos
- Tiempos promedio
- Estadísticas

**Imprime cuando:**
- Cierre de turno
- Fin del día

---

## 🎯 Recomendación Final

### Configuración Óptima para tu Lomitería

**Hardware:**
1. Impresora 58mm con conexión **USB** para estabilidad
2. Ubicar en cocina, cerca de la estación de preparación
3. Papel térmico de alta temperatura (resistente a cocina)

**Software:**
1. **Servidor de impresión local** (Node.js + Express)
   - Corre en una PC/laptop en cocina
   - API HTTP simple en puerto 3001
   - Librería: node-escpos

2. **Integración con Next.js POS**
   - Endpoint: `POST http://localhost:3001/print`
   - Enviar datos del pedido en JSON
   - Mostrar confirmación al cajero

3. **Flujo:**
   ```
   Usuario confirma pedido (POS)
   → Guarda en Supabase
   → Llama a /api/print-kitchen
   → API Routes llama a servidor local
   → Imprime en cocina
   → Feedback al usuario
   ```

**Backup:**
- Pantalla KDS (que ya tienes) como respaldo
- Opción de re-imprimir ticket manualmente
- Log de todos los tickets en Supabase

---

## 📖 Recursos Adicionales

### Documentación Técnica

- **ESC/POS Command Reference**:
  - https://reference.epson-biz.com/modules/ref_escpos/

- **ESC/POS Wikipedia**:
  - https://en.wikipedia.org/wiki/ESC/P

### Videos Tutoriales

- "How to Print Receipt with Thermal Printer" (YouTube)
- "ESC/POS Programming Tutorial" (YouTube)

### Comunidades

- Stack Overflow: Tag [escpos]
- Reddit: r/restaurantowners, r/node

### Proveedores de Papel

- Buscar "papel térmico 58mm alta temperatura"
- Rollos de 30-50 metros
- Grosor recomendado: 80gsm

---

## ✅ Checklist de Implementación

### Fase de Investigación
- [ ] Identificar modelo exacto de impresora
- [ ] Verificar tipo de conexión (USB/BT/WiFi)
- [ ] Descargar manual técnico del fabricante
- [ ] Confirmar soporte de ESC/POS
- [ ] Verificar comandos soportados

### Fase de Setup
- [ ] Conectar impresora físicamente
- [ ] Instalar drivers (si requiere)
- [ ] Hacer impresión de prueba (botón físico)
- [ ] Configurar IP estática (si es WiFi)

### Fase de Desarrollo
- [ ] Crear proyecto de print server
- [ ] Instalar dependencias (node-escpos, express)
- [ ] Implementar endpoint /print
- [ ] Crear función de formateo de ticket
- [ ] Probar con datos de prueba
- [ ] Manejar errores comunes

### Fase de Integración
- [ ] Crear servicio en frontend (printerService.ts)
- [ ] Modificar flujo de confirmación de pedido
- [ ] Agregar configuración de impresora
- [ ] Implementar feedback visual
- [ ] Agregar opción de re-imprimir

### Fase de Testing
- [ ] Probar con pedido simple
- [ ] Probar con pedido complejo (muchos items)
- [ ] Probar con nombres largos
- [ ] Probar con caracteres especiales (ñ, á, etc.)
- [ ] Probar con impresora desconectada
- [ ] Probar reconexión

### Fase de Producción
- [ ] Instalar en ambiente real (cocina)
- [ ] Capacitar al personal
- [ ] Documentar proceso
- [ ] Configurar papel térmico adecuado
- [ ] Establecer rutina de mantenimiento

---

## 🚀 Próximos Pasos

1. **Definir modelo de impresora**: Identificar el modelo exacto que tienes o comprarás

2. **Elegir estrategia**: Según tu setup, decidir entre:
   - Servidor local (más simple)
   - Electron (más completo)
   - Red directa (más escalable)

3. **Desarrollar MVP**: 
   - Ticket básico con datos esenciales
   - Impresión manual desde interfaz de prueba
   - Validar formato y legibilidad

4. **Integrar con POS**:
   - Automatizar impresión al confirmar pedido
   - Agregar manejo de errores
   - Implementar re-impresión

5. **Optimizar**:
   - Ajustar diseño de ticket
   - Mejorar velocidad
   - Agregar funciones avanzadas (QR, logos, etc.)

---

## 📞 Contacto y Soporte

Si tienes preguntas sobre:
- Modelo específico de impresora
- Problemas técnicos
- Recomendaciones de hardware

Consulta:
- Manual del fabricante de tu impresora
- Foros técnicos especializados
- Proveedores locales de equipos POS

---

**Documento creado para**: POS Lomitería  
**Versión**: 1.0  
**Fecha**: Noviembre 2024  
**Autor**: Equipo de Desarrollo

---

¡Buena suerte con la implementación de tu sistema de impresión! 🎉

