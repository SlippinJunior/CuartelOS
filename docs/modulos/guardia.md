# Módulo · Guardia

**Estado:** 🧱 esqueleto; órdenes de capitanía funcionales desde Documentos

## Alcance comprometido
- Turnos de guardia con jefe y dotación.
- Órdenes de capitanía con documento.
- Rol de guardia nocturna e informe diario.
- Accidentes en acto de servicio y certificado de concurrencia.

## Artículos y documentos
- P5 Certificado de concurrencia a emergencia.
- P6 Informe de accidente (24 h).
- P7 Rol de guardia nocturna y libro de guardia.

## Modelo listo
`operaciones.guardia_turno`, `guardia_integrante`, `orden_capitania` y
`accidente_servicio`, con RLS: el bombero ve sus guardias; capitán, ayudante y
teniente 1 escriben.

## Implementado
- Emisión de órdenes de capitanía desde Documentos (capitán, ayudante, teniente 1, director y admin).
- PDF con folio y verificación, visible para todos los bomberos.
- Envío por correo a los bomberos activos (SMTP o Resend).

## Pendiente
- Pantalla de turnos y calendario.
- Parte de accidente con adjunto y folio.
- Integración con asistencia (guardia como acto).

## Relacionado con
`docs/datos/`, `app/src/features/guardia/README.md`, Etapa 3.
