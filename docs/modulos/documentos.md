# Módulo · Documentos

**Estado:** ✅ funcional para P3 (Etapa 1)

## Alcance
- Catálogo P1–P23 con nombre, módulo y firma requerida, más `ACTA` y
  `ORDEN_CAPITANIA`.
- Emisión de hoja de vida (P3), actas de reunión y órdenes de capitanía con
  folio correlativo por tipo y año, SHA-256, QR y Storage privado.
- Verificación pública por token, sin datos personales.
- Órdenes de capitanía visibles para todos los bomberos y enviadas por correo.
- Historial y anulación con motivo.

## Cómo funciona
1. La app llama a la Edge Function `emitir-documento`.
2. La función verifica que el emisor sea oficial, lee `personal.v_hoja_vida`,
   reserva folio, genera el PDF, sube el archivo y registra la emisión.
3. El QR apunta a `/verificar/:token`; la RPC
   `documentos.verificar_documento()` responde como `anon`.
4. Anular cambia el estado a inválido y deja auditoría.

## Reglas
- Folio sin saltos por tipo y año.
- El hash permite comprobar que el PDF no fue alterado.
- El documento anulado sigue existiendo; solo pasa a inválido.
- La verificación no expone RUT, nombre ni datos sensibles.

## Pendiente
- Emisión de P13, P14, P21 y actas.
- Firma electrónica simple (imagen o certificado).
- Reemplazo del generador por Typst (fase F).

## Relacionado con
`supabase/functions/README.md`, `plantillas/README.md`.
