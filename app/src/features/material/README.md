# features/material/ · Material mayor (esqueleto + mock 2D)

## Propósito
Validar la idea del inventario gráfico: una vista por lado del carro con
cajoneras tocables y artículos por zona.

## Contenido
`MaterialPage.tsx`: camión SVG estático, tres vistas (izquierda, derecha,
trasera) y panel de inventario. Los datos son ficticios y viven en el
componente; no se guardan.

## Cómo se usa
Toca una cajonera en el dibujo o en la lista para ver su contenido. El mock
sirve para acordar el diseño antes de construir el editor de zonas.

## Convenciones
- En la Etapa 3 la imagen será una foto o SVG en Storage y `forma` guardará el
  polígono normalizado 0–1 en `material.ubicacion`.
- El inventario real usa `material.item`, `articulo`, `ubicacion` y
  `revision_detalle`.

## Relacionado con
`docs/modulos/material.md`, `docs/datos/er-material.md`.
