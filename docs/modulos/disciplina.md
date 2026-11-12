# Módulo · Disciplina

**Estado:** 🧱 esqueleto (modelo y RLS listos)

## Alcance
- Expedientes del Consejo de Disciplina, aislados en su esquema.
- Sanciones, medidas preventivas y control de plazos.
- Solo el rol `consejo` ve el expediente completo.
- El Director ve únicamente sanciones ejecutoriadas.
- Notificaciones (P16) con folio y verificación.

## Reglas
- Art. 125 B 25: reserva de antecedentes.
- La incompatibilidad oficial ↔ consejo se controla en `cargo_periodo`.
- Un bombero no ve ningún expediente ni sanción.
- Toda lectura y cambio queda auditado.

## Modelo listo
`disciplina.expediente`, `sancion`, `medida_preventiva`, `plazo_disciplinario`,
con FK a `personal.persona` y `secretaria.acta`.

## Pendiente
- Pantalla del Consejo (Etapa 5).
- Notificación y firma.
- Plazos con alertas propias.

## Relacionado con
`docs/arquitectura/seguridad.md`, `app/src/features/disciplina/README.md`.
