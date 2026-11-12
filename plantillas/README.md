# plantillas/ · Documentos imprimibles

## Propósito
Guardar el diseño canónico de los PDF institucionales y los recursos gráficos.
La plantilla principal es la hoja de vida del bombero (P3).

## Contenido
| Archivo | Qué es |
|---|---|
| `hoja_de_vida.typ` | Plantilla Typst con escudo, folio, QR y firmas |
| `escudo.png` | Escudo institucional usado en la app y los PDF |
| `qr_ejemplo.svg` | Ejemplo de código QR de verificación |

## Cómo se usa
```bash
typst compile --input datos=hv.json plantillas/hoja_de_vida.typ salida.pdf
```
El JSON `hv.json` sigue la forma de `personal.v_hoja_vida` (`datos`). En la
Etapa 1 la emisión corre con `pdf-lib` en la Edge Function; esta plantilla se
conectará en la fase F con `typst.ts` en el navegador o un compilador Typst del
lado servidor, según la prueba de límites de CPU.

## Convenciones
- Escudo institucional, rojo `#9B1C1C`, tipografía serif legible.
- Folio y URL de verificación en el pie de cada página.
- Sin datos sensibles (grupo sanguíneo, alergias, contacto de emergencia).
- Si cambia el diseño, actualizar también el generador de la Edge Function.

## Relacionado con
`docs/modulos/documentos.md`, `supabase/functions/emitir-documento/`.
