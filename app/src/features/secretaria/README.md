# features/secretaria/ · Secretaría (esqueleto)

## Propósito
Actas, acuerdos, correspondencia, elecciones y traspasos de cargo.

## Contenido
`SecretariaPage.tsx` con el alcance comprometido. Las tablas
`secretaria.acta`, `acuerdo`, `correspondencia`, `eleccion`, `candidatura` y
`traspaso_cargo` ya existen con RLS y auditoría.

## Cómo se usa
Se habilita en la Etapa 5. El libro de actas se vincula a la lista de
asistencia y deriva de ella el quórum y los presentes.

## Convenciones
- Un acuerdo con monto puede originar un compromiso de tesorería.
- Las actas aprobadas son visibles para los bomberos; el borrador no.
- La correspondencia usa `nucleo.contraparte`, no texto libre.

## Relacionado con
`docs/modulos/secretaria.md`, migración `…_secretaria.sql`.
