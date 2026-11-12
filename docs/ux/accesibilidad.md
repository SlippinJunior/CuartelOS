# Accesibilidad

## Objetivo
Que un bombero pueda usar el sistema en el cuartel, con poca luz, guantes o
vista cansada, y que un lector de pantalla entienda la estructura.

## Reglas
- **Tamaño táctil:** mínimo 44×44 px y separación de 8 px.
- **Contraste:** WCAG AA (4.5:1 para texto normal, 3:1 para texto grande).
- **Foco visible:** anillo de 2 px con `--anillo`.
- **Idioma:** `lang="es-CL"` en el HTML.
- **Formularios:** cada input con `Label` y mensaje de error asociado.
- **Iconos solos:** `aria-label` descriptivo.
- **Diálogos:** `<dialog>` nativo con foco atrapado y cierre con Escape.
- **Tablas:** encabezados semánticos; en celular se reemplazan por tarjetas.
- **Estados:** no depender solo del color; usar texto (Al día, Vencido).
- **Movimiento:** respetar `prefers-reduced-motion` en animaciones futuras.
- **Zoom:** no bloquear el zoom; el viewport no usa `user-scalable=no`.

## Pruebas manuales
1. Navegar todo el pase de lista solo con teclado.
2. Cambiar a modo oscuro y revisar contraste.
3. Usar un lector de pantalla en la ficha y en la verificación pública.
4. Probar con el celular a pleno sol y con guantes.
5. Revisar que los errores se anuncien y expliquen cómo corregir.

## Pendiente
- Auditoría automatizada con axe.
- Revisión con usuarios reales de la compañía.
- Atajos de teclado documentados.

## Relacionado con
`docs/ux/guia-de-diseno.md`, `docs/ux/componentes.md`.
