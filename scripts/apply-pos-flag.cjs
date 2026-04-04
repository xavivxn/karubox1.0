const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

function w(rel, s) {
  fs.writeFileSync(path.join(root, rel), s, "utf8");
  console.log("w", rel);
}

w("database/24_categorias_mostrar_en_pos.sql", `-- Visibilidad POS/carta (idempotente).

ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS mostrar_en_pos BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.categorias.mostrar_en_pos IS
  'Si es true, la categoria aparece en el carrusel del POS y en la carta publica.';

UPDATE public.categorias
SET mostrar_en_pos = false
WHERE lower(trim(nombre)) IN ('salsas', 'insumos base');
`);

const posTypes = `export interface Categoria {
  id: string
  nombre: string
  orden: number
  /** false = no aparece en pestañas del POS (ni productos de esa categoria en el catalogo POS) */
  mostrar_en_pos?: boolean
}

export interface ComboItemDB {
  producto_id: string
  cantidad: number
  producto: { id: string; nombre: string; tiene_receta: boolean }
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria_id?: string
  disponible: boolean
  tiene_receta: boolean
  combo_items?: ComboItemDB[]
  /** Puntos bonus adicionales que el admin asigno a este producto (por unidad) */
  puntos_extra?: number
}

export interface FeedbackDetail {
  label: string
  value: string
}

export interface FeedbackState {
  type: 'success' | 'error'
  title: string
  message: string
  details?: FeedbackDetail[]
}

export type TipoPedido = 'delivery' | 'local' | 'para_llevar' | null
`;
w("src/features/pos/types/pos.types.ts", posTypes);

let posSvc = fs.readFileSync(path.join(root, "src/features/pos/services/posService.ts"), "utf8");
posSvc = posSvc.replace(
  ".select('id,nombre,orden')",
  ".select('id,nombre,orden,mostrar_en_pos')"
);
posSvc = posSvc.replace(
  "const categorias = (catRes.data || []) as Categoria[]",
  "const categorias = ((catRes.data || []) as Categoria[]).filter(\n      (c) => c.mostrar_en_pos !== false\n    )"
);
const oldLoadProd = `  async loadProductos(tenantId: string): Promise<Producto[]> {
    const supabase = createClient()
    const [prodRes, ventasMap] = await Promise.all([
      supabase
        .from('productos')
        .select('id,nombre,descripcion,precio,categoria_id,disponible,tiene_receta,puntos_extra')
        .eq('tenant_id', tenantId)
        .eq('disponible', true)
        .neq('is_deleted', true)
        .order('nombre'),
      loadVentasPorProducto(tenantId)
    ])
    if (prodRes.error) throw prodRes.error
    const productos = (prodRes.data || []) as Producto[]`;
const newLoadProd = `  async loadProductos(tenantId: string): Promise<Producto[]> {
    const supabase = createClient()
    const [prodRes, ventasMap, catVis] = await Promise.all([
      supabase
        .from('productos')
        .select('id,nombre,descripcion,precio,categoria_id,disponible,tiene_receta,puntos_extra')
        .eq('tenant_id', tenantId)
        .eq('disponible', true)
        .neq('is_deleted', true)
        .order('nombre'),
      loadVentasPorProducto(tenantId),
      supabase.from('categorias').select('id,mostrar_en_pos').eq('tenant_id', tenantId),
    ])
    if (prodRes.error) throw prodRes.error
    if (catVis.error) throw catVis.error
    const hiddenCatIds = new Set(
      (catVis.data || [])
        .filter((row) => row.mostrar_en_pos === false)
        .map((row) => row.id)
    )
    const productos = ((prodRes.data || []) as Producto[]).filter(
      (p) => !p.categoria_id || !hiddenCatIds.has(p.categoria_id)
    )`;
if (!posSvc.includes(oldLoadProd)) throw new Error("posService loadProductos block not found");
posSvc = posSvc.replace(oldLoadProd, newLoadProd);
w("src/features/pos/services/posService.ts", posSvc);

let supa = fs.readFileSync(path.join(root, "src/types/supabase.ts"), "utf8");
const oldCat = `      categorias: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          orden: number
          activa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          orden?: number
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          orden?: number
          activa?: boolean
          created_at?: string
          updated_at?: string
        }
      }`;
const newCat = `      categorias: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          orden: number
          activa: boolean
          mostrar_en_pos: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          orden?: number
          activa?: boolean
          mostrar_en_pos?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          orden?: number
          activa?: boolean
          mostrar_en_pos?: boolean
          created_at?: string
          updated_at?: string
        }
      }`;
if (!supa.includes("activa: boolean\n          created_at")) throw new Error("supabase categorias block mismatch");
supa = supa.replace(oldCat, newCat);
w("src/types/supabase.ts", supa);

const blockOld = `  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categorias IS 'Categorías de productos por tenant';

CREATE INDEX IF NOT EXISTS idx_categorias_tenant ON categorias(tenant_id);`;
const blockNew = `  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  mostrar_en_pos BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categorias IS 'Categorías de productos por tenant';
COMMENT ON COLUMN categorias.mostrar_en_pos IS 'Si false, oculta la categoría en POS/carta (ej. Salsas, Insumos base)';

CREATE INDEX IF NOT EXISTS idx_categorias_tenant ON categorias(tenant_id);`;
let schema = fs.readFileSync(path.join(root, "database/00_initial_schema.sql"), "utf8");
const count = (schema.match(/activa BOOLEAN DEFAULT true,\n  created_at TIMESTAMPTZ/g) || []).length;
if (count < 2) throw new Error("expected 2 categorias blocks in schema, got " + count);
schema = schema.split(blockOld).join(blockNew);
w("database/00_initial_schema.sql", schema);

let inv = fs.readFileSync(path.join(root, "src/features/admin/components/InventoryDrawer.tsx"), "utf8");
inv = inv.replace(
  `.insert({
        tenant_id: tenantId,
        nombre: INGREDIENT_CATEGORY_NAME,
        descripcion: 'Insumos críticos para recetas',
        orden: 99
      })`,
  `.insert({
        tenant_id: tenantId,
        nombre: INGREDIENT_CATEGORY_NAME,
        descripcion: 'Insumos críticos para recetas',
        orden: 99,
        activa: true,
        mostrar_en_pos: false,
      })`
);
w("src/features/admin/components/InventoryDrawer.tsx", inv);

let sal = fs.readFileSync(path.join(root, "src/features/admin/components/SalsasDrawer.tsx"), "utf8");
sal = sal.replace(
  `.insert({
        tenant_id: tenantId,
        nombre: SAUCES_CATEGORY_NAME,
        descripcion: 'Salsas por vasitos (extras)',
        orden: 98,
        activa: true,
      })`,
  `.insert({
        tenant_id: tenantId,
        nombre: SAUCES_CATEGORY_NAME,
        descripcion: 'Salsas por vasitos (extras)',
        orden: 98,
        activa: true,
        mostrar_en_pos: false,
      })`
);
w("src/features/admin/components/SalsasDrawer.tsx", sal);

let carta = fs.readFileSync(path.join(root, "database/22_carta_public_snapshot_rpc.sql"), "utf8");
carta = carta.replace(
  `      FROM public.categorias c
      WHERE c.tenant_id = tid AND c.activa = true`,
  `      FROM public.categorias c
      WHERE c.tenant_id = tid AND c.activa = true AND COALESCE(c.mostrar_en_pos, true) = true`
);
carta = carta.replace(
  `      FROM public.productos p
      WHERE p.tenant_id = tid
        AND p.disponible = true
        AND (p.is_deleted IS DISTINCT FROM true)`,
  `      FROM public.productos p
      WHERE p.tenant_id = tid
        AND p.disponible = true
        AND (p.is_deleted IS DISTINCT FROM true)
        AND (
          p.categoria_id IS NULL
          OR EXISTS (
            SELECT 1 FROM public.categorias cvis
            WHERE cvis.id = p.categoria_id
              AND cvis.tenant_id = tid
              AND COALESCE(cvis.mostrar_en_pos, true) = true
          )
        )`
);
w("database/22_carta_public_snapshot_rpc.sql", carta);

console.log("done schema, pos, supa, drawers, carta");
