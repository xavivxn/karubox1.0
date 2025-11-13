// Exportar todas las funciones de base de datos desde un solo lugar
// Esto facilita los imports en los componentes

// Temporalmente comentado para evitar errores de compilación
// export * from './productos'
// export * from './categorias'
// export * from './clientes'
// export * from './pedidos'
// export * from './puntos'
// export * from './promociones'

// Re-exportar el cliente de Supabase
export { supabase, testConnection } from '../supabase'

