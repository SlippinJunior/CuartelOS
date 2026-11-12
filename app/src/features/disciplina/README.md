# features/disciplina/ · Disciplina (esqueleto)

## Propósito
Aislar los expedientes del Consejo de Disciplina en su propio esquema y
permisos, separados de `personal`.

## Contenido
`DisciplinaPage.tsx` con el alcance. Tablas: `expediente`, `sancion`,
`medida_preventiva` y `plazo_disciplinario`.

## Cómo se usa
Solo el rol `consejo` ve expedientes, medidas y plazos. El Director ve
únicamente las sanciones ya ejecutoriadas. Un bombero no ve nada. RLS lo
garantiza y pgTAP lo prueba.

## Convenciones
- Art. 125 B 25: reserva de los antecedentes.
- Las notificaciones (P16) exigen folio y verificación.
- La incompatibilidad oficial ↔ consejo se valida en `cargo_periodo`.

## Relacionado con
`docs/modulos/disciplina.md`, migración `…_disciplina.sql`.
