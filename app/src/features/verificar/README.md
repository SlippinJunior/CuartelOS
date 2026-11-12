# features/verificar/ · Verificación pública

## Propósito
Página pública `/verificar/:token` para comprobar la autenticidad de un
documento emitido sin revelar datos personales.

## Contenido
`VerificarPage.tsx`: consulta `documentos.verificar_documento(p_token)` con el
cliente `anon` y muestra tipo, folio, fecha y validez. No requiere sesión y no
muestra el nombre del bombero.

## Cómo se usa
El QR del PDF apunta aquí. La ruta queda fuera de `AppShell` y del fallback de
la PWA para que funcione incluso sin sesión.

## Convenciones
- Mensaje claro para token inexistente y para documento anulado.
- No se listan documentos ni se permite enumerar tokens.
- La consulta es de solo lectura y está limitada por `security definer`.

## Relacionado con
`docs/modulos/documentos.md`, migración `…_documentos_emision.sql`.
