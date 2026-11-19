# Módulo · Secretaría

**Estado:** ✅ actas, acuerdos, correspondencia, postulaciones y altas/bajas (Etapa 1 ampliada)

## Alcance

### Actas
- Editor estructurado por secciones reglamentarias: hora de inicio y término,
  preside, lectura del acta anterior, correspondencia, cuenta de los oficiales,
  incidentes y varios.
- Vínculo con la lista de asistencia: presentes, permisos y faltas calculados.
- Acuerdos en línea, numerados por acta.
- Aprobación explícita y bloqueo posterior: un acta aprobada solo puede
  corregirse por Director o admin.
- PDF con folio, QR y estado (Aprobada o Borrador).
- Los bomberos rasos leen las actas aprobadas en **Documentos → Actas aprobadas**.

### Libro de Acuerdos
- Todos los acuerdos de todas las actas, con búsqueda y filtros por estado.
- Semáforo de plazo y seguimiento.
- Botón **Crear compromiso en Tesorería** para acuerdos con monto sin
  compromiso, lo que resuelve la alerta **R04**.

### Correspondencia
- Cartas recibidas y despachadas con contraparte de `nucleo.contraparte`,
  creación rápida de una nueva, hilo `responde_a_id`, plazo de respuesta y
  adjunto en Storage `documentos/adjuntos/`.
- Alerta **R15**: correspondencia recibida por vencer o vencida sin respuesta.

### Postulaciones y Altas/Bajas
- Checklist del art. 7 (mayor de 18, enseñanza media, declaración jurada,
  certificados, salud física y mental, estudios) y dos patrocinantes.
- Expediente **P1** con folio y verificación.
- Votación de ingreso **sin número de votos** (art. 7): solo Aceptada o
  Rechazada. Si es rechazada, queda bloqueado 6 meses para repostular. Si es
  aceptada, se fija el plazo de bombero inicial.
- **Acta de votación P2**.
- Incorporación como **aspirante**: crea la ficha en Personal con rango
  aspirante y fecha de ingreso de hoy.
- Prórroga única de hasta 3 meses del período de bombero inicial, autorizada
  por el Capitán (art. 8). Alerta **R16** a 30 días del vencimiento.
- **Altas y bajas (art. 51 i)**: eventos de alta, cambio de estado,
  reincorporación y traslado con plazo de 3 días y comunicación **P4**.

## Permisos
| Acción | Rol |
|---|---|
| Leer actas, acuerdos y correspondencia | Toda la oficialidad |
| Crear y editar actas, acuerdos y correspondencia | Secretario, Prosecretario, Director, admin |
| Crear compromisos desde acuerdos | Secretaría, Tesorería, Director |
| Postulaciones, votación e incorporación | Secretario, Prosecretario, Director, admin |
| Prórroga de aspirante | Capitán, Director, admin |
| Leer actas aprobadas y acuerdos | Todos los bomberos (**Documentos**) |

## RPCs principales
| Función | Rol |
|---|---|
| `secretaria.crear_acta` | Crea con número correlativo por tipo y año |
| `secretaria.crear_compromiso_desde_acuerdo` | Genera el compromiso sin duplicar |
| `secretaria.registrar_votacion_postulacion` | Registra aceptada o rechazada |
| `secretaria.incorporar_aspirante` | Convierte la postulación en persona |
| `secretaria.prorrogar_aspirante` | Prórroga única de hasta 3 meses |
| `secretaria.altas_y_bajas` | Eventos con plazo de 3 días y estado de comunicación |

## Alertas
- **R15** · correspondencia por vencer o vencida sin respuesta.
- **R16** · plazo de bombero inicial por vencer.

## Pendiente
- Subir los certificados sensibles al bucket `sensibles` desde la interfaz.
- Correo automático de comunicación P4 a la Comandancia.
- Conexión con la transcripción automática (ver `docs/integraciones/nemotron-actas.md`).

## Relacionado con
`app/src/features/secretaria/README.md`, `supabase/tests/secretaria.test.sql`.
