# features/tesoreria/ · Tesorería (esqueleto + mock)

## Propósito
Mostrar el rumbo de la Etapa 2: cartola con saldo corriente, compromisos,
recurrentes y proyección de saldo, más la vista personal de cuotas.

## Contenido
| Archivo | Rol |
|---|---|
| `TesoreriaPage.tsx` | Mock de cartola, proyección a 6 meses y ejecución presupuestaria |
| `MiTesoreriaPage.tsx` | Vista real de cuotas y campaña del bombero (`/mis-cuotas`) |

## Cómo se usa
El mock usa cifras ficticias para validar la lectura en celular y escritorio.
La vista `/mis-cuotas` sí consulta `tesoreria.cuota_pago` y
`campana_participacion` con RLS.

## Convenciones
- Los movimientos no se borran: se anulan con motivo.
- Un período cerrado bloquea nuevos movimientos.
- La ejecución se calcula por categoría y año, no por doble vínculo.
- La proyección usa `tesoreria.fn_proyeccion(meses, escenario)`.

## Relacionado con
`docs/modulos/tesoreria.md`, `docs/datos/er-tesoreria.md`.
