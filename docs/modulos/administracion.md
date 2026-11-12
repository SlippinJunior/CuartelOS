# Módulo · Administración

**Estado:** ✅ funcional (Etapa 1)

## Alcance
- Invitar usuarios por correo (sin registro abierto).
- Asignar y revocar roles con fechas y motivo.
- Ver usuarios vinculados a personas.
- Editar catálogos: tipos de acto (completar las 34 claves del legado) y cargos.
- Editar parámetros: antigüedad mínima, plazo de listas, meses de aviso,
  premio honorario, moneda.

## Reglas
- Solo Director y admin.
- `seguridad` no se expone: todo pasa por RPC.
- Los roles son manuales y no dependen del cargo.
- Cada asignación queda con `asignado_por`, `desde`, `hasta` y `motivo`.

## Pendiente
- Reactivar/desactivar usuarios.
- Historial visual de cambios de rol.
- Catálogo de feriados.

## Relacionado con
`docs/arquitectura/seguridad.md`, `app/src/features/administracion/README.md`.
