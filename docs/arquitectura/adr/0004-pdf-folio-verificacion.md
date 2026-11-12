# ADR 0004 · PDF con folio, hash y verificación pública

- **Estado:** aceptado (con respaldo técnico)
- **Fecha:** 2026-11-12

## Contexto
Los documentos P1–P23 deben llevar folio, fecha, QR y firma. Compilar Typst en
una Edge Function puede chocar con el límite de CPU y el tamaño de las fuentes.
El plan contempla un plan B con `typst.ts` en el navegador.

## Decisión
Mantener el contrato definitivo: folio correlativo por tipo y año, SHA-256 del
PDF, token público, Storage privado y `/verificar/:token`. Para la Etapa 1 la
Edge Function genera el PDF con `pdf-lib` (sin dependencia de fuentes externas).
La plantilla Typst queda como diseño canónico para la fase F.

## Consecuencias
- La emisión funciona desde el primer día y se puede probar de punta a punta.
- El diseño visual del PDF puede evolucionar sin cambiar folio, hash ni
  verificación.
- El navegador no necesita WASM ni fuentes para emitir.
- Si se migra a Typst, solo cambia el generador; el registro y la verificación
  se mantienen.
