# Módulo · Guardia

**Estado:** ✅ ciclo, grilla, inscripción, reporte y firma (Etapa 3 parcial)

## Alcance

### Antigüedad y categoría (Orden 01/2026 §3)
- Años de servicio = **premios de constancia + abonos de antigüedad**, con
  ajuste manual opcional reservado a Director, Secretario y admin.
- Categoría automática: `0_4`, `5_9`, `10_19`, `20_34` o **exento**.
- Exención automática con 60 años o 35 de servicio; además bandera manual
  `exento_guardia` con motivo (Oficiales Generales, Miembros Honorarios del
  Directorio General).
- La vista `personal.v_antiguedad_persona` es la fuente única y la usan la
  hoja de vida, la grilla de guardias y las estadísticas.

### Código Charlie (maquinista)
- Cada maquinista habilitado tiene `personal.persona.codigo_charlie` (`CH-201`),
  único sin distinguir mayúsculas.
- En el reporte se ingresa el código y la modalidad:
  - **Z8** en cuartel: cuenta como guardián.
  - **Z20** a la escucha: solo suma estadística de maquinista.
  - **sin_maquinista**: no suma.

### Ciclos de guardia
- Bloques de **14 días** (Semana 1 y Semana 2) creados por Capitanía,
  Teniente 1°, Ayudante, Director o admin.
- Turnos de 23:30 a 09:30 (10:30 sábados, domingos y feriados), en horario de
  Chile.
- Grilla visible para **toda la compañía**, con registro, nombre, jefe,
  Charlie Z8, reemplazo y llegada tardía.

### Cupo de 3 y cobertura semanal
- Tope de 3 guardianes por día, evaluado **por semana**.
- Mientras algún día de la semana tenga menos de 3, ningún día puede pasar de 3.
- Cuando los 7 días llegan a 3 o más, se liberan cupos extra en toda la semana.

### Cierre semanal y autoasignación
- La inscripción de cada semana se cierra el **último día previo a su inicio**
  (el domingo, a las 20:00 de Chile). Desde ese momento corre la asignación
  automática.
- Quien **debía guardia y no se inscribió** queda asignado automáticamente al
  **día con menos guardianes** de la semana; si hay empate, el día se elige
  **al azar**.
- Primero se completan los días bajo el cupo; si la semana ya está completa, el
  bombero se suma como cupo extra al día con menos dotación.
- Cada bombero asignado queda en **un solo día** de la semana y recibe un aviso
  in-app.
- El cierre corre por `pg_cron` (`operaciones.cerrar_semanas_pendientes`, 23:00
  UTC de cada día) y también se puede disparar desde **Guardia → Gestión** o
  desde la grilla con el botón *Cerrar semana y asignar*.
- La grilla muestra el plazo (`Cierra en 3 días`, `Cierra hoy`, `Inscripción
  cerrada`) y cada autoasignado lleva la etiqueta **Asignado**.

### Bajas y reemplazos (§5)
- Con 4 o más guardianes, el bombero puede bajarse libremente.
- Con 3 o menos, rige el **reemplazo formal**: indica reemplazante y el titular
  sigue debiendo cubrir un día del período.

### Reporte nocturno y firma
- Cualquier integrante de la guardia puede llenar el borrador: hora de aviso a
  central, Charlie, presencia y observaciones.
- La **firma digital** corresponde al oficial operativo de mayor rango presente
  (Capitán > Teniente 1° > 2° > 3°) o, si no hay, al bombero con menor número de
  registro. Capitanía, Teniente 1°, Director y admin tienen respaldo.

### Llegada tardía
- Una vez constituida la guardia, cualquier bombero puede registrar
  “Llegué a la guardia”.
- Cuenta de inmediato como guardia cumplida, deja la marca `[HH:MM] Llegada
  tardía: Nombre (Reg. NNN)` en las observaciones del turno y genera una
  notificación al Jefe de Guardia.
- El aviso matinal (09:00 Chile) se puede disparar a mano desde Gestión o por
  cron con la Edge Function `notificar-guardias`.

### Notificaciones
- Correo (SMTP o Resend) con `_shared/correo.ts`.
- WhatsApp Cloud API opcional (`WHATSAPP_TOKEN` y `WHATSAPP_PHONE_ID`). Sin
  credenciales, la app entrega el texto listo para el grupo y enlaces `wa.me`.
- Trazabilidad en `operaciones.guardia_notificacion`.

### Documentos y alertas
- PDF **P7 · Rol y Libro de Guardia** con folio `ROL_GUARDIA`, hash y QR.
- Reglas nuevas: **R13** guardia sin cobertura y **R14** reporte sin firmar.

## Cómo se usa
1. **Gestión → Nuevo ciclo**: elige el lunes de inicio y el cupo (3).
2. **Grilla**: cada bombero se inscribe en un día con cupo.
3. **Reporte**: la noche de la guardia, cualquier integrante informa.
4. **Firmar reporte**: lo hace el Jefe de Guardia calculado.
5. **Gestión → PDF**: emite el rol de la semana o del ciclo.

## Reglas implementadas en la base
| Regla | Dónde |
|---|---|
| Cupo por semana | `operaciones.inscribirse_guardia` + `semana_cubierta` |
| Cierre y autoasignación | `operaciones.cerrar_semana_guardia` + `asignar_automaticamente_semana` |
| Día con menos guardianes (empate al azar) | `operaciones.dia_con_menos_guardianes` |
| Baja libre o reemplazo | `operaciones.bajarse_guardia` |
| Jefe calculado | `operaciones.jefe_guardia_de_turno` |
| Firma | `operaciones.firmar_reporte_guardia` |
| Charlie Z8/Z20 | `operaciones.guardar_reporte_guardia` |
| Antigüedad manual restringida | trigger `personal.fn_proteger_campos_sensibles` |
| Categoría de guardia | `personal.categoria_guardia_de` |

## Pendiente
- Asignación manual de bomberos por día desde Gestión.
- Aviso por correo/WhatsApp de la autoasignación (hoy es solo in-app).
- Bandeja móvil de situaciones especiales para el bombero.
- Cron Trigger de Cloudflare o GitHub Actions como alternativa a `pg_net`.
- Historial de múltiples ciclos y arrastre de períodos bimestrales/trimestrales.

## Relacionado con
`docs/operacion/whatsapp.md`, `docs/datos/er-personal.md`,
`app/src/features/guardia/README.md`, `supabase/tests/guardias.test.sql`.
