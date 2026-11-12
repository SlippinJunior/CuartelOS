# scripts/ · Automatizaciones

## Propósito
Scripts reproducibles para importar el legado, generar el seed ficticio y
preparar datos de desarrollo. No contienen datos reales.

## Contenido
| Carpeta | Qué hace |
|---|---|
| `importar-legado/` | Carga el esquema antiguo, transforma y exporta `data/privado/seed_real.sql` |
| `generar-seed-ficticio/` | Genera `supabase/seed.sql` con 30 bomberos, listas, unidades y tesorería inventadas |
| `dev/` | Comprueba Node, pnpm, Docker y puertos antes de `supabase start` |

## Cómo se usa
```bash
pnpm seed:ficticio          # regenera supabase/seed.sql
pnpm importar:legado        # requiere data/privado/legado/seed_original.sql
pnpm doctor                 # verifica Docker y el entorno local
```

## Convenciones
- Los scripts son idempotentes dentro de lo posible y fallan con mensaje claro
  si falta un archivo o una herramienta.
- No escriben fuera de `data/privado/`, `supabase/seed.sql` o un esquema
  temporal.
- Todo lo dudoso de una importación va a `nucleo.staging_importacion`; nunca se
  inventa un dato.

## Relacionado con
`docs/operacion/instalacion-local.md`, `docs/integraciones/importacion.md`.
