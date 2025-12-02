# 🔧 Guía Rápida: Configurar Impresora en el Agente

## ⚠️ Problema Común

Si ves este error al intentar imprimir:
```
"Impresora atlas-burger-printer-1 no encontrada. Configúrala primero usando POST /api/printer/configure"
```

**Significa que:** El agente está funcionando, pero la impresora física no está configurada.

---

## ✅ Solución: Configurar la Impresora

### Paso 1: Encontrar la Ruta de la Impresora

#### En Windows:
1. Abre **"Dispositivos e impresoras"** (Panel de Control)
2. Busca tu impresora Epson TM-T20
3. Click derecho → **"Propiedades de impresora"**
4. Ve a la pestaña **"Puertos"**
5. Busca el puerto (ej: `COM3`, `COM4`, `USB001`)

#### En Linux:
```bash
# Ver impresoras disponibles
lpstat -p

# O buscar dispositivos USB
lsusb
```

### Paso 2: Configurar en el Agente

**Endpoint:** `POST http://192.168.100.2:3001/api/printer/configure`

**Body:**
```json
{
  "printerId": "atlas-burger-printer-1",
  "name": "Impresora Térmica Cocina",
  "connectionType": "usb",
  "path": "COM3"
}
```

**Ejemplo con PowerShell:**
```powershell
$body = @{
    printerId = "atlas-burger-printer-1"
    name = "Impresora Térmica Cocina"
    connectionType = "usb"
    path = "COM3"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.100.2:3001/api/printer/configure" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Ejemplo con curl:**
```bash
curl -X POST http://192.168.100.2:3001/api/printer/configure \
  -H "Content-Type: application/json" \
  -d '{
    "printerId": "atlas-burger-printer-1",
    "name": "Impresora Térmica Cocina",
    "connectionType": "usb",
    "path": "COM3"
  }'
```

### Paso 3: Verificar Configuración

El agente debería responder con algo como:
```json
{
  "success": true,
  "message": "Impresora configurada correctamente",
  "printer": {
    "printerId": "atlas-burger-printer-1",
    "name": "Impresora Térmica Cocina",
    "path": "COM3"
  }
}
```

### Paso 4: Probar Impresión

Ahora intenta confirmar un pedido desde la app web. Debería imprimir correctamente.

---

## 📋 Checklist

- [ ] Impresora Epson TM-T20 conectada y encendida
- [ ] Ruta de la impresora identificada (COM3, COM4, etc.)
- [ ] Agente corriendo en `http://192.168.100.2:3001`
- [ ] Configuración enviada usando `/api/printer/configure`
- [ ] `printerId` coincide con el de la BD: `"atlas-burger-printer-1"`
- [ ] Respuesta exitosa del agente
- [ ] Prueba de impresión desde la app web

---

## 🔍 Troubleshooting

### Error: "Puerto no disponible"
- Verifica que la impresora esté encendida
- Verifica que no haya otro programa usando la impresora
- Prueba con otro puerto COM

### Error: "Impresora no responde"
- Verifica la conexión USB
- Reinicia la impresora
- Verifica los drivers de la impresora

### Error: "printerId no coincide"
- Verifica en la BD: `SELECT printer_id FROM printer_config WHERE lomiteria_id = '...'`
- El `printerId` en la configuración debe ser **exactamente igual** al de la BD

---

## 📚 Referencias

- Ver `docs/INSTRUCCIONES_AGENTE_IMPRESION.md` para más detalles
- Ver `docs/ARQUITECTURA_IMPRESION.md` para el flujo completo


