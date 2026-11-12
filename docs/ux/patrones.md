# Patrones de interacción

## Lista → detalle con URL propia
Cada colección tiene `/recurso` y `/recurso/:id`. El detalle se puede compartir
y recargar. En el celular, la lista usa tarjetas; en escritorio, tabla.

## Lista adaptable
`ResponsiveList` muestra tarjetas bajo 768 px y tabla desde 768 px. Cada fila
tiene una acción principal y, si aplica, un menú secundario.

## Filtros
- Celular: hoja inferior o barra compacta.
- Escritorio: barra horizontal.
- Los filtros activos se muestran como chips y se pueden quitar.

## Formularios
- Una columna, por secciones.
- Validación en línea con zod.
- Barra de guardar fija abajo en el celular.
- Borrador automático cuando el formulario es largo (pendiente para altas
  masivas).
- Confirmación explícita para acciones irreversibles, con motivo.

## Pestañas en el detalle
La hoja de vida usa: Resumen · Asistencia · Cargos · Formación · Premios ·
Material · Documentos · Sensibles. La pestaña Sensibles es visible solo si hay
permiso y muestra un aviso de confidencialidad.

## Estados
- **Vacío con acción**: explica qué falta y ofrece el botón para crearlo.
- **Cargando**: skeletons, nunca pantalla en blanco.
- **Error**: mensaje humano y opción de reintentar o volver.
- **Toast**: confirma acciones; "deshacer" solo cuando es seguro.

## Pase de lista
- Encabezado fijo con contador `A · F · P · sin marcar`.
- Una fila por bombero, ordenada por registro.
- Botones grandes A/F/P y menú para R/S/L.
- Situaciones vigentes premarcadas con explicación.
- "Marcar resto como Falta" y "Cerrar lista" con resumen y plazo.
- Guarda en IndexedDB; sincroniza con upsert idempotente y avisa conflictos.

## Indicadores de conexión
- Badge "En línea", "Sin conexión" o "N marcas por sincronizar".
- En la barra superior, siempre visible.

## Búsqueda global
En escritorio, `Ctrl K` abre el buscador (pendiente de implementar el
command palette; la búsqueda por sección ya existe).

## Relacionado con
`docs/ux/componentes.md`, `app/src/components/common/`.
