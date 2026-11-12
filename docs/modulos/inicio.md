# Módulo · Inicio

**Estado:** ✅ funcional

## Alcance
- Pantalla distinta según el rol.
- Tarjetas: tareas pendientes, alertas abiertas y compromisos.
- Accesos rápidos: pasar lista, mi hoja de vida, mis cuotas, registrar
  movimiento, emitir documento.
- El bombero sin cargo ve una versión mínima: su hoja de vida, asistencia,
  material a cargo, cuotas y documentos.

## Reglas
- Las alertas solo se muestran a la oficialidad.
- Las tareas de lista se calculan con el plazo de 48 h.
- Un consejero no ve asuntos financieros ni personales completos.

## Implementación
`nucleo.panel_inicio()` arma el JSON; `features/inicio/InicioPage.tsx` lo pinta.
El menú se deriva de `lib/permisos.ts`.

## Pendiente
- Notificaciones push de plazos (Etapa 2+).
- Preferencias de accesos rápidos por usuario.

## Relacionado con
`docs/ux/guia-de-diseno.md`, `app/src/features/inicio/README.md`.
