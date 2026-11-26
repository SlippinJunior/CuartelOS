# Módulos

## Propósito
Un archivo por módulo con alcance, artículos del reglamento, puntos de impresión y estado actual. Es la referencia funcional para construir y reducir consumo de contexto.

## Contenido
`inicio`, `tablero`, `personal`, `asistencia`, `guardia`, `material`, `tesoreria`, `secretaria`, `documentos`, `estadisticas`, `administracion`, `disciplina`.

## Cómo se usa
- Antes de modificar un módulo, lee su `.md` aquí y el `README.md` de su carpeta en `app/src/features/`.
- El estado (`✅ funcional`, `🟡 base`, `🧱 esqueleto`, `📄 documentado`) se actualiza al cerrar cada entrega.

## Convenciones
- Citar el artículo cuando exista (p. ej. art. 188).
- Indicar el punto de impresión P1–P23.
- No duplicar el modelo de datos: enlazar al ER o migración.

## Relacionado con
`docs/datos/`, `docs/hoja-de-ruta.md`, `app/src/features/`.
