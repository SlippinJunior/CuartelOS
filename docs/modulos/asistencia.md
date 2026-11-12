# Módulo · Asistencia

**Estado:** ✅ funcional (Etapa 1)

## Alcance
- Listas por año y estado.
- Crear lista con tipo de acto, número, fecha y abono justificado.
- Pase de lista en el celular, con búsqueda, premarcado de situaciones y
  contador en vivo.
- Botones grandes A/F/P y menú para R/S/L.
- "Marcar resto como Falta".
- Cierre y envío con plazo de 48 h (art. 188).
- Corrección de lista cerrada con motivo.
- Mi asistencia: resumen anual y detalle por acto.

## Artículos y documentos
- Art. 188: plazo para cerrar la lista.
- P11 Listas de asistencia y abono.

## Reglas
- R y S no entran al denominador del porcentaje.
- Una lista de abono exige justificación.
- El upsert es idempotente por `(lista_id, persona_id)`.
- Offline: se guarda en IndexedDB; al reconectar se usa upsert o la RPC
  `corregir_marca` si la lista ya fue cerrada.
- Si otro dispositivo cambió una marca, se avisa del conflicto.

## Pendiente
- Importación desde VIPER (Etapa 6).
- Reporte P11 con folio y firma.
- Estadísticas comparativas entre años.

## Relacionado con
`docs/datos/er-personal.md`, `app/src/features/asistencia/README.md`.
