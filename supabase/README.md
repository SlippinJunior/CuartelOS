# supabase/ · Base de datos y funciones

## Propósito
Contener todo lo que corre en Supabase: migraciones versionadas, seed
ficticio, pruebas pgTAP, Edge Functions y configuración local.

## Contenido
| Ruta | Qué hay |
|---|---|
| `config.toml` | Puertos, esquemas expuestos y Auth sin registro abierto |
| `migrations/` | 25 migraciones planas, ordenadas por dominio |
| `seed.sql` | Datos ficticios de desarrollo (se regenera con un script) |
| `tests/` | pgTAP: RLS, reglas de negocio, folios, consentimiento y alertas |
| `functions/` | `invitar-usuario`, `emitir-documento`, `emitir-acta`, `orden-capitania`, `notificar-guardias` y `emitir-guardia-pdf` (Deno) |

## Cómo se usa
```bash
pnpm supabase start
pnpm supabase db reset     # migraciones + seed
pnpm supabase db lint
pnpm supabase test db
supabase functions serve   # en otra terminal
```
La conexión local es `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

## Convenciones
- La carpeta `migrations/` es **plana**: no se permiten subcarpetas. El prefijo
  numérico indica el orden y el sufijo, el dominio.
- Un esquema por dominio; `seguridad` no se expone a la API.
- Toda tabla y columna no obvia lleva `comment on`, para generar el diccionario.
- RLS obligatorio en toda tabla de negocio, con pruebas pgTAP.
- Nunca se versionan datos reales.

## Relacionado con
`docs/datos/`, `docs/operacion/`, `supabase/migrations/README.md`.
