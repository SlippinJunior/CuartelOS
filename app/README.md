# app/ · Frontend

## Propósito
SPA estática en React 19 + Vite + TypeScript estricto, pensada primero para el
celular y desplegable en Cloudflare Pages. Consume Supabase directamente
(PostgREST + RPC) con la sesión del usuario; nunca usa la clave de servicio.

## Contenido
| Ruta | Qué hay |
|---|---|
| `src/app/` | Router, providers, AppShell, tema y tokens |
| `src/components/ui/` | Primitivas estilo shadcn/ui |
| `src/components/layout/` | Sidebar, barra inferior, hoja "Más", cabecera |
| `src/components/common/` | Lista adaptable, estados vacíos, badges, confirmaciones |
| `src/features/` | Un módulo = una carpeta |
| `src/lib/` | Supabase, permisos, formato es-CL, cola offline |
| `src/types/` | Tipos de la base y del dominio |
| `e2e/` | Playwright (390×844 y 1440×900) |

## Cómo se usa
```bash
pnpm -C app dev
pnpm -C app typecheck
pnpm -C app lint
pnpm -C app test
pnpm -C app build
E2E=1 pnpm -C app e2e
```
Copia `.env.example` a `.env` y completa `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY`. Sin esas variables la pantalla de login avisa y no se
puede iniciar sesión.

## Convenciones
- Componentes en PascalCase, archivos de páginas con sufijo `Page`.
- Toda llamada a datos pasa por `db.<esquema>` de `lib/supabase.ts`.
- Los permisos se leen de `lib/permisos.ts`; RLS sigue siendo la autoridad final.
- Montos con `formatearCLP`, fechas con `formatearFecha` (dd-mm-aaaa).
- Objetivos táctiles de 44 px o más (`min-h-11`).
- Textos en español de Chile, voz cercana y sin jerga técnica innecesaria.

## Relacionado con
`docs/ux/`, `supabase/`, `docs/modulos/`.
