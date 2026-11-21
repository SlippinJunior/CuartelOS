# Conexión de la demo · Supabase y Vercel

Documento operativo con lo que se probó, qué falló por el entorno y cómo
terminar la conexión en pocos minutos.

---

## Estado de la conexión al 2026-11-19

| Paso | Estado | Detalle |
|---|---|---|
| Repositorio en GitHub | ✅ | `SlippinJunior/CuartelOS`, rama `main`, CI en verde |
| Proyecto Supabase | ✅ | `gcedmlrmgtdktpglxqdl` (us-east-2), 27 migraciones aplicadas por HTTPS |
| Datos ficticios | ✅ | `supabase/seed.sql`: 30 personas, 40 listas, 14 guardias, 4 actas, 13 usuarios |
| Esquemas en PostgREST | ✅ | `nucleo`, `personal`, `asistencia`, `operaciones`, `material`, `tesoreria`, `secretaria`, `disciplina`, `documentos` |
| Edge Functions | ✅ | Las 7 desplegadas, `SITE_URL=https://cuartel-os.vercel.app` |
| Auth | ✅ | Site URL y redirección `/auth/establecer`; registro cerrado |
| Vercel | ✅ | Proyecto `cuartel-os` en <https://cuartel-os.vercel.app> |
| Integración Git de Vercel | ⚠️ | Pendiente autorizar GitHub desde el panel (solo lo puede hacer el dueño) |

### Cómo se resolvió

La red sigue bloqueando `:5432`, pero con un **token personal de Supabase**
(`sbp_...`) se aplicó todo por la Management API (HTTPS):

```bash
# migraciones, una por archivo en orden
curl -X POST "https://api.supabase.com/v1/projects/<ref>/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "<contenido del .sql>"}'

# seed
# (misma llamada, con el contenido de supabase/seed.sql)

# esquemas visibles en PostgREST
curl -X PATCH "https://api.supabase.com/v1/projects/<ref>/postgrest" \
  -d '{"db_schema":"public,graphql_public,nucleo,personal,asistencia,operaciones,material,tesoreria,secretaria,disciplina,documentos"}'
# + en SQL: alter role authenticator set pgrst.db_schemas = '<esa lista>'
# + todas las sesiones de esos roles son de pgrst: el ajuste por rol lo aplica
#   PostgREST; las versiones se registran en supabase_migrations.schema_migrations

# Edge Functions (la API exige multipart, por eso se usa la CLI)
SUPABASE_ACCESS_TOKEN=... supabase link --project-ref <ref>
supabase secrets set SITE_URL=https://cuartel-os.vercel.app
supabase functions deploy <nombre>
```

---

## Replicar la demo en otro proyecto

Con un token personal (`sbp_...`):

1. Aplicar las 27 migraciones de `supabase/migrations` en orden por
   `POST /v1/projects/<ref>/database/query`.
2. Ejecutar `supabase/seed.sql` igual.
3. `PATCH /v1/projects/<ref>/postgrest` con
   `"db_schema": "public,graphql_public,nucleo,personal,asistencia,operaciones,material,tesoreria,secretaria,disciplina,documentos"`
   y luego, en SQL,
   `alter role authenticator set pgrst.db_schemas = '<esa lista>';`
   (recomendado exponer sólo `nucleo, personal, asistencia` en demos con
   invitados desconocidos).
4. `supabase link`, `supabase secrets set SITE_URL=...` y desplegar las 7
   Edge Functions.
5. En Vercel, crear el proyecto y cargar `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (JWT `eyJ...`).
6. `PATCH /v1/projects/<ref>/config/auth` con `site_url`, `uri_allow_list`
   (incluye `/auth/establecer`), `disable_signup=true`.

> `scripts/preparar-demo.sh` hace los pasos 1–4 por psql cuando el puerto 5432
> está disponible.

---

## Despliegue en Vercel

El proyecto ya existe (`cuartel-os`). Para publicar cambios sin integración Git:

```bash
cd /ruta/al/repo
npx vercel link --project cuartel-os --scope slippinjuniors-projects
npx vercel deploy --prod
```

Para habilitar el despliegue automático en cada `push`, autoriza GitHub en
Vercel → **Account Settings → Connect Git Account** y conecta
`SlippinJunior/CuartelOS` en **Settings → Git** del proyecto.

---

## Pendiente después del despliegue

| Paso | Cómo |
|---|---|
| Correo | `supabase secrets set SMTP_...` (opcional; sin esto no salen mails) |
| Prueba de humo | Login `director@demo.local` / `demo1234`, recorrer Guardia y Secretaría |
| Restauración | Repetir seed (ver `demo-vercel.md`) |
| Seguridad | Rotar el token personal de Supabase y el token de Vercel usados para montarla |

### Verificado en la demo publicada (2026-11-19)

| Prueba | Resultado |
|---|---|
| Login `director@demo.local` y recorrido de Inicio, Personal, Guardia, Asistencia, Tesorería, Secretaría, Documentos, Administración | ✅ sin errores de consola |
| Login `capitan@demo.local` → Guardia y Material | ✅ |
| Login `bombero@demo.local` → muro de consentimiento | ✅ (comportamiento esperado) |
| Edge Function `emitir-acta` → PDF en Storage + folio 2026-0001 | ✅ HTTP 200 |
| `/verificar/<token>` público y `/verificar/<token-inválido>` | ✅ "Documento válido" / "Documento no válido" |
| Pañol del Teniente 2°: stock, solicitudes y EPP | ✅ visto como `teniente_2` (resuelve) y como `bombero` (consulta y solicita); la oficialidad solo lee |

> Nota técnica: la CLI de Supabase sólo permite exponer esquemas al vincular el
> proyecto por Postgres (`:5432`), inaccesible desde esta red. Los esquemas se
> configuraron por la Management API y, además, se registraron las 27 versiones
> en `supabase_migrations.schema_migrations` para que un futuro
> `supabase db push` no las repita.

---

## Relacionado con
`docs/operacion/demo-vercel.md`, `scripts/preparar-demo.sh`.
