# features/documentos/ · Documentos y emisión

## Propósito
Emitir la hoja de vida (P3) con folio, SHA-256, QR y verificación pública, y
mantener el historial de documentos con anulación motivada.

## Contenido
| Archivo | Rol |
|---|---|
| `DocumentosPage.tsx` | Historial, verificación y anulación |
| `EmitirPage.tsx` | Selección de bombero e invocación de la Edge Function |

## Cómo se usa
1. `EmitirPage` llama a `emitir-documento` con `{ tipo: "P3", persona_id }`.
2. La Edge Function arma el PDF, reserva folio, sube a Storage y registra la
   emisión. Devuelve una URL firmada y el token.
3. El QR apunta a `/verificar/:token`, que consulta
   `documentos.verificar_documento()` como `anon` y no expone datos personales.
4. Anular exige motivo y hace que la verificación pase a inválida.

## Convenciones
- El folio es correlativo por tipo y año.
- El documento se guarda con hash; el PDF descargado debe coincidir.
- La emisión actual usa `pdf-lib` en la Edge Function; el diseño Typst queda
  como plantilla canónica para la fase F.

## Relacionado con
`docs/modulos/documentos.md`, `supabase/functions/README.md`.
