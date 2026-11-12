# Instalación local

## Requisitos
- Node 22+, pnpm 10+
- Docker en ejecución (Supabase levanta contenedores)
- Supabase CLI (`pnpm install` ya lo instala en el workspace)
- Git

## Paso a paso
```bash
git clone <repo> && cd ProyectoBomba
pnpm install
pnpm supabase start
pnpm supabase db reset
cp app/.env.example app/.env
```

`supabase start` imprime `API URL`, `anon key` y `service_role key`. Copia la
URL y la **anon key** (el JWT que empieza con `eyJ...`) en `app/.env`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> No uses la `PUBLISHABLE_KEY` (`sb_publishable_...`) en esta variable: el
> cliente actual la envía como JWT y PostgREST rechaza las llamadas anónimas
> con `Expected 3 parts in JWT`. La verificación pública y otras RPC sin sesión
> dejarían de funcionar.

Luego:
```bash
pnpm dev
```
Abre `http://localhost:5173` y prueba con `director@demo.local` / `demo1234`.

## Base de datos
- `pnpm db:reset` aplica las 21 migraciones y el seed ficticio.
- `pnpm db:lint` revisa seguridad y rendimiento.
- `pnpm db:test` ejecuta pgTAP (requiere el seed).
- La base local queda en `127.0.0.1:54322`; Studio en `:54323`; Inbucket en
  `:54324`.

## Edge Functions
```bash
cp supabase/functions/.env.example supabase/functions/.env
supabase functions serve --env-file supabase/functions/.env
```
El archivo local trae Mailpit y la URL del frontend:
```env
SITE_URL=http://localhost:5173
SMTP_HOST=inbucket
SMTP_PORT=1025
SMTP_FROM=Segunda Compania <no-reply@demo.local>
```
`SUPABASE_SERVICE_ROLE_KEY` la inyecta Supabase; no la pongas en el archivo.
Prueba la emisión P3, el PDF de un acta y una orden de capitanía. Los correos de
las órdenes se ven en Mailpit (`http://127.0.0.1:54324`).

## Pruebas completas
```bash
pnpm -C app typecheck
pnpm -C app lint
pnpm -C app test
pnpm -C app build
pnpm supabase db lint
pnpm supabase test db
E2E=1 pnpm -C app e2e
```
Playwright corre en 390×844 y 1440×900. Requiere Supabase local y `E2E=1`.

## Importación del legado
```bash
# copia el seed real (nunca a git)
cp /ruta/seed.sql data/privado/legado/seed_original.sql
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  bash scripts/importar-legado/importar.sh
```
Resultado esperado del seed entregado: 56 personas, 135 listas, 7.383
asistencias, 246 movimientos. Revisa `nucleo.staging_importacion`.

## Verificación manual
1. Recorre con cada usuario demo; el menú debe mostrar solo lo que corresponde.
2. Pasa una lista en modo avión y reconecta.
3. Emite tu hoja de vida y abre el QR.
4. Anula el documento y verifica que pasa a inválido.
5. Revisa que un bombero no vea Tesorería ni datos ajenos.
6. Prueba en el celular por la red local (`http://<tu-ip>:5173`).

## Problemas comunes
| Síntoma | Causa probable | Solución |
|---|---|---|
| `failed to connect to the docker API at unix:///var/run/docker.sock` | El daemon de Docker no está corriendo | `sudo systemctl enable --now docker` y luego `docker info` |
| `permission denied ... /var/run/docker.sock` | El usuario no está en el grupo `docker` | `sudo usermod -aG docker $USER` y vuelve a iniciar sesión |
| "Falta configurar VITE_SUPABASE_URL" | No existe `app/.env` | Copia `.env.example` |
| Login falla con 400 | Seed no aplicado | `pnpm db:reset` |
| Migración falla por pg_cron | Entorno sin extensión | La migración lo omite |
| Emisión falla | Edge Function no servida | `supabase functions serve` |
| PDF sin verificar | Bucket no creado | Revisa migración de storage |
| `[inbucket] is deprecated` | Configuración antigua | Ya se usa `[local_smtp]` en `supabase/config.toml` |

### Docker en Arch / CachyOS
Docker suele venir instalado pero con el servicio desactivado. La primera vez:
```bash
sudo systemctl enable --now docker
docker info
```
Si `docker info` funciona, `pnpm supabase start` ya puede levantar los
contenedores. El usuario debe pertenecer al grupo `docker` (en esta máquina ya
pertenece). Para comprobar todo antes:
```bash
bash scripts/dev/verificar-entorno.sh
```
El mensaje `NotFound: FileSystem.readFile (~/.supabase/profile)` que aparece con
`--debug` es del perfil de telemetría del CLI y no impide el arranque.

## Relacionado con
`docs/operacion/supabase-nube.md`, `README.md`.
