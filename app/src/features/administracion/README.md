# features/administracion/ · Administración

## Propósito
Gestionar usuarios y roles manuales, catálogos y parámetros del sistema.

## Contenido
`AdministracionPage.tsx` con tres pestañas:
- **Usuarios y roles**: invitar por Edge Function, asignar y revocar roles con
  fechas y motivo.
- **Catálogos**: tipos de acto (completar descripciones del legado) y cargos.
- **Parámetros**: antigüedad mínima, plazo de listas, meses de aviso, etc.

## Cómo se usa
Solo Director y admin (validado también por RLS y por las RPC
`admin_asignar_rol` / `admin_revocar_rol`). Las invitaciones se envían desde
`invitar-usuario` y se ven en Inbucket en local.

## Convenciones
- Los roles no se derivan del cargo: se asignan a mano.
- Toda asignación queda con `asignado_por`, fechas y motivo.
- `teniente` se reemplaza por `teniente_1`, `teniente_2` y `teniente_3`.

## Relacionado con
`docs/modulos/administracion.md`, `docs/arquitectura/seguridad.md`.
