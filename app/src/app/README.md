# app/src/app/ · Núcleo de la aplicación

## Propósito
Reunir el router, los providers globales, el layout protegido y el sistema de
tema. Nada de negocio vive aquí.

## Contenido
| Archivo | Rol |
|---|---|
| `router.tsx` | Árbol de rutas de TanStack Router (código, sin codegen) |
| `providers.tsx` | QueryClient, tema, sesión, router y toasts |
| `AppShell.tsx` | Guard de sesión/consentimiento y layout responsive |
| `tema.tsx` | Tema claro/oscuro persistido |
| `index.css` / `tema.css` | Tailwind v4 y tokens institucionales |

## Cómo se usa
`main.tsx` monta `<Providers />`. Las rutas protegidas cuelgan de la ruta
pathless `protegida`, cuyo componente es `AppShell`. Las rutas públicas son
`/login`, `/auth/*` y `/verificar/:token`.

## Convenciones
- Rutas en español, en minúsculas y con guiones.
- La URL siempre representa el estado (lista → detalle).
- Los guards visuales no reemplazan a RLS.

## Relacionado con
`docs/ux/guia-de-diseno.md`, `app/src/lib/permisos.ts`.
