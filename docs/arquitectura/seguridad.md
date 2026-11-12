# Seguridad

## Principios
1. **RLS es la autoridad.** La interfaz oculta secciones, pero cada tabla tiene
   políticas por rol y por fila.
2. **Un rol no es un cargo.** `seguridad.usuario_rol` es manual, con fechas y
   motivo; el historial de cargos vive en `personal.cargo_periodo`.
3. **Mínimo privilegio.** `seguridad` no se expone a PostgREST. Las funciones
   internas se revocan y solo las RPC explícitas están disponibles.
4. **Los datos sensibles se leen por una sola puerta.** `personal.leer_dato_sensible()`
   verifica permiso e inserta una fila de auditoría con usuario e IP.
5. **Disciplina aislada.** Esquema propio; el Director solo ve sanciones
   ejecutoriadas.

## Matriz resumida
| Esquema | Bombero | Oficialidad | Escriben |
|---|---|---|---|
| personal | lo propio | todo | secretario, prosecretario, director |
| personal.dato_sensible | lo propio | vía RPC auditada | secretario, director, el propio |
| asistencia | listas + lo propio | todo | ayudante, capitán, secretario |
| operaciones | sus guardias | todo | capitán, ayudante, teniente 1 |
| material | — | todo | capitán, teniente 3 |
| material.asignacion | lo propio | todo | capitán, teniente 2 |
| tesorería | sus cuotas y campaña | todo | tesorero, protesorero (+ director en presupuesto) |
| secretaría | actas aprobadas | todo | secretario, prosecretario |
| disciplina | — | solo consejo | consejo |
| documentos | los suyos | todo | emite cualquier oficial vía Edge Function |
| seguridad | sus roles (RPC) | — | director, admin (RPC) |

Las celdas se prueban en `supabase/tests/`.

## Auditoría
`seguridad.auditoria` guarda esquema, tabla, fila, acción, antes/después,
usuario, IP (`x-forwarded-for`) y agente. Se activa por trigger en todas las
tablas de negocio. La lectura de datos sensibles también deja una fila
`accion = 'SELECT'`.

## Consentimiento (Ley 21.719)
- Texto versionado en `seguridad.consentimiento_texto`.
- Aceptación por versión en `seguridad.consentimiento`, con IP y agente.
- Si el Directorio cambia el texto, sube la versión y el sistema vuelve a
  pedirla.
- **El texto incluido es un borrador** y requiere revisión legal.

## Invitaciones
- Registro abierto desactivado (`enable_signup = false`).
- `invitar-usuario` verifica que quien llama sea Director o admin, invita por
  correo y vincula la persona con la RPC `nucleo.registrar_usuario`.
- La Edge Function usa la clave de servicio solo del lado servidor.

## Riesgos conocidos
- El folio se reserva antes de subir el PDF; un fallo de Storage puede dejar un
  salto. Se documenta y se controla con alertas de folio.
- El PDF actual lo arma la Edge Function con `pdf-lib`; la garantía de contenido
  es equivalente mientras el emisor sea un oficial autenticado.
- La verificación pública solo confirma folio y validez; no reemplaza el
  original firmado.

## Relacionado con
`docs/arquitectura/adr/`, `supabase/tests/`, `app/src/lib/permisos.ts`.
