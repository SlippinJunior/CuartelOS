# Edge Functions

Ocho funciones Deno. Se ejecutan en Supabase y nunca en el navegador. Usan
la clave de servicio solo del lado servidor.

Incluyen módulos compartidos en `_shared/`:
- `whatsapp.ts`: envío 1-a-1 oficial por **Meta WhatsApp Cloud API v21.0** (`type: "template"`, lotes de 8, normalización `569XXXXXXXX`) con respaldo `no_configurado` si faltan credenciales.
- `correo.ts`: envío por Resend/SMTP (`enviarCorreos` y `enviarCorreosDetallado` con estado por destinatario).
- `despacho.ts`: registro unificado de trazabilidad en `nucleo.despacho` y `nucleo.despacho_detalle`.

## Variables de entorno

```bash
supabase secrets set SITE_URL="https://erp.segundacompania.cl"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta
Supabase automáticamente. No las pongas en un archivo `.env`: el CLI las omite
con un aviso. Localmente basta `SITE_URL` en `supabase/functions/.env`
(hay una plantilla en `.env.example`).

## `invitar-usuario`

Solo Director o admin.

```json
POST /functions/v1/invitar-usuario
{ "email": "bombero@compania.cl", "persona_id": "uuid", "rol": "bombero" }
```

1. Verifica el JWT del llamador y su perfil (`nucleo.mi_perfil`).
2. `auth.admin.inviteUserByEmail` con redirección a `/auth/establecer`.
3. Vincula `seguridad.usuario` y asigna el rol mediante
   `nucleo.registrar_usuario` (RPC security definer).

## `emitir-acta`

Emite el PDF de un acta de reunión. Solo Secretaría, Director o admin.

```json
POST /functions/v1/emitir-acta
{ "acta_id": 12 }
```

Genera el PDF, reserva folio `ACTA`, lo sube a Storage, registra la emisión y
actualiza `secretaria.acta.archivo_id`.

## `orden-capitania`

Crea una orden de capitanía, emite su PDF y la despacha por correo y WhatsApp
(plantilla Meta Cloud API) a todos los bomberos activos, registrando el resultado
en `nucleo.despacho`. Solo Capitán, Ayudante, Teniente 1°, Director o admin.

```json
POST /functions/v1/orden-capitania
{
  "numero": 3,
  "fecha": "2026-11-12",
  "materia": "Guardia nocturna",
  "texto": "Se cita al personal...",
  "enviar_correo": true,
  "enviar_whatsapp": true
}
```

El correo usa `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD` o
`RESEND_API_KEY`. En local, `SMTP_HOST=inbucket` y `SMTP_PORT=1025` capturan los
mensajes en Mailpit (`http://127.0.0.1:54324`).

## `despachar-comunicado`

Publica comunicados del Tablero (`orden_dia`, `circular_cbl`, `circular_compania`,
`citacion`) con PDF adjunto o generado automáticamente (folio + QR), y los
despacha en paralelo al **Portal**, **Correo** y **WhatsApp** (Meta Cloud API
`type: "template"`). También soporta `accion: "reintentar"` para reenviar a
destinatarios `fallido` o `no_configurado` de un despacho previo.

```json
POST /functions/v1/despachar-comunicado
{
  "tipo": "citacion",
  "numero": 12,
  "fecha": "2026-11-26",
  "titulo": "Citación a Academia",
  "texto": "Se cita al personal...",
  "fecha_evento": "2026-11-29",
  "hora_evento": "20:00",
  "lugar": "Cuartel",
  "enviar_correo": true,
  "enviar_whatsapp": true
}
```

## `notificar-guardias`

Convocatorias de guardia (correo + WhatsApp por Meta Cloud API) y aviso matinal
de llegadas tardías. Acepta la sesión de un oficial de Capitanía o un token
interno (`CRON_SECRET`).

```json
POST /functions/v1/notificar-guardias
{ "modo": "convocatoria_semana", "ciclo_id": 1, "semana_num": 1 }
{ "modo": "llegadas_tardias" }
```

## `emitir-secretaria-pdf`

Emite el **P1** (expediente de postulación), **P2** (acta de votación de
ingreso, sin número de votos) y **P4** (comunicación de altas y bajas).

```json
POST /functions/v1/emitir-secretaria-pdf
{ "tipo": "P1", "postulacion_id": 4 }
{ "tipo": "P2", "postulacion_id": 4 }
{ "tipo": "P4", "evento_ids": [12, 13] }
```

## `emitir-guardia-pdf`

PDF **P7 · Rol y Libro de Guardia** con folio `ROL_GUARDIA`, hash y QR.

```json
POST /functions/v1/emitir-guardia-pdf
{ "ciclo_id": 1, "semana_num": 1 }
```

## `emitir-documento`

Cualquier oficial autenticado puede emitir la hoja de vida (P3) de un bombero.

```json
POST /functions/v1/emitir-documento
{ "tipo": "P3", "persona_id": "uuid" }
```

1. Verifica JWT y `es_oficial` con el cliente del llamador (RLS).
2. Lee `personal.v_hoja_vida` con el cliente de servicio.
3. Reserva folio correlativo (`documentos.siguiente_folio`), arma el PDF, calcula
   SHA-256 y sube el archivo al bucket privado `documentos`.
4. Registra la emisión con `documentos.registrar_emision` y devuelve una URL
   firmada por una hora y el token de verificación.

> **Nota técnica:** esta implementación usa `pdf-lib` y `qrcode-generator`
> **vendorizados** en `supabase/functions/_vendor/`, para que la función arranque
> aunque el contenedor local no tenga salida a esm.sh/npm. Las llamadas a Auth,
> PostgREST y Storage se hacen con `fetch` directo, sin `supabase-js`.
>
> La plantilla Typst de `plantillas/hoja_de_vida.typ` es el diseño canónico y se
> conectará en la fase F0/F con `typst.ts` en el navegador o un compilador Typst
> en la Edge Function. El contrato de datos (`personal.v_hoja_vida`), el folio,
> el hash y la verificación ya son los definitivos.

## Desarrollo local

```bash
cp supabase/functions/.env.example supabase/functions/.env
supabase functions serve --env-file supabase/functions/.env
```

El frontend apunta a `http://127.0.0.1:54321/functions/v1/...` cuando usa el
cliente local de Supabase.

## Prueba manual

1. Invita un correo desde Administración → Usuarios.
2. Revisa Inbucket (`http://127.0.0.1:54324`) y abre el enlace.
3. Entra como director, abre la ficha de un bombero, pulsa *Emitir hoja de vida*.
4. Abre el enlace de verificación; el documento debe figurar vigente.
5. Anula el documento desde Documentos y verifica que pasa a inválido.
