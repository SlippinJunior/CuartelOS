# Módulo · Secretaría

**Estado:** 🧱 esqueleto

## Alcance comprometido
- Libro de actas con tipo de sesión y quórum derivado de la lista.
- Acuerdos con seguimiento y vínculo a compromisos.
- Correspondencia recibida y despachada con contrapartes.
- Elecciones, candidaturas y padrón (P15).
- Traspaso de cargo (P17).
- Memoria anual (P20) y carpeta de cumplimiento (P23).

## Artículos y documentos
- P1, P2, P4, P15, P17, P20, P23.
- Art. 125 B 25 para la reserva de disciplina.

## Modelo listo
`secretaria.tipo_sesion`, `acta`, `acuerdo`, `correspondencia`, `eleccion`,
`candidatura`, `traspaso_cargo`. Las actas aprobadas son visibles para los
bomberos; los borradores no.

## Pendiente
- Editor de actas y acuerdos.
- Vínculo automático acuerdo → compromiso.
- Generación de P15/P17/P20/P23.

## Relacionado con
`app/src/features/secretaria/README.md`, Etapa 5.
