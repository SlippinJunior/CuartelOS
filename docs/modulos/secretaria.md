# Módulo · Secretaría

**Estado:** 🧱 esqueleto; creación y PDF de actas disponible desde Documentos

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

## Implementado
- Crear actas de reunión desde Documentos (tipo de sesión, número, fecha, lista, quórum, texto y acuerdos).
- Emitir el PDF del acta con folio, hash y verificación.
- Las actas aprobadas y sus PDF son visibles para la compañía.

## Pendiente
- Flujo de aprobación de actas.
- Vínculo automático acuerdo → compromiso.
- Generación de P15/P17/P20/P23.

## Relacionado con
`app/src/features/secretaria/README.md`, Etapa 5.
