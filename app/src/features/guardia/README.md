# features/guardia/ · Guardia (esqueleto)

## Propósito
Turnos de guardia, órdenes de capitanía y accidentes en acto de servicio.

## Contenido
`GuardiaPage.tsx`: pantalla "módulo en construcción" con el alcance comprometido.
La base ya tiene `operaciones.guardia_turno`, `guardia_integrante`,
`orden_capitania` y `accidente_servicio` con RLS.

## Cómo se usa
Se habilitará en la Etapa 3. La estructura actual ya separa turno e integrantes
(una fila por persona ya no existe).

## Convenciones
- Jefe de guardia e integrantes con función y cumplimiento.
- Los accidentes se registran dentro de 24 horas (P6).

## Relacionado con
`docs/modulos/guardia.md`, migración `…_operaciones.sql`.
