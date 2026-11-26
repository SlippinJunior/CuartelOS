# Plan de Despliegue a Producción y Análisis de Costos (Cloudflare Pages)

Guía operativa y estimación presupuestaria para operar **CuartelOS** en producción para la **Segunda Compañía de Bomberos de Limache**, usando **Cloudflare Pages** (gratuito), **NIC Chile** (`.cl`), **Supabase Cloud**, correo transaccional y **Meta WhatsApp Cloud API**.

---

## 1. Arquitectura recomendada para producción

| Capa | Servicio | Plan sugerido | Rol |
|---|---|---|---|
| **Frontend PWA** | **Cloudflare Pages** | Free (\$0/mes) | SPA React/Vite, CDN global, HTTPS y soporte offline |
| **DNS y Seguridad** | **Cloudflare DNS** | Free (\$0/mes) | Gestión DNS, SSL automático, protección DDoS |
| **Dominio** | **NIC Chile** (`.cl`) | Anual (\$9.990 CLP/año) | Dominio institucional (ej. `segundacompanialimache.cl`) |
| **Base de datos / Auth / Storage / Edge Functions** | **Supabase Cloud** | Pro recomendado (US\$25/mes) o Free para pruebas | PostgreSQL 17 con RLS, Storage privado, Auth y 8 Edge Functions |
| **Correo transaccional** | **Brevo Free** o **Google Workspace for Nonprofits** | \$0/mes | Envío de invitaciones, órdenes, citaciones y avisos de guardia |
| **WhatsApp oficial** | **Meta WhatsApp Cloud API** (directo, sin intermediarios BSP) | Pago por mensaje entregado | Envío 1-a-1 con plantillas `UTILITY` aprobadas |

---

## 2. Plan de despliegue paso a paso (Cloudflare Pages + Dominio `.cl`)

### Paso 1 · Comprar el dominio `.cl`
1. Ingresa a [nic.cl](https://www.nic.cl) y verifica disponibilidad (ejemplo: `segundacompanialimache.cl` o `segundalimache.cl`).
2. Regístralo directamente a nombre de la Compañía (evita intermediarios para mantener el valor oficial de **\$9.990 CLP/año exento de IVA**).

### Paso 2 · Conectar el dominio a Cloudflare (DNS gratuito)
1. Crea cuenta gratuita en Cloudflare y agrega el dominio en **Add a Site** (plan **Free**).
2. Copia los dos **Nameservers** entregados por Cloudflare.
3. En **nic.cl → Mis Dominios → Servidores de Nombre**, reemplaza los DNS por los de Cloudflare (propagación típica < 24 h).

### Paso 3 · Preparar Supabase Producción (proyecto separado de la demo)
1. Crea un proyecto nuevo en Supabase (región `us-east-2` o `sa-east-1` Sao Paulo para menor latencia en Chile).
2. Vincula y aplica las 30 migraciones + catálogos base (sin `seed.sql` ficticio):
   ```bash
   supabase login
   supabase link --project-ref <prod-ref>
   supabase db push
   ```
3. Expón los esquemas en PostgREST (`nucleo, personal, asistencia, operaciones, material, tesoreria, secretaria, disciplina, documentos`), despliega las 8 Edge Functions y fija `SITE_URL`:
   ```bash
   supabase secrets set SITE_URL="https://erp.<tu-dominio>.cl"
   for f in invitar-usuario emitir-documento emitir-acta orden-capitania \
            notificar-guardias emitir-guardia-pdf emitir-secretaria-pdf \
            despachar-comunicado; do
     supabase functions deploy "$f"
   done
   ```
4. En **Authentication → URL Configuration**:
   - **Site URL:** `https://erp.<tu-dominio>.cl`
   - **Redirect URLs:** `https://erp.<tu-dominio>.cl/auth/establecer`
   - Desactiva **Allow new users to sign up** (`disable_signup = true`, acceso solo por invitación).
5. Crea la cuenta de pantalla de cuartel (`cuartel@<tu-dominio>.cl`, rol `cuartel`, `persona_id = null`) desde Administración o SQL.

### Paso 4 · Desplegar Frontend en Cloudflare Pages (gratis)
1. En Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Selecciona `SlippinJunior/CuartelOS` (rama `main`) y configura:
   - **Build command:** `pnpm --filter erp-segunda-compania-app build`
   - **Build output directory:** `app/dist`
   - **Environment variables (Production & Preview):**
     - `NODE_VERSION` = `22`
     - `VITE_SUPABASE_URL` = `https://<prod-ref>.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = `<legacy anon JWT key (eyJ...)>`
3. *(Opcional recomendado)* Copia las cabeceras de seguridad (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) en `app/public/_headers`.
4. En **Custom domains** del proyecto de Pages, agrega `erp.<tu-dominio>.cl` (Cloudflare crea el CNAME y certificado TLS automáticamente).

### Paso 5 · Configurar Correo (\$0/mes)
- **Opción A — Brevo (ex Sendinblue) Free:** 300 correos/día (~9.000/mes) gratis con SMTP estándar. Agrega los registros **SPF** y **DKIM** en Cloudflare DNS y configura `SMTP_HOST`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` en `supabase secrets set`.
- **Opción B — Google Workspace for Nonprofits (\$0):** si la Compañía califica como institución sin fines de lucro verificada, ofrece correo institucional `@segundacompanialimache.cl` sin costo mensual.
- **Opción C — Resend Free:** 3.000 correos/mes gratis, pero tiene tope de **100 correos/día** (si se envían 2 comunicados el mismo día a 60 bomberos, el segundo supera el límite diario).

### Paso 6 · Activar Meta WhatsApp Cloud API *(opcional)*
1. Crea/verifica el **Meta Business Portfolio** de la Compañía y agrega un número telefónico dedicado (no usado en WhatsApp normal).
2. Registra y aprueba las 5 plantillas en categoría **Utility**:
   - `comunicado_compania`, `citacion_compania`, `orden_capitania`, `guardia_aviso`, `guardia_llegada_tardia`
3. Carga en Supabase Secrets:
   ```bash
   supabase secrets set WHATSAPP_TOKEN="..." WHATSAPP_PHONE_NUMBER_ID="..."
   ```

---

## 3. Análisis de costos (referencia CLP / USD)

*Tipo de cambio referencial: ~940 CLP/USD (valores sujetos a variación del dólar y facturación en tarjetas chilenas).*

| Concepto | Costo | Límites y observaciones clave |
|---|---|---|
| **Dominio `.cl` (NIC Chile)** | **\$9.990 CLP / año** (~**\$833 CLP/mes**) | Exento de IVA. Renovación al mismo valor. |
| **Alternativa `.com` (Cloudflare Registrar)** | ~US\$10,44 / año (~\$9.800 CLP/año) | Precio al costo sin recargo de renovación. |
| **Cloudflare Pages + DNS + SSL** | **\$0 / mes** | Ancho de banda **ilimitado**, 500 builds/mes, hasta 100 dominios personalizados. |
| **Supabase Free** | **\$0 / mes** | 500 MB BD, 1 GB Storage, 500k Edge Functions. **⚠️ Se pausa automáticamente tras 7 días de inactividad** y **no incluye backups diarios automáticos**. |
| **Supabase Pro *(recomendado)*** | **US\$25 / mes** (~**\$23.500 CLP/mes**) | **Sin pausas**, backups diarios (7 días), 8 GB BD, 100 GB Storage, 250 GB egress, 2M Edge Functions. |
| **Correo (Brevo Free)** | **\$0 / mes** | Hasta **300 correos/día** (9.000/mes), suficiente para una compañía completa. |
| **Correo (Resend Free / Pro)** | **\$0** (3.000/mes, máx. 100/día) o **US\$20/mes** | El plan Free puede quedarse corto si hay >1 comunicado masivo el mismo día. |
| **Meta WhatsApp Cloud API (Chile `+56`, categoría `Utility`)** | **US\$0,0200 / mensaje entregado** (**\$17,66 CLP/msg**) | Sin costo fijo mensual si se conecta directo (sin BSP). Mensajes entrantes gratis. |

### Estimación mensual de WhatsApp para ~60 bomberos activos
- **Uso moderado** (~5 avisos/mes → 300 mensajes): **~US\$6 / mes (~CLP \$5.300/mes)**.
- **Uso regular** (~10 avisos/mes entre citaciones, órdenes y guardias → 600 mensajes): **~US\$12 / mes (~CLP \$10.600/mes)**.
- **Uso intensivo** (~1.000 mensajes/mes): **~US\$20 / mes (~CLP \$17.700/mes)**.

---

## 4. Resumen de 3 escenarios mensuales

| Escenario | Qué incluye | Costo mensual estimado | Recomendación |
|---|---|---|---|
| **1. Arranque / Prueba (\$0 cloud)** | Cloudflare Pages (\$0) + Supabase Free (\$0) + Brevo Free (\$0) + Dominio `.cl` (\$833/mes) | **~\$833 CLP / mes** (\$9.990/año) | Solo para pilotos; **riesgo de pausa tras 7 días sin uso**. |
| **2. Producción Estable *(Recomendado base)*** | Cloudflare Pages (\$0) + **Supabase Pro** (~\$23.500) + Brevo Free (\$0) + Dominio `.cl` (\$833) | **~\$24.300 CLP / mes** (~US\$26/mes) | **Ideal para operar 24/7** sin caídas y con respaldos automáticos diarios. |
| **3. Producción Full + WhatsApp oficial** | Escenario 2 + Meta WhatsApp Cloud API (~600 mensajes Utility/mes) | **~\$35.000 CLP / mes** (~US\$38/mes) | Experiencia completa: Portal + Correo + WhatsApp oficial 1-a-1. |

> **Nota sobre Meta WhatsApp:** Mientras la Compañía aprueba su cuenta Meta Business o evalúa el presupuesto, el ERP funciona al 100% con **Portal + Correo** (el despacho registra WhatsApp como *pendiente de configuración* sin bloquear ninguna publicación).
