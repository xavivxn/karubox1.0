import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export default async function PublicCartaQrPage({ params }: Props) {
  const { tenantSlug } = await params
  const slug = decodeURIComponent(tenantSlug || '').trim()
  const slugLower = slug.toLowerCase()
  if (!slug) notFound()

  const sessionClient = await createClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  let tenant: Tenant | null = null

  // 1) Camino principal: resolver tenant usando sesión actual (flujo desde POS)
  if (user) {
    const { data: sessionTenant } = await sessionClient
      .from('usuarios')
      .select('tenants!inner(id,nombre,slug,logo_url,direccion,telefono,activo,is_deleted)')
      .eq('auth_user_id', user.id)
      .eq('is_deleted', false)
      .eq('tenants.slug', slugLower)
      .eq('tenants.activo', true)
      .eq('tenants.is_deleted', false)
      .maybeSingle()

    tenant = (sessionTenant?.tenants ?? null) as Tenant | null
  }

  // 2) Fallback: intentar con service-role para acceso público sin login
  if (!tenant) {
    try {
      const adminClient = createAdminClient()
      const { data: tenantActive } = await adminClient
        .from('tenants')
        .select('id,nombre,slug,logo_url,direccion,telefono')
        .ilike('slug', slugLower)
        .eq('activo', true)
        .eq('is_deleted', false)
        .maybeSingle()
      tenant = (tenantActive ?? null) as Tenant | null
    } catch {
      tenant = null
    }
  }

  if (!tenant) notFound()

  const supabase = user ? sessionClient : createAdminClient()

  const [catRes, prodRes] = await Promise.all([
    supabase
      .from('categorias')
      .select('id,nombre,orden')
      .eq('tenant_id', tenant.id)
      .eq('activa', true)
      .order('orden')
      .order('nombre'),
    supabase
      .from('productos')
      .select('id,nombre,descripcion,precio,categoria_id,imagen_url')
      .eq('tenant_id', tenant.id)
      .eq('disponible', true)
      .neq('is_deleted', true)
      .order('nombre'),
  ])

  const categories = ((catRes.data ?? []) as Array<{ id: string; nombre: string }>).map(
    (c) =>
      ({
        id: c.id,
        nombre: c.nombre,
      }) satisfies CartaQrCategoryData
  )

  const products = (prodRes.data ?? []) as CartaQrProductData[]
  const tenantData = tenant as CartaQrTenantData

  return (
    <CartaQrPublicView
      tenant={tenantData}
      categories={categories}
      products={products}
    />
  )
}

