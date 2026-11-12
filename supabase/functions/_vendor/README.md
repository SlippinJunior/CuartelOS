# _vendor/ · Dependencias locales de las Edge Functions

## Propósito
Evitar que las funciones dependan de una descarga desde `esm.sh` o npm en cada
arranque. El runtime local puede no tener salida a internet (por ejemplo, si
Docker no tiene DNS externo) y el worker no bootearía.

## Contenido
| Archivo | Versión | Licencia | Origen |
|---|---|---|---|
| `pdf-lib.esm.min.js` | 1.17.1 | MIT | `pdf-lib` (dist ESM minificado) |
| `qrcode.js` | 1.4.4 | MIT | `qrcode-generator`, con `export default` agregado |

## Cómo se usa
```ts
import { PDFDocument, StandardFonts, rgb } from "../_vendor/pdf-lib.esm.min.js";
import qrcode from "../_vendor/qrcode.js";
```

## Convenciones
- No editar los bundles salvo el `export default` de `qrcode.js`.
- Al actualizar, copiar el bundle ESM minificado y verificar que no tenga
  imports remotos.
- Registrar la versión y licencia en esta tabla.

## Relacionado con
`supabase/functions/emitir-documento/`, `supabase/functions/README.md`.
