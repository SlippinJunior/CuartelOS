# Edge Functions

Dos funciones Deno que necesitan la clave de servicio. Se ejecutan en Supabase y
nunca en el navegador.

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
