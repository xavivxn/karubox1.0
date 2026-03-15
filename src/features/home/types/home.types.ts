export interface DashboardCard {
  title: string
  description: string
  href: string
  icon: 'pos' | 'admin' | 'pedidos'
  color: 'orange' | 'blue' | 'green'
}

export interface Feature {
  icon: string
  title: string
  description: string
}

export interface TenantInfo {
  nombre: string
  usuario?: string
}
