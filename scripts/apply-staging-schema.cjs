/**
 * Aplica los SQL listados en database/staging_schema_order.txt al Postgres del proyecto staging.
 * Requisitos: cliente psql en PATH (PostgreSQL) y DATABASE_URL con la URI del proyecto Supabase
 * (Settings → Database → Connection string → URI, modo Session o Transaction).
 */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const orderFile = path.join(root, 'database', 'staging_schema_order.txt')

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL
if (!databaseUrl || databaseUrl.trim() === '') {
  console.error(
    'Definí DATABASE_URL (o DIRECT_URL) con la cadena del proyecto Supabase staging antes de ejecutar.'
  )
  process.exit(1)
}

const raw = fs.readFileSync(orderFile, 'utf8')
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

let failed = false
for (const rel of lines) {
  const filePath = path.join(root, rel.replace(/\//g, path.sep))
  if (!fs.existsSync(filePath)) {
    console.error(`Archivo no encontrado: ${rel}`)
    failed = true
    break
  }
  console.log(`→ ${rel}`)
  const r = spawnSync(
    'psql',
    [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', filePath],
    { stdio: 'inherit', env: process.env }
  )
  if (r.error) {
    console.error(r.error.message)
    console.error('¿Tenés psql instalado y en el PATH?')
    failed = true
    break
  }
  if (r.status !== 0) {
    failed = true
    break
  }
}

if (failed) process.exit(1)
console.log('Listo: esquema aplicado en la base indicada por DATABASE_URL.')
