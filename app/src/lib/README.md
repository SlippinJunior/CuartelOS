# lib/ · Utilidades del cliente

## Propósito
Concentrar las funciones transversales: cliente de Supabase, permisos, formato
chileno, manejo de errores, normalización de texto y cola offline.

## Contenido
| Archivo | Rol |
|---|---|
| `supabase.ts` | Cliente único y accesos `db.<esquema>` |
| `permisos.ts` | Mapa rol → secciones y barra inferior |
| `formato.ts` | CLP, fechas dd-mm-aaaa, porcentajes, semáforo |
| `errores.ts` | Mensajes humanos para errores de PostgREST |
| `texto.ts` | Normalización sin tildes para búsquedas locales |
| `utils.ts` | `cn` para clases |
| `offline/` | IndexedDB y cola del pase de lista |

## Cómo se usa
```ts
import { db } from "@/lib/supabase";
const { data } = await db.personal.from("persona").select("*");
```

## Convenciones
- No usar la clave de servicio en el navegador.
- La seguridad real la impone RLS; `permisos.ts` solo ordena la interfaz.
- Toda fecha de Postgres `YYYY-MM-DD` se formatea sin zona horaria.

## Relacionado con
`docs/ux/guia-de-diseno.md`, `docs/arquitectura/seguridad.md`.
