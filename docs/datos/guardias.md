# Datos · Guardias y antigüedad

## Tablas
| Esquema | Tabla | Rol |
|---|---|---|
| `personal` | `persona` | `codigo_charlie`, `anios_servicio_manual`, `exento_guardia`, `motivo_exencion` |
| `personal` | `antiguedad_abono` | Abonos de antigüedad |
| `personal` | `persona_premio` | Premios de constancia que suman años |
| `operaciones` | `guardia_ciclo` | Ciclo de 14 días con cupo base |
| `operaciones` | `guardia_turno` | Turno por día, semana, estado, Charlie y firma |
| `operaciones` | `guardia_integrante` | Dotación, origen, estado y llegada tardía |
| `operaciones` | `guardia_situacion` | Solicitudes de situación especial |
| `operaciones` | `guardia_notificacion` | Trazabilidad de avisos por canal |

## Cálculos clave
```sql
-- Años de servicio: manual, o premios máximos + abonos
coalesce(anios_servicio_manual, floor(max(premio.anios) + suma(abonos))::int, 0)

-- Categoría de guardia
personal.categoria_guardia_de(anios, fecha_nacimiento, exento)
```

## Enums
| Enum | Valores |
|---|---|
| `operaciones.estado_ciclo` | `planificado`, `abierto`, `en_curso`, `cerrado` |
| `operaciones.estado_turno` | `programada`, `constituida`, `firmada` |
| `operaciones.charlie_modalidad` | `Z8`, `Z20`, `sin_maquinista` |
| `operaciones.origen_integrante` | `inscripcion`, `asignacion_capitania`, `reemplazo`, `llegada_tardia`, `charlie_z8`, `autoasignacion` |
| `operaciones.estado_integrante` | `inscrito`, `reemplazado`, `cumplida`, `ausente` |
| `operaciones.tipo_notificacion_guardia` | `convocatoria_semana`, `llegada_tardia`, `reemplazo`, `situacion_especial` |
| `operaciones.estado_situacion_guardia` | `pendiente`, `aprobada`, `rechazada` |

## Cierre de semana
| Función | Rol |
|---|---|
| `pendientes_de_semana(ciclo, semana)` | Activos no exentos sin participación |
| `dia_con_menos_guardianes(ciclo, semana, cupo, respetar)` | Turno con menor dotación; empate al azar |
| `asignar_automaticamente_semana(ciclo, semana)` | Reparte a los pendientes |
| `cerrar_semana_guardia(ciclo, semana, forzar)` | Valida el plazo y ejecuta el reparto |
| `cerrar_semanas_pendientes()` | Recorre los ciclos activos (pg_cron) |
| `estado_cierre_semana(ciclo, semana)` | Plazo, cierre y aviso para la interfaz |

`guardia_turno.autoasignado_en` marca que la semana ya se cerró.

## Reglas
- Un turno nocturno por fecha y ciclo (índice único parcial).
- `guardia_integrante.cumplida` se mantiene sincronizada con `estado` por
  trigger para compatibilidad.
- Solo se inscriben bomberos activos no exentos (la UI oculta; la RPC permite
  el override de Capitanía).
- La firma solo la puede hacer el jefe calculado o Capitanía.

## Relacionado con
`docs/modulos/guardia.md`, `docs/datos/er-personal.md`.
