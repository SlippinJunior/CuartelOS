# Módulo · Personal

**Estado:** ✅ funcional (Etapa 1)

## Alcance
- Lista con búsqueda por nombre, registro, RUT y filtros por estado y rango.
- Ficha con pestañas: Resumen, Asistencia, Cargos, Formación, Premios,
  Material, Documentos y Sensibles.
- Alta y edición con validación.
- Eventos de estado y rango (fuente de verdad).
- Cargos con fechas y acta.
- Cursos ANB, premios y distinciones.
- Licencia de conducir y situaciones especiales.
- Datos sensibles separados, con aviso de confidencialidad y lectura auditada.
- Emisión de hoja de vida (P3).

## Artículos y documentos
- Art. 44: incompatibilidad oficial ↔ consejo.
- Art. 49: Miembro Honorario a los 35 años (parámetro).
- P3 Hoja de vida, P12 premios de constancia, P19 nómina anual.

## Reglas
- La antigüedad se calcula desde `fecha_ingreso` y abonos.
- `persona_evento` es el único camino para cambiar rango/estado.
- Los datos sensibles no entran al PDF P3.
- Cada lectura sensible deja auditoría con IP.
- Años de servicio = premios de constancia + abonos, con ajuste manual solo
  para Director, Secretario y admin (ver `docs/modulos/guardia.md`).
- Rango y estado se cambian con un evento, no editando la ficha.

## Pendiente
- Editor de hoja de vida en PDF con Typst.
- Postulaciones (P1/P2) con flujo completo.
- Premios de constancia con arrastre de quinquenios (Etapa 4).

## Relacionado con
`docs/datos/er-personal.md`, `app/src/features/personal/README.md`.
