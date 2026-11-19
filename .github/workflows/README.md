# GitHub Actions

## Propósito
Automatizar la calidad y el despliegue sin depender de un equipo local
configurado.

## Contenido
| Workflow | Cuándo | Qué hace |
|---|---|---|
| `ci.yml` | Push y pull request | Typecheck, lint, Vitest, build, `supabase db lint` y pgTAP |
| `deploy-vercel.yml` | Push a `main` o manual | Build con variables de Supabase y despliegue a Vercel |
| `deploy.yml` | Manual | Despliegue alternativo a Cloudflare Pages |

## Cómo se usa
- **CI**: funciona sin configuración adicional.
- **Vercel**: configurar en el repositorio (Settings → Secrets and variables →
  Actions):
  - `VERCEL_TOKEN` (Vercel → Account Settings → Tokens)
  - `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` (Vercel → Project → Settings → General)
  - `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto de demo
- **Cloudflare**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` y la variable
  `CLOUDFLARE_PROJECT_NAME`.
- **Supabase en CI**: el job de base de datos levanta contenedores con la CLI;
  necesita Docker en el runner (lo provee GitHub).

## Convenciones
- Nunca se guardan claves en el repositorio: solo en *Secrets*.
- Un workflow falla el despliegue si falla el build.
- Los despliegues de producción son desde `main`.

## Relacionado con
`docs/operacion/demo-vercel.md`, `docs/operacion/cloudflare-pages.md`.
