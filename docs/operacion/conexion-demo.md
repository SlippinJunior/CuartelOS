# Conexión de la demo · Supabase y Vercel

Documento operativo con lo que se probó, qué falló por el entorno y cómo
terminar la conexión en pocos minutos.

---

## Estado de la conexión al 2026-11-19

| Paso | Estado | Detalle |
|---|---|---|
| Repositorio en GitHub | ✅ | `SlippinJunior/CuartelOS`, rama `main`, CI en verde |
| Token de Vercel | ✅ | Cuenta `slippinjunior`, sin proyectos aún |
| Proyecto Supabase | ✅ | `gcedmlrmgtdktpglxqdl`, API por HTTPS responde |
| Aplicar migraciones | ⛔ | **Bloqueado por red**: la base solo acepta `:5432` y esa red bloquea el puerto |
| `anon key` entregada | ⚠️ | La cadena recibida no es un JWT válido (`sb_publishable` y `anon` responden `Invalid API key`) |

### Por qué se bloqueó la aplicación de migraciones
La base de datos de Supabase expone PostgreSQL en el puerto **5432**, también a
través del pooler. Desde esta red:

```text
db.gcedmlrmgtdktpglxqdl.supabase.co:5432  → IPv6 only, red sin IPv6
aws-0-*.pooler.supabase.com:5432 / :6543 → timeout
gcedmlrmgtdktpglxqdl.supabase.co:443      → funciona
```

La API de administración de Supabase también requiere un token de acceso
personal (`sbp_...`), que no se recibió. Por eso la base quedó **sin tablas**.

---

## Opción A · Tú aplicas las migraciones (5 minutos)

La forma más segura, porque no hay que compartir credenciales de base.

### 1. Descargar el SQL

1. En GitHub, abre **`supabase/migrations`**.
2. En el repositorio hay 27 archivos en orden. En **Supabase → SQL Editor**,
   pega y ejecuta los 27 en orden alfabético. Es tedioso pero funciona.

Alternativa recomendada (una sola vez):

```bash
git clone https://github.com/SlippinJunior/CuartelOS.git
cd CuartelOS
supabase login
supabase link --project-ref gcedmlrmgtdktpglxqdl
supabase db push
```

`supabase db push` aplica las 27 migraciones de una vez.

### 2. Cargar los datos ficticios

En **SQL Editor** pega y ejecuta el contenido de `supabase/seed.sql`
(200 KB). Crea los 30 bomberos ficticios, las listas, las guardias y los
usuarios demo.

### 3. Obtener la clave correcta

En **Supabase → Settings → API Keys → Legacy API Keys**, copia:
- `anon` (empieza con `eyJ...`)
- `service_role` (solo se usa dentro de Supabase, no en Vercel)

---

## Opción B · Yo aplico las migraciones

Necesito una credencial que funcione por HTTPS. Cualquiera de estas dos:

1. **Token de acceso personal de Supabase** (`sbp_...`): se crea en
   [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
   Con él aplico las migraciones y configuro Auth por la Management API.
2. **Habilitar conexión IPv4** al proyecto y darme acceso a una red que permita
   el puerto 5432 (por ejemplo, un servidor propio).

> La opción 1 es la más simple y no expone la contraseña de la base.

---

## Despliegue en Vercel

Cuando la base tenga tablas y la `anon key` correcta:

1. En [vercel.com](https://vercel.com) → **Add New → Project → Import** →
   `SlippinJunior/CuartelOS`.
2. Vercel lee `vercel.json`: build del monorepo, salida `app/dist`.
3. Variables de entorno:
   ```env
   VITE_SUPABASE_URL=https://gcedmlrmgtdktpglxqdl.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key eyJ...>
   ```
4. Deploy. La URL queda como `https://cuartel-os.vercel.app`.
5. En **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://cuartel-os.vercel.app`
   - Redirect URLs: `https://cuartel-os.vercel.app/auth/establecer`

También se puede desplegar por CLI con el token entregado:

```bash
npx vercel --token "$VERCEL_TOKEN" --prod \
  --env VITE_SUPABASE_URL=... \
  --env VITE_SUPABASE_ANON_KEY=...
```

---

## Pendiente después del despliegue

| Paso | Cómo |
|---|---|
| Edge Functions | `supabase secrets set SITE_URL=...` y `supabase functions deploy <nombre>` para las 7 |
| Prueba de humo | Login `director@demo.local` / `demo1234`, abrir Guardia y Secretaría |
| Restauración | Si la demo se ensucia, volver a ejecutar migraciones y `supabase/seed.sql` |

---

## Relacionado con
`docs/operacion/demo-vercel.md`, `scripts/preparar-demo.sh`.
