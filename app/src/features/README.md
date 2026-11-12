# app/src/features/ · Módulos funcionales

## Propósito
Cada carpeta es un módulo del ERP y se corresponde con un esquema de la base
(o con una función transversal). Dentro viven páginas, consultas y diálogos del
módulo; no se comparten estados entre módulos.

## Contenido
`auth`, `inicio`, `personal`, `asistencia`, `guardia`, `material`, `tesoreria`,
`secretaria`, `documentos`, `administracion`, `verificar`, `disciplina`.

## Cómo se usa
Una feature nueva sigue este orden:
1. README con alcance y artículos.
2. Página(s) `*Page.tsx` y ruta en `app/router.tsx`.
3. Consultas con React Query y `db.<esquema>`.
4. Permisos en `lib/permisos.ts`.
5. Pruebas unitarias o e2e si aporta.

## Convenciones
- Los nombres de archivos y carpetas van en minúsculas.
- No se importan páginas de otra feature; lo común sube a `components/common`.
- Cada feature debe funcionar con RLS real, aunque la UI oculte acciones.

## Relacionado con
`docs/modulos/`, `supabase/migrations/`.
