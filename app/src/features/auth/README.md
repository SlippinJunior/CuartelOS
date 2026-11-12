# features/auth/ · Sesión y consentimiento

## Propósito
Login por invitación, recuperación de contraseña, establecimiento de contraseña
desde el enlace y consentimiento informado de datos personales.

## Contenido
| Archivo | Rol |
|---|---|
| `sesion.tsx` | Contexto de sesión, `usePerfil`, `useRoles` |
| `LoginPage.tsx` | Correo + contraseña; atajos a usuarios demo |
| `RecuperarPage.tsx` | Envío del enlace de recuperación |
| `EstablecerPage.tsx` | Nueva contraseña desde la invitación |
| `ConsentimientoPage.tsx` | Texto versionado y aceptación obligatoria |

## Cómo se usa
`AppShell` redirige a `/login` sin sesión y a `/consentimiento` si el perfil
trae `consentimiento.aceptado = false`. La aceptación se guarda con
`nucleo.aceptar_consentimiento()`, que registra IP y agente.

## Convenciones
- No existe registro abierto (`enable_signup = false`).
- El consentimiento se pide por versión: si cambia el texto, se vuelve a pedir.
- El texto actual es un borrador legal, no definitivo.

## Relacionado con
`docs/arquitectura/seguridad.md`, migración `…_seguridad.sql`.
