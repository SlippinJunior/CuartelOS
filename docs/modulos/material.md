# Módulo · Material

**Estado:** 🧱 esqueleto + mock 2D

## Alcance comprometido
- Inventario gráfico por lado del carro (foto o SVG).
- Cajoneras y subcajoneras tocables; coordenadas guardadas.
- Inventario por cajonera y revisión en terreno.
- Vestuario y EPP a cargo del bombero.
- Documentos de unidad con vencimiento.
- Bitácora de km y horas de bomba.

## Artículos y documentos
- P8 Hoja de cargo de vestuario y EPP.
- P9 Certificado de paz y salvo.
- P10 Bitácora e informe de unidades.
- P18 Inventarios de apertura.
- R07 ítem malo, R08 sin revisión, R09 documento por vencer.

## Modelo listo
`material.unidad`, `unidad_vista`, `ubicacion`, `articulo`, `item`,
`asignacion`, `mantencion`, `revision_inventario`, `revision_detalle`,
`bitacora_unidad`.

## Pendiente
- Editor de zonas sobre la foto (Etapa 3).
- Revisión en terreno con cámara y firma.
- Alertas de vida útil y reposición.

## Relacionado con
`docs/datos/er-material.md`, `app/src/features/material/README.md`.
