import { NextRequest, NextResponse } from 'next/server'

/**
 * ============================================
 * API ROUTE DEPRECADO - NO USAR
 * ============================================
 * 
 * Este endpoint ha sido DEPRECADO y reemplazado por el sistema
 * de impresión automática vía Supabase Realtime.
 * 
 * NUEVO FLUJO (Realtime):
 * 1. Frontend guarda pedido con estado_pedido = 'FACT'
 * 2. Agente escucha cambios en Supabase Realtime
 * 3. Agente detecta e imprime automáticamente
 * 
 * VENTAJAS:
 * - No requiere túneles ni configuración de red
 * - Más robusto (si el agente se cae, procesa pedidos pendientes)
 * - Multitenant (cada agente filtra por tenant_id)
 * - Sin problemas de CORS
 * 
 * CONFIGURACIÓN DEL AGENTE:
 * - ENABLE_SUPABASE_LISTENER=true
 * - SUPABASE_URL=https://zzyjmcjrjitfudginsvin.supabase.co
 * - SUPABASE_ANON_KEY=sb_publishable_TmlhcKn2AhfmtQBRkTuOxw_1N6sn0Eh
 * 
 * Ver: database/01_impresion_automatica.sql
 * 
 * ============================================
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Este endpoint ha sido deprecado. El sistema ahora usa Supabase Realtime para impresión automática.',
      deprecated: true,
      message: 'El agente debe estar configurado con ENABLE_SUPABASE_LISTENER=true para escuchar cambios en la base de datos.',
      documentation: 'Ver database/01_impresion_automatica.sql para más información'
    },
    {
      status: 410, // 410 Gone - El recurso ya no está disponible
      headers: {
        'X-Deprecated': 'true',
        'X-Deprecation-Date': '2026-01-04',
        'X-Migration-Guide': 'Use Supabase Realtime instead of HTTP requests'
      }
    }
  )
}
