# Diccionario de datos

## Cómo se genera
El diccionario se construye desde PostgreSQL, porque cada tabla y columna no
obvia tiene `comment on`. No se mantiene a mano: se ejecuta la consulta y se
exporta.

```sql
select
  c.table_schema as esquema,
  c.table_name as tabla,
  obj_description(format('%I.%I', c.table_schema, c.table_name)::regclass, 'pg_class') as proposito,
  c.column_name as columna,
  c.data_type as tipo,
  col_description(format('%I.%I', c.table_schema, c.table_name)::regclass, c.ordinal_position) as descripcion,
  c.is_nullable
from information_schema.columns c
where c.table_schema in ('nucleo','seguridad','personal','asistencia','operaciones',
                         'material','tesoreria','secretaria','disciplina','documentos')
order by c.table_schema, c.table_name, c.ordinal_position;
```

Para volcarlo a CSV:
```bash
psql "$DATABASE_URL" -c "\copy (select ...) to 'data/privado/diccionario.csv' csv header"
```

## Catálogo por esquema
| Esquema | Tablas principales | Para qué |
|---|---|---|
| `nucleo` | `compania`, `parametro`, `feriado`, `contraparte`, `alerta`, `regla_alerta`, `staging_importacion` | Configuración y cruces |
| `seguridad` | `usuario`, `usuario_rol`, `consentimiento_texto`, `consentimiento`, `auditoria` | Identidad y trazabilidad |
| `personal` | `persona`, `persona_evento`, `persona_dato_sensible`, `licencia_conducir`, `antiguedad_abono`, `cargo`, `cargo_periodo`, `curso`, `persona_curso`, `premio_tipo`, `persona_premio`, `situacion_especial`, `postulacion` | Ficha y hoja de vida |
| `asistencia` | `tipo_acto`, `lista`, `asistencia` | Libro de asistencia |
| `operaciones` | `orden_capitania`, `guardia_ciclo`, `guardia_turno`, `guardia_integrante`, `guardia_situacion`, `guardia_notificacion`, `accidente_servicio` | Capitanía y guardias |
| `material` | `tipo_unidad`, `unidad`, `unidad_documento`, `unidad_vista`, `ubicacion`, `categoria_articulo`, `articulo`, `item`, `asignacion`, `mantencion`, `revision_inventario`, `revision_detalle`, `bitacora_unidad` | Material mayor y menor |
| `tesoreria` | `cuenta`, `fondo`, `categoria`, `presupuesto`, `presupuesto_linea`, `movimiento`, `compromiso`, `recurrente`, `escenario`, `escenario_ajuste`, `cuota_valor`, `cuota_pago`, `cierre_mensual`, `campana`, `talonario`, `campana_participacion`, `beneficio`, `donacion` | Dinero |
| `secretaria` | `tipo_sesion`, `acta`, `acuerdo`, `correspondencia`, `eleccion`, `candidatura`, `traspaso_cargo` | Libro de actas |
| `disciplina` | `expediente`, `sancion`, `medida_preventiva`, `plazo_disciplinario` | Consejo reservado |
| `documentos` | `archivo`, `tipo_documento` (P1–P23), `documento_emitido`, `folio_contador` | PDF y verificación |

## Convenciones de nombres
- Tablas en singular (`persona`, no `personas`).
- PK `id`; claves naturales con sufijo `codigo` o `clave`.
- Booleanos afirmativos (`activo`, `anulado`, `ejecutoriada`).
- Fechas `fecha_*`; instantes `*_en` (`creado_en`, `emitido_en`).
- Montos sin sufijo (`monto`, `valor`, `costo`) y en CLP.

## Relacionado con
`docs/datos/normalizacion.md`, `supabase/migrations/`.
