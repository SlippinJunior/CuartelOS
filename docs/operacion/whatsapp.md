# WhatsApp Cloud API (opcional)

## Propósito
Enviar las convocatorias de guardia y los avisos de llegadas tardías por
WhatsApp. Si no se configura, la app sigue funcionando con enlaces `wa.me` y el
texto listo para copiar al grupo.

## 1. Crear la app en Meta
1. Entra a [developers.facebook.com](https://developers.facebook.com) y crea
   una app de tipo *Business*.
2. Agrega el producto **WhatsApp**.
3. Anota el **Phone number ID** y genera un **token permanente** (System User).

## 2. Plantillas
Para escribir primero a un usuario fuera de la ventana de 24 horas, Meta exige
plantillas aprobadas. Crea dos:

| Plantilla | Variables | Uso |
|---|---|---|
| `convocatoria_guardia` | `{{1}}` ciclo, `{{2}}` semana | Aviso de inscripción |
| `llegada_tardia` | `{{1}}` nombre, `{{2}}` hora | Aviso al Jefe de Guardia |

Con plantillas aprobadas, el adaptador puede enviar mensajes fuera de la
ventana de 24 horas. En pruebas, el envío de texto libre funciona dentro de la
ventana.

## 3. Configurar Supabase
```bash
supabase secrets set \
  WHATSAPP_TOKEN="EAAG..." \
  WHATSAPP_PHONE_ID="1234567890"
```

La Edge Function `notificar-guardias` detecta las credenciales y envía; si no
están, devuelve `configurado: false` sin fallar.

## 4. Normalización de teléfonos
El adaptador convierte `+56 9 1234 5678` o `9 1234 5678` a `56912345678`.
Los números inválidos se omiten y se informan en el resumen.

## 5. Fallback manual
En **Guardia → Gestión**, tras enviar la convocatoria, la app muestra:
- el texto listo para copiar al grupo,
- un enlace `wa.me` por bombero con teléfono.

## Costos y privacidad
Cada mensaje tiene costo por conversación. Los teléfonos son datos personales:
no se envían a terceros distintos de Meta y quedan registrados en
`operaciones.guardia_notificacion`.

## Relacionado con
`supabase/functions/_shared/whatsapp.ts`,
`docs/modulos/guardia.md`.
