# features/administracion/ · Administración

## Propósito
Gestionar usuarios y roles manuales, catálogos y parámetros del sistema.

## Contenido
`AdministracionPage.tsx` con cuatro pestañas:
- **Usuarios y permisos**: invitar por Edge Function, asignar/revocar roles (bloques automáticos por categoría) y definir excepciones puntuales por módulo (`PermisosUsuarioDialog.tsx`).
- **Unidades**: crear y editar unidades de material mayor (`UnidadesAdminTab.tsx`).
- **Catálogos**: tipos de acto (claves) y cargos.
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
