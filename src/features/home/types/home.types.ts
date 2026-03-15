export interface DashboardCard {
  title: string
  description: string
  href: string
  icon: 'pos' | 'admin' | 'pedidos' | 'clientes' | 'cocina'
  color: 'orange' | 'blue' | 'green' | 'purple' | 'red'
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
