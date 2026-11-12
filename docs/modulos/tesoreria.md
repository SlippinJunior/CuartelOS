# Módulo · Tesorería

**Estado:** ✅ cuotas, cartola y proyección; conciliación en Etapa 2

## Alcance comprometido
- Cartola con saldo corriente por cuenta.
- Flujo Comprometido → Devengado → Pagado.
- Gastos e ingresos recurrentes.
- Presupuesto por categoría y ejecución anual.
- Proyección y escenarios a 3/6/12 meses.
- Cuotas sociales y campaña económica.
- Cierre mensual con conciliación bancaria.
- Rendición de fondos públicos (P14) y balance (P21).

## Artículos y documentos
- P13 Estado financiero mensual y cuadro de deudas.
- P14 Rendición de fondos públicos (Res. 30/2015 CGR).
- P21 Balance anual de ingresos y gastos.
- P22 Informe de beneficios y donaciones.

## Reglas
- Los movimientos no se borran; se anulan con motivo.
- Un período cerrado bloquea nuevos movimientos.
- El fondo por defecto es "Fondos propios"; los públicos exigen rendición.
- La ejecución se calcula por categoría y año.

## Vistas ya creadas
`v_cartola`, `v_presupuesto_ejecucion`, `v_compromisos_pendientes`,
`v_cuotas_pendientes`, `v_saldo_campana` y `fn_proyeccion`.

## Implementado en esta etapa
- Grilla anual de cuotas por bombero (12 meses), con estados pagada, pendiente, exenta, condonada, futura y no aplica.
- Registro de pago con monto, fecha, medio y documento. La RPC `registrar_pago_cuota` crea el ingreso en la cartola en la misma transacción.
- Anulación de pago con motivo; anula también el movimiento.
- Cartola real con saldo corriente, categoría y fondo (`v_cartola_detalle`).
- Proyección real con `fn_proyeccion`.
- Valor de cuota configurable por año.

## Pendiente
- Conciliación mensual con cartola bancaria.
- Registro manual de movimientos desde la interfaz.
- Folio y firma de P13/P14/P21.

## Relacionado con
`docs/datos/er-tesoreria.md`, `app/src/features/tesoreria/README.md`.
