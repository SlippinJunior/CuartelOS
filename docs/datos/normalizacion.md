# Normalización y correcciones al legado

## Problemas detectados y corrección

| # | Problema | Corrección |
|---|---|---|
| 1 | Texto libre donde debe haber catálogo (`cargo_periodo.cargo`, `premio.tipo`, `unidad.tipo`, `articulo.categoria`, `acta.tipo`, `movimiento.medio_pago`) | Tablas catálogo con FK (`material.tipo_unidad`, `personal.cargo`, `personal.premio_tipo`, `material.categoria_articulo`, `secretaria.tipo_sesion`) o enums |
| 2 | `item_inventario.ubicacion = 'Cajonera 5.1'` | `material.ubicacion` jerárquica con `padre_id`, `codigo`, `forma` |
| 3 | `movimiento.categoria_id` y `presupuesto_linea_id` pueden contradecirse | La línea se define por `(presupuesto, categoria)`; la ejecución se calcula por categoría y año |
| 4 | `presupuesto_linea.tipo` repite `categoria.tipo` | Se elimina; se deriva de la categoría |
| 5 | `contraparte` como texto | `nucleo.contraparte` compartida |
| 6 | Sin cuenta, fondo, compromisos ni recurrentes | `cuenta`, `fondo`, `compromiso`, `recurrente`, `escenario` |
| 7 | `adjunto` polimórfico y `*_path` repetidos | `documentos.archivo` con FK real |
| 8 | Grupo sanguíneo en `persona` | `personal.persona_dato_sensible` 1:1 |
| 9 | `persona.estado` y `rango` sin historial | `personal.persona_evento` como fuente de verdad; trigger mantiene la caché |
| 10 | `guardia` una fila por persona | `operaciones.guardia_turno` + `guardia_integrante` |
| 11 | Vencimientos fijos en `unidad` | `material.unidad_documento` |
| 12 | `acta.presentes` y `permisos` duplicados | Se derivan de la lista |
| 13 | `cierre_mensual` guarda cálculos que se desfasan | Vistas calculan; el cierre fija saldo de cartola y saldo libro |
| 14 | `acuerdo_movimiento` sin compromiso | `acuerdo` → `compromiso` → `movimiento` |
| 15 | El consejo lee todo | Solo `disciplina` y lo mínimo de personal |
| 16 | `grant execute on all functions` | Funciones internas en `seguridad`; RPC explícitas |
| 17 | Auditoría sin IP | Se lee `request.headers->>'x-forwarded-for'` |
| 18 | Faltan tablas de postulación, situaciones, licencias, accidentes, elecciones, traspaso | Creadas en la Etapa 1 |
| 19 | Errores del seed | Corregidos en `scripts/importar-legado/`; lo dudoso va a staging |

## Reglas de integridad implementadas en la base
- Lista cerrada o enviada no se edita sin motivo (trigger + auditoría).
- `cargo_periodo` impide superposición de cargos únicos e incompatibilidad
  oficial ↔ consejo (art. 44).
- Un movimiento no se borra; se anula con motivo.
- No se registran movimientos en un período cerrado.
- Un artículo con serie exige cantidad 1.
- `persona_evento` es el único camino para cambiar el estado o rango actual.
- `documento_emitido` mantiene folio correlativo por tipo y año.

## Decisiones de tipos
- CLP sin decimales: `numeric(14,0)`.
- Fechas de negocio: `date`. Marcas de tiempo: `timestamptz`.
- Porcentajes: se calculan, no se guardan.
- Estados y rangos: enums con `comment on`.

## Relacionado con
`docs/arquitectura/adr/0001-esquemas-por-dominio.md`,
`scripts/importar-legado/`.
