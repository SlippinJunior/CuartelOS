# ER · Personal y asistencia

```mermaid
erDiagram
  persona ||--o{ persona_evento : "historial estado/rango"
  persona ||--o| persona_dato_sensible : "1 a 1"
  persona ||--o{ licencia_conducir : tiene
  persona ||--o{ cargo_periodo : ejerce
  cargo ||--o{ cargo_periodo : define
  persona ||--o{ persona_curso : aprueba
  curso ||--o{ persona_curso : ""
  persona ||--o{ persona_premio : recibe
  premio_tipo ||--o{ persona_premio : ""
  persona ||--o{ situacion_especial : "licencia, embarazo, accidente"
  persona ||--o{ asignacion : "material a cargo"
  persona ||--o{ asistencia : marca
  lista ||--o{ asistencia : contiene
  tipo_acto ||--o{ lista : clasifica

  persona {
    uuid id PK
    int registro UK
    text rut UK
    text nombres
    text apellido_paterno
    text apellido_materno
    date fecha_nacimiento
    date fecha_ingreso
    rango rango "cache via trigger"
    estado estado_persona "cache via trigger"
  }
  persona_evento {
    bigint id PK
    uuid persona_id FK
    tipo tipo_evento
    rango rango
    estado estado_persona
    date fecha
    text motivo
  }
  persona_dato_sensible {
    uuid persona_id PK
    text grupo_sanguineo
    text alergias
    text contacto_emergencia_nombre
  }
  cargo_periodo {
    bigint id PK
    uuid persona_id FK
    bigint cargo_id FK
    date desde
    date hasta
  }
  lista {
    bigint id PK
    int anio
    int numero
    date fecha
    text tipo_acto_clave FK
    estado_lista estado
    bool es_abono
    text abono_justificacion
  }
  asistencia {
    bigint lista_id PK
    uuid persona_id PK
    marca marca
    uuid registrado_por
  }
```

## Reglas
- `persona.estado` y `persona.rango` son caché: solo cambian al insertar un
  `persona_evento`.
- El alta crea automáticamente un evento `alta`.
- `cargo_periodo` valida exclusividad y la incompatibilidad oficial ↔ consejo.
- Los datos sensibles no se leen directo: `personal.leer_dato_sensible()`.
- El porcentaje de asistencia excluye R y S del denominador.

## Vistas
| Vista | Uso |
|---|---|
| `personal.v_asistencia_persona` | A/F/P/% por año |
| `personal.v_hoja_vida` | JSON completo para el PDF P3 |
| `personal.v_plazos` | Licencias por vencer |
| `asistencia.lista` | Estado y cierre de listas |

## Relacionado con
`docs/datos/normalizacion.md`, `docs/modulos/personal.md`.
