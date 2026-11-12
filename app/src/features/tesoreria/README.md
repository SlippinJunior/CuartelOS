# features/tesoreria/ · Tesorería (esqueleto + mock)

## Propósito
Mostrar el rumbo de la Etapa 2: cartola con saldo corriente, compromisos,
recurrentes y proyección de saldo, más la vista personal de cuotas.

## Contenido
| Archivo | Rol |
|---|---|
| `TesoreriaPage.tsx` | Grilla anual de cuotas, cartola real y proyección |
| `MiTesoreriaPage.tsx` | Vista real de cuotas y campaña del bombero (`/mis-cuotas`) |

## Cómo se usa
- La pestaña **Cuotas** muestra la grilla de 12 meses y permite registrar el
  pago. La RPC `registrar_pago_cuota` crea el ingreso en la cartola.
- La pestaña **Cartola** lee `v_cartola_detalle` y refleja el movimiento recién
  creado.
- La pestaña **Proyección** usa `fn_proyeccion`.
- La vista `/mis-cuotas` muestra las cuotas del propio bombero.

## Convenciones
- Los movimientos no se borran: se anulan con motivo.
- Un período cerrado bloquea nuevos movimientos.
- La ejecución se calcula por categoría y año, no por doble vínculo.
- La proyección usa `tesoreria.fn_proyeccion(meses, escenario)`.

## Relacionado con
`docs/modulos/tesoreria.md`, `docs/datos/er-tesoreria.md`.
