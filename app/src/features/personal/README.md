# features/personal/ · Personal y hoja de vida

## Propósito
Administrar la ficha del bombero y su hoja de vida (P3): identificación,
cargos, formación, premios, material a cargo, asistencia, documentos y datos
sensibles en una sección separada.

## Contenido
| Archivo | Rol |
|---|---|
| `PersonalPage.tsx` | Lista con búsqueda y filtros por estado/rango |
| `PersonaPage.tsx` | Detalle con pestañas y lecturas por sección |
| `PersonaFormPage.tsx` | Alta y edición con zod |
| `dialogos.tsx` | Eventos, cargos, cursos, premios, licencias y sensibles |

## Cómo se usa
- Lista → ficha con URL propia (`/personal/:id`).
- Las escrituras se permiten a secretario, prosecretario, director y admin; RLS
  lo vuelve a verificar.
- Los datos sensibles se leen con `personal.leer_dato_sensible()`, que audita
  cada lectura. La tabla no se consulta directamente desde el navegador.
- Los eventos de estado son la fuente de verdad del rango y estado actuales.

## Convenciones
- La hoja de vida (P3) no incluye datos sensibles.
- Cada cambio queda en `seguridad.auditoria` con IP y usuario.
- La antigüedad se calcula, no se guarda.

## Relacionado con
`docs/modulos/personal.md`, `docs/datos/er-personal.md`.
