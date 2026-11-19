# Demo pública · Entorno de prueba

Este entorno permite **presentar y compartir** el sistema con personas externas
sin exponer datos reales. Todo lo que hay aquí es **ficticio**.

> **Demo en línea:** <https://cuartel-os.vercel.app>
> Contraseña de todos los usuarios: `demo1234`

---

## Qué se publica

| Pieza | Dónde | Contenido |
|---|---|---|
| Frontend | **Vercel** | SPA estática generada desde `app/` |
| Base de datos | **Supabase Cloud** (us-east-2) | Migraciones + `supabase/seed.sql` ficticio |
| Storage | Supabase | Buckets privados `documentos`, `sensibles`, `material` |
| Edge Functions | Supabase | `invitar-usuario`, `emitir-documento`, `emitir-acta`, `orden-capitania`, `notificar-guardias`, `emitir-guardia-pdf`, `emitir-secretaria-pdf` |

La app se conecta al Supabase de la demo mediante dos variables de entorno en
Vercel:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key pública del proyecto>
```

### ⚠️ Usa la clave `anon` (JWT), no la `publishable`
El cliente actual envía `VITE_SUPABASE_ANON_KEY` como JWT. Con la
`publishable key` (`sb_publishable_...`) PostgREST rechaza las llamadas
anónimas y la verificación pública de documentos deja de funcionar. Busca en
**Settings → API Keys → Legacy API Keys** la clave `anon` (empieza con `eyJ`).

La `anon key` es pública por diseño: la seguridad la impone RLS en la base.
La `service_role` nunca se usa en el frontend.

---

## Usuarios de la demo

Todos con la contraseña **`demo1234`**. Aparecen como botones en la pantalla de
ingreso.

| Correo | Rol |
|---|---|
| `director@demo.local` | Director (acceso completo) |
| `secretario@demo.local` | Secretario (Personal, Asistencia, Secretaría) |
| `tesorero@demo.local` | Tesorero (cuotas, cartola) |
| `capitan@demo.local` | Capitán (guardias, órdenes, material) |
| `ayudante@demo.local` | Ayudante (pase de lista) |
| `consejo@demo.local` | Consejo (solo disciplina) |
| `bombero@demo.local` | Bombero (vista mínima; pide consentimiento) |
| `admin@demo.local` | Administrador |

---

## Preparar el proyecto Supabase de la demo

```bash
# 1. Crear proyecto en https://supabase.com (la demo usa us-east-2)
#    Guardar: Project URL y anon key (Settings → API)

# 2. Vincular el repositorio
supabase login
supabase link --project-ref <project-ref>

# 3. Aplicar el esquema (27 migraciones)
supabase db push

# 4. Cargar los datos ficticios
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 -f supabase/seed.sql

# 5. Desplegar las Edge Functions
supabase secrets set SITE_URL="https://<tu-dominio-vercel>"
for f in invitar-usuario emitir-documento emitir-acta orden-capitania \
         notificar-guardias emitir-guardia-pdf emitir-secretaria-pdf; do
  supabase functions deploy "$f"
done
```

### Configuración de Auth
En **Authentication → URL Configuration**:
- Site URL: `https://<tu-dominio-vercel>`
- Redirect URLs: `https://<tu-dominio-vercel>/auth/establecer`

El registro abierto queda desactivado; los usuarios de la demo ya existen en el
seed.

### Correo (opcional)
Las Edge Functions que envían correo necesitan SMTP o Resend:

```bash
supabase secrets set \
  SMTP_HOST=smtp.tuproveedor.cl \
  SMTP_PORT=587 \
  SMTP_STARTTLS=true \
  SMTP_USER=... \
  SMTP_PASSWORD=... \
  SMTP_FROM="Segunda Compania <no-reply@tu-dominio.cl>"
```

Sin esto, las invitaciones y las órdenes de capitanía no envían correo, pero el
resto de la demo funciona.

---

## Publicar en Vercel

1. En Vercel: **Add New → Project → Import Git Repository → `SlippinJunior/CuartelOS`**.
2. Vercel detecta `vercel.json` en la raíz (build del monorepo).
3. En **Environment Variables** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. La primera compilación tarda unos 2 minutos.
5. Copia la URL pública (`https://cuartel-os.vercel.app`) y úsala como
   `SITE_URL` en Supabase.

### Despliegue por CLI (sin integración Git)
La demo actual se publicó con la CLI porque la integración Git de Vercel aún no
está autorizada a leer el repositorio:

```bash
npx vercel link --project cuartel-os --scope slippinjuniors-projects
npx vercel env add VITE_SUPABASE_URL production   # y VITE_SUPABASE_ANON_KEY
npx vercel deploy --prod
```

Para que cada `git push` a `main` despliegue solo:

1. En Vercel → **Account Settings → Connect Git Account** autoriza GitHub.
2. En el proyecto `cuartel-os` → **Settings → Git** conecta
   `SlippinJunior/CuartelOS` (rama `main`).
3. Agrega en GitHub el secreto `VERCEL_TOKEN` si prefieres el workflow
   `.github/workflows/deploy-vercel.yml` en vez de la integración nativa.

---

## Restaurar la demo después de una prueba

La demo es de escritura: los invitados pueden modificar los datos ficticios. Para
dejarla como nueva:

```bash
psql "$SUPABASE_DB_URL" -c "drop schema documentos, disciplina, secretaria, tesoreria, material, operaciones, asistencia, personal, seguridad, nucleo cascade;"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
```

> **Cuidado:** borrar los esquemas elimina también los usuarios de Auth que
> estén vinculados. Si hay invitados de prueba, vuelve a ejecutar el seed y
> recuerda que los `demo.local` se recrean.

Para una restauración más limpia, usa el botón **Reset database** del proyecto de
prueba y vuelve a aplicar migraciones y seed.

---

## Protecciones recomendadas para la demo

- Usa un proyecto Supabase **dedicado** (no el de producción).
- Pon límites de gasto en Supabase y Vercel.
- Activa **Leaked Password Protection** en Authentication.
- No cargues nunca `data/privado/` ni datos reales.
- Si la demo crece, agrega una clave de acceso en Vercel (Vercel Password
  Protection, plan Pro) o un aviso de "datos ficticios".

---

## Qué probar en la demo

1. Entra como **director** y recorre Inicio, Personal, Guardia, Tesorería y Secretaría.
2. Abre una ficha de bombero y revisa antigüedad, categoría de guardia y Charlie.
3. En **Guardia**, prueba la grilla semanal y el reporte nocturno.
4. En **Asistencia**, abre la lista 40 y marca asistencia.
5. En **Tesorería**, registra una cuota y verifica que aparece en la cartola.
6. En **Secretaría**, crea un acta con secciones y emite el PDF.
7. Entra como **bombero** y comprueba que ve solo lo suyo.

---

## Relacionado con
`docs/operacion/supabase-nube.md`, `docs/operacion/cloudflare-pages.md`,
`README.md`.
