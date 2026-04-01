import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCartaPublicSupabaseClient } from '@/lib/supabase/cartaPublic'
import CartaQrPublicView, {
  type CartaQrCategoryData,
  type CartaQrProductData,
  type CartaQrTenantData,
} from '@/features/carta-qr/view/CartaQrPublicView'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

type Tenant = {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  direccion: string | null
  telefono: string | null
}

/**
 * Carta pública: primero RPC con clave anon (no requiere service_role en el servidor).
 * Si la RPC no existe aún, fallback con createAdminClient (migración 22_carta_public_snapshot_rpc.sql).
 */
export default async function PublicCartaQrPage({ params }: Props) {
  const { tenantSlug } = await params
  const slug = decodeURIComponent(tenantSlug || '').trim()
  const slugLower = slug.toLowerCase()
  if (!slug) notFound()

  let tenantData: CartaQrTenantData | null = null
  let categories: CartaQrCategoryData[] = []
  let products: CartaQrProductData[] = []

  const publicClient = createCartaPublicSupabaseClient()
  const { data: rpcData, error: rpcError } = await publicClient.rpc('get_carta_public_snapshot', {
    p_slug: slugLower,
  })

  if (!rpcError && rpcData && typeof rpcData === 'object' && rpcData !== null && 'tenant' in rpcData) {
    const snap = rpcData as {
      tenant: CartaQrTenantData
      categories: CartaQrCategoryData[]
      products: CartaQrProductData[]
    }
    tenantData = snap.tenant
    categories = snap.categories ?? []
    products = snap.products ?? []
  } else {
    if (rpcError) {
      console.warn('[carta] RPC get_carta_public_snapshot:', rpcError.message, '→ fallback admin')
    }

    try {
      const adminClient = createAdminClient()
      const { data: row, error: tenantError } = await adminClient
        .from('tenants')
        .select('id,nombre,slug,logo_url,direccion,telefono')
        .ilike('slug', slugLower)
        .eq('activo', true)
        .eq('is_deleted', false)
        .maybeSingle()

      if (tenantError) {
        console.error('[carta] Error al buscar tenant (admin):', slugLower, tenantError.message)
      }

      const tenant = (row ?? null) as Tenant | null
      if (!tenant) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[carta] 404: sin tenant o ejecutá en Supabase: database/22_carta_public_snapshot_rpc.sql'
          )
        }
        notFound()
      }

      const [catRes, prodRes] = await Promise.all([
        adminClient
          .from('categorias')
          .select('id,nombre,orden')
          .eq('tenant_id', tenant.id)
          .eq('activa', true)
          .order('orden')
          .order('nombre'),
        adminClient
          .from('productos')
          .select('id,nombre,descripcion,precio,categoria_id,imagen_url')
          .eq('tenant_id', tenant.id)
          .eq('disponible', true)
          .neq('is_deleted', true)
          .order('nombre'),
      ])

      categories = ((catRes.data ?? []) as Array<{ id: string; nombre: string }>).map((c) => ({
        id: c.id,
        nombre: c.nombre,
      }))
      products = (prodRes.data ?? []) as CartaQrProductData[]
      tenantData = tenant as CartaQrTenantData
    } catch (e) {
      console.error('[carta] fallback admin:', e)
      notFound()
    }
  }

  if (!tenantData) notFound()

  return (
    <CartaQrPublicView tenant={tenantData} categories={categories} products={products} />
  )
}
