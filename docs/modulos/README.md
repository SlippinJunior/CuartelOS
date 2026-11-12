# Módulos

## Propósito
Un archivo por módulo con alcance, artículos del reglamento, puntos de
impresión y estado actual. Es la referencia funcional para construir.

## Contenido
`inicio`, `personal`, `asistencia`, `guardia`, `material`, `tesoreria`,
`secretaria`, `documentos`, `administracion`, `disciplina`.

## Cómo se usa
- Antes de una historia de usuario, lee el módulo.
- El estado (`✅ funcional`, `🧱 esqueleto`, `📄 documentado`) se actualiza al
  cerrar una etapa.
- Si un requisito no está claro, se anota en *Preguntas abiertas*.

## Convenciones
- Citar el artículo cuando exista (p. ej. art. 188).
- Indicar el punto de impresión P1–P23.
- No duplicar el modelo de datos: enlazar al ER.

## Relacionado con
`docs/datos/`, `app/src/features/`.
