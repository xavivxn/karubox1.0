# Validacion de alta tenant + printer_config

## Objetivo
Verificar que al crear una nueva lomiteria:
- se cree la fila en `tenants`,
- se cree (o recupere por reintento) la fila en `printer_config`,
- y, si no se puede persistir `printer_config`, el owner vea advertencia accionable.

## Caso A: alta normal
1. Iniciar sesion como `owner`.
2. Ir a `Owner > Nueva lomiteria`.
3. Completar datos del negocio y del administrador.
4. Confirmar creacion.
5. Validar en UI:
   - el flujo termina en pantalla "Listo",
   - no aparece alerta de impresora pendiente.
6. Validar en base de datos:
   - existe tenant nuevo en `tenants`,
   - existe fila en `printer_config` con:
     - `lomiteria_id = <tenant.id>`,
     - `printer_id = <slug>-printer-1`,
     - `agent_ip = 'localhost'`,
     - `agent_port = 3001`.

## Caso B: fallo simulado en insercion de printer_config
1. Forzar temporalmente un fallo de `printer_config` (por ejemplo, quitar permiso de `INSERT` al rol usado por service role en entorno de prueba o forzar un valor invalido solo en ambiente local).
2. Crear una nueva lomiteria desde el mismo flujo.
3. Validar en UI:
   - la creacion de tenant finaliza,
   - aparece alerta "configuracion de impresora pendiente",
   - el link lleva al detalle del tenant para correccion manual.
4. Validar logs del servidor:
   - existe log de error de `insert` con `tenantId`, `slug`, `code`, `message`,
   - se ejecuta reintento por `upsert`.
5. Si ambos intentos fallan:
   - confirmar que no hay fila en `printer_config`,
   - confirmar que el warning visible explica accion manual.

## Consulta SQL de apoyo
```sql
select
  t.id as tenant_id,
  t.nombre,
  t.slug,
  pc.printer_id,
  pc.agent_ip,
  pc.agent_port,
  pc.updated_at
from tenants t
left join printer_config pc on pc.lomiteria_id = t.id
where t.slug = :tenant_slug;
```

## Criterio de aceptacion
- Ninguna alta de tenant queda silenciosamente sin señalizacion cuando falla `printer_config`.
- Si hay recuperacion automatica, el sistema deja traza en logs.
- Si no hay recuperacion, el owner recibe advertencia clara y accionable.
