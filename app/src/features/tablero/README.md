# Feature · Tablero de Cuartel

## Propósito
Homepage unificado de consulta rápida para las 5 fuentes oficiales (Órdenes del día, Órdenes de capitanía, Circulares CBL, Circulares de compañía y Citaciones) y modo kiosco exclusivo para el rol `cuartel`.

## Contenido
- `TableroCuartel.tsx`: vista principal con orden del día vigente, guardia de hoy, filtros y tarjetas.
- `DialogoPublicar.tsx`: publicación guiada + subida/generación PDF + despacho Portal/Correo/WhatsApp.
- `DialogoDetalleComunicado.tsx`: lector amplio, descarga PDF, verificación QR y monitor de despacho.
- `MonitorDespacho.tsx`: trazabilidad por destinatario y botón de reintento.
- `logica.ts` y `logica.test.ts`: filtros, conteos y vigencia.

## Relacionado con
`docs/modulos/tablero.md`, `app/src/features/inicio/InicioPage.tsx`.
