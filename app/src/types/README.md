# types/ · Tipos

## Propósito
Separar los tipos generados de la base de los tipos de negocio que usa la
interfaz.

## Contenido
| Archivo | Rol |
|---|---|
| `database.ts` | Forma que espera `createClient<Database>` |
| `tipos.ts` | Persona, Lista, Asistencia, Unidad, Movimiento, Perfil, etc. |

## Cómo se usa
```ts
import type { Persona } from "@/types/tipos";
```
En un proyecto con Supabase CLI disponible:
```bash
supabase gen types typescript --local > app/src/types/database.ts
```
El archivo actual mantiene la forma esperada y se puede reemplazar sin tocar las
features.

## Convenciones
- No duplicar tipos de fila en las páginas.
- Los enums se escriben como uniones de strings.
- Los campos opcionales de relación (`cargo?`, `articulo?`) se marcan con `?`.

## Relacionado con
`supabase/migrations/`, `app/src/lib/supabase.ts`.
