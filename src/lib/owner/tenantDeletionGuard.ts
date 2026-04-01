/** Tenants que no deben poder borrarse desde la UI (alineado con listTenants / negocio). */
export const PROTECTED_TENANT_SLUGS = ['sistema', 'ardentium'] as const
export const PROTECTED_TENANT_IDS = ['00000000-0000-0000-0000-000000000001'] as const

export function canPurgeTenant(tenant: { id: string; slug: string }): boolean {
  if ((PROTECTED_TENANT_IDS as readonly string[]).includes(tenant.id)) return false
  if ((PROTECTED_TENANT_SLUGS as readonly string[]).includes(tenant.slug)) return false
  return true
}
