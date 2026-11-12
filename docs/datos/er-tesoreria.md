# ER · Tesorería

```mermaid
erDiagram
  cuenta ||--o{ movimiento : registra
  fondo ||--o{ movimiento : "origen propio o público"
  categoria ||--o{ movimiento : imputa
  categoria ||--o{ presupuesto_linea : ""
  presupuesto ||--o{ presupuesto_linea : ""
  contraparte ||--o{ movimiento : ""
  compromiso ||--o{ movimiento : "se paga con"
  acuerdo ||--o{ compromiso : origina
  categoria ||--o{ recurrente : ""
  escenario ||--o{ escenario_ajuste : simula
  cuenta ||--o{ cierre_mensual : concilia
  persona ||--o{ cuota_pago : paga
  movimiento ||--o| cuota_pago : respalda

  compromiso {
    bigint id PK
    text descripcion
    numeric monto
    date fecha_estimada
    estado_compromiso estado "comprometido devengado pagado anulado"
    bigint acuerdo_id FK
  }
  recurrente {
    bigint id PK
    tipo_movimiento tipo
    numeric monto_estimado
    frecuencia frecuencia
    date desde
    date hasta
  }
  movimiento {
    bigint id PK
    date fecha
    tipo_movimiento tipo
    numeric monto
    text glosa
    bool anulado
    text motivo_anulacion
  }
```

## Flujo
```mermaid
flowchart LR
  A[Acuerdo con monto] --> C[Compromiso]
  C --> D[Devengado]
  D --> M[Movimiento / pago]
  M --> V[Cartola con saldo]
  R[Recurrente] --> P[Proyección]
  C --> P
  E[Escenario + ajustes] --> P
```

## Vistas y funciones
| Objeto | Devuelve |
|---|---|
| `tesoreria.v_cartola` | Movimientos con saldo corriente por cuenta |
| `tesoreria.v_presupuesto_ejecucion` | Ejecutado por categoría y año, con % |
| `tesoreria.v_compromisos_pendientes` | Monto menos pagado |
| `tesoreria.v_cuotas_pendientes` | Meses adeudados del año |
| `tesoreria.v_saldo_campana` | Saldo a favor para EPP |
| `tesoreria.fn_proyeccion(meses, escenario)` | Saldo mes a mes |

## Reglas
- `movimiento` no se borra: se anula con motivo.
- No se insertan movimientos en un período con `cierre_mensual`.
- El cierre guarda saldo de cartola y saldo libro; no recalcula ingresos.
- El fondo por defecto es "Fondos propios"; los públicos exigen rendición P14.

## Relacionado con
`docs/modulos/tesoreria.md`, `app/src/features/tesoreria/`.
