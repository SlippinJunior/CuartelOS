# ER · Material mayor y menor

```mermaid
erDiagram
  tipo_unidad ||--o{ unidad : ""
  unidad ||--o{ unidad_vista : "izquierda derecha trasera techo"
  unidad ||--o{ ubicacion : "cabina, cajoneras"
  unidad_vista ||--o{ ubicacion : "zona dibujada"
  ubicacion ||--o{ ubicacion : "subcajonera 5.1"
  ubicacion ||--o{ item : guarda
  articulo ||--o{ item : ""
  categoria_articulo ||--o{ articulo : ""
  unidad ||--o{ unidad_documento : "revisión técnica, seguro"
  unidad ||--o{ bitacora_unidad : "km, horas bomba"
  item ||--o{ asignacion : "a cargo de bombero"
  item ||--o{ revision_detalle : "revisión"

  unidad_vista {
    bigint id PK
    bigint unidad_id FK
    lado lado
    uuid imagen_archivo_id FK
  }
  ubicacion {
    bigint id PK
    bigint unidad_id FK "null es bodega"
    bigint padre_id FK
    bigint vista_id FK
    text codigo "C5.1"
    text nombre "Cajonera 5.1"
    jsonb forma "polígono normalizado 0 a 1"
  }
  item {
    bigint id PK
    bigint articulo_id FK
    bigint ubicacion_id FK
    numeric cantidad
    estado_item estado
    text n_serie
  }
```

## Cómo se dibuja la vista 2D
1. `unidad_vista` guarda la foto o SVG de un lado.
2. `ubicacion.forma` guarda un polígono `[[x,y], …]` normalizado 0–1.
3. Al tocar una zona, la app busca los `item` con esa `ubicacion_id` (o sus
   hijas) y muestra el contenido.
4. `revision_inventario` y `revision_detalle` registran la revisión en terreno.

## Reglas
- Una subcajonera (`C5.1`) cuelga de su padre (`C5`).
- `unidad_id` nulo representa la bodega del cuartel.
- Un artículo con `requiere_serie` exige cantidad 1.
- Los documentos de unidad vencen y generan alertas R09.

## Vistas
`material.v_inventario` y `material.v_plazos`.

## Relacionado con
`docs/modulos/material.md`, `app/src/features/material/`.
