# features/secretaria/ · Módulo de Secretaría

## Propósito
Gestionar actas, acuerdos, correspondencia, postulaciones y movimientos de
personal desde el celular y el escritorio.

## Contenido
| Archivo | Rol |
|---|---|
| `SecretariaPage.tsx` | Contenedor con pestañas Actas · Acuerdos · Correspondencia · Postulaciones |
| `ActasSection.tsx` | Editor estructurado, aprobación, PDF y listado |
| `AcuerdosSection.tsx` | Libro de acuerdos y creación de compromisos |
| `CorrespondenciaSection.tsx` | Recibidas y despachadas con adjuntos |
| `PostulacionesSection.tsx` | Checklist art. 7, votación, aspirantes y altas/bajas |
| `ActasAprobadas.tsx` | Vista de solo lectura para los bomberos en Documentos |

## Cómo se usa
- **Actas**: nueva acta → secciones reglamentarias → guardar → emitir PDF →
  aprobar. Al aprobar queda bloqueada para correcciones.
- **Acuerdos**: tocar un acuerdo para cambiar estado o crear el compromiso en
  Tesorería.
- **Correspondencia**: registrar carta, elegir contraparte, plazo y adjunto.
- **Postulaciones**: marcar el checklist, registrar votación y, si es aceptada,
  incorporar como aspirante.

## Convenciones
- Las secciones del acta se guardan en `secretaria.acta.secciones` (JSON), para
  que una futura transcripción pueda llenarlas sin refactorizar.
- La votación de ingreso nunca guarda el número de votos (art. 7).
- Los datos sensibles del postulante no se incluyen en el PDF P1.
- Los botones de escritura se ocultan por rol, pero RLS es la autoridad.

## Relacionado con
`docs/modulos/secretaria.md`, `docs/integraciones/nemotron-actas.md`.
