# Prompt para Gemini / Grok — investigación de mercado (pricing KarúBox)

Copiá todo el bloque de abajo en un solo mensaje. Si el modelo tiene modo “búsqueda en internet” o “Grounding”, activalo.

---

```
Sos un analista de mercado especializado en software B2B para restaurantes y retail gastronómico en Latinoamérica.

OBJETIVO
Recopilar información **actualizada y verificable** (con fuentes o enlaces cuando existan) sobre cómo se **cobran** los sistemas tipo POS / gestión para restaurantes: precios públicos, modelos de facturación y prácticas comerciales. La info servirá como **referencia de mercado** para dimensionar el precio mensual de un SaaS llamado KarúBox (POS en la nube, multi-local, impresión remota, inventario, fidelidad, etc.) orientado a lomiterías, pizzerías y hamburgueserías en Paraguay y la región.

QUÉ BUSCÁS (respondé por secciones)
1) **Rangos de precio** que encuentres en sitios oficiales o listas de precios: mensual/anual, moneda (USD, moneda local), y si el precio es “por local”, “por caja”, “por usuario” o mixto.
2) **Fee de implementación, onboarding o setup** cuando aparezca.
3) **Límites típicos** del plan base: usuarios, sucursales, dispositivos.
4) **Competidores o alternativas** que aparezcan en comparativas recientes (solo como benchmark, no hace falta evaluar calidad del producto).
5) Si hay datos sobre **Paraguay** o **Mercosur**, destacarlos aparte; si no hay, decilo explícitamente.
6) **Tendencias 2024–2026** mencionadas en fuentes serias (informes, blogs de industria, notas de prensa de vendors).

FORMATO DE SALIDA
- Resumen ejecutivo de 5–8 líneas.
- Tabla o lista con: proveedor/producto (si aplica), modelo de cobro, rango o cifra, moneda, fuente (URL o nombre del documento).
- Sección “Limitaciones”: qué no pudiste encontrar o qué quedó dudoso.
- Idioma: **español**.

REGLAS
- No inventes precios: si no hay dato público, decí “no encontrado”.
- Priorizá fuentes primarias (sitio del proveedor, pricing page) sobre foros anónimos.
- Si las cifras varían mucho entre países, separá por país o región.

Al final, sugerí 3–5 **preguntas concretas** que el fundador de un SaaS gastronómico debería responder con números internos (costos, soporte, CAC) para cruzar esta info de mercado con su propio modelo económico.
```

---

## Uso rápido

1. Pegá el bloque en **Gemini** (con búsqueda activada si existe).
2. Repetí en **Grok** con búsqueda/X si aplica.
3. Unificá resultados y pasá el resumen + tablas al chat donde trabajás el pricing con el **prompt experto** (`docs/karubox-pricing-expert-prompt.md`).
