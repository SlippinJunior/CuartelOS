# WhatsApp Cloud API (Meta oficial)

## Propósito
Despachar mensajes **1-a-1** al celular de cada bombero activo usando la API oficial de **Meta WhatsApp Cloud API v21.0** (`type: "template"`), junto con el Portal y el Correo electrónico. No envía a grupos (Meta no permite grupos en Cloud API).

Si no hay credenciales configuradas, el sistema **no falla**: publica en el Portal, envía los correos y registra cada destinatario como `no_configurado` en `nucleo.despacho_detalle` para reintentar cuando se activen.

## 1. Configurar Meta Business Manager
1. Entra a [developers.facebook.com](https://developers.facebook.com) y crea una app de tipo *Business*.
2. Agrega el producto **WhatsApp** y vincula el número oficial de la Compañía.
3. Genera un **Token permanente** (System User) y copia el **Phone Number ID**.

## 2. Plantillas requeridas en Meta (`es_CL`)
Meta exige aprobar estas plantillas (categoría *Utility*) antes de enviar mensajes fuera de la ventana de 24 h:

| Variable de entorno | Nombre sugerido | Parámetros `{{n}}` | Uso |
|---|---|---|---|
| `WHATSAPP_TEMPLATE_COMUNICADO` | `comunicado_compania` | `{{1}}` tipo/N°, `{{2}}` título, `{{3}}` resumen, `{{4}}` URL portal | Órdenes del día, Capitanía y Circulares |
| `WHATSAPP_TEMPLATE_CITACION` | `citacion_compania` | `{{1}}` título, `{{2}}` fecha y hora, `{{3}}` lugar, `{{4}}` tenida, `{{5}}` URL portal | Citaciones oficiales |
| `WHATSAPP_TEMPLATE_GUARDIA` | `guardia_aviso` | `{{1}}` ciclo/semana, `{{2}}` resumen cupos, `{{3}}` URL guardia | Convocatoria semanal de guardias |
| `WHATSAPP_TEMPLATE_LLEGADA_TARDIA` | `guardia_llegada_tardia` | `{{1}}` fecha turno, `{{2}}` detalle bomberos y hora | Aviso al Jefe de Guardia (09:00) |

Ejemplo de texto para `citacion_compania`:
> **Segunda Compañía CBL · Citación**
> {{1}}
> Fecha y hora: {{2}}
> Lugar: {{3}}
> Tenida: {{4}}
> Revisa el detalle en el portal: {{5}}

## 3. Variables en Supabase Edge Functions
```bash
supabase secrets set \
  WHATSAPP_TOKEN="EAAG..." \
  WHATSAPP_PHONE_ID="1234567890" \
  WHATSAPP_LANG="es_CL" \
  WHATSAPP_TEMPLATE_COMUNICADO="comunicado_compania" \
  WHATSAPP_TEMPLATE_CITACION="citacion_compania" \
  WHATSAPP_TEMPLATE_GUARDIA="guardia_aviso" \
  WHATSAPP_TEMPLATE_LLEGADA_TARDIA="guardia_llegada_tardia"
```

## 4. Normalización y reintentos
- Convierte `+56 9 1234 5678` o `9 1234 5678` a `56912345678`.
- Desde el **Tablero → Detalle del comunicado → Despacho**, los oficiales ven el estado por bombero y pueden pulsar **Reintentar pendientes**.

## Relacionado con
`supabase/functions/_shared/whatsapp.ts`, `supabase/functions/despachar-comunicado/index.ts`, `docs/modulos/tablero.md`.
