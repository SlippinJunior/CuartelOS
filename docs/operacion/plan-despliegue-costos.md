# Plan de Despliegue a Producción y Análisis de Costos Mínimos

Guía operativa y estrategia presupuestaria para operar **CuartelOS** en producción para la **Segunda Compañía de Bomberos de Limache**, optimizada para lograr el **menor costo mensual posible (~\$833 CLP/mes)** aprovechando beneficios para organizaciones sin fines de lucro en Chile, sin sacrificar profesionalismo ni funcionalidades.

---

## 1. Arquitectura objetivo de costo mínimo (~\$833 CLP/mes)

| Capa | Servicio recomendado | Costo | Rol |
|---|---|---|---|
| **Dominio** | **NIC Chile** (`.cl`) | **\$9.990 CLP / año** (~\$833 CLP/mes, exento IVA) | Dominio institucional (ej. `segundacompanialimache.cl`) |
| **Frontend PWA + DNS + SSL** | **Cloudflare Pages + DNS** | **\$0 / mes** | SPA React/Vite, CDN global, HTTPS automático, ancho de banda **ilimitado** |
| **Backend (BD + Auth + Storage + 8 Edge Functions)** | **Fase 1:** Supabase Cloud Free + backup GitHub Actions → Cloudflare R2<br>**Fase 2:** **Supabase Self-Hosted** en **Microsoft Azure** (beca ONG) | **\$0 / mes** | PostgreSQL 17 con 10 esquemas y RLS, Storage privado, Auth y 8 Edge Functions sin reescribir código |
| **Correo transaccional** | **Google Workspace for Nonprofits** o **Brevo Free** | **\$0 / mes** | Invitaciones, órdenes, citaciones y avisos de guardia |
| **Notificaciones móviles** | **Web Push (PWA)** + **Bot oficial Telegram** + **Copiar para grupo WhatsApp** *(y Meta Cloud API opcional)* | **\$0 / mes** *(Meta: pago por uso)* | Avisos inmediatos al celular sin riesgo de baneo ni cobros fijos |

> **¿Por qué NO migrar la base de datos a Neon Free u otro Postgres plano?**
> **CuartelOS** depende de **Supabase Auth**, **PostgREST con RLS en 10 esquemas**, **Storage con URLs firmadas** y **8 Edge Functions en Deno**. Migrar a un PostgreSQL puro (como Neon Free: 1 GB, 100 horas de cómputo/mes) obligaría a reescribir desde cero autenticación, permisos, almacenamiento y funciones. Mantener Supabase (Cloud Free hoy → Self-Hosted con beca Azure después) conserva el **100% del sistema intacto**.

---

## 2. Beneficios y descuentos para Bomberos de Chile (Sin Fines de Lucro)

Al contar con **personalidad jurídica vigente sin fines de lucro** a través del **Cuerpo de Bomberos de Limache**, la institución califica para programas oficiales de tecnología:

### Paso A · Validación en TechSoup Chile (`techsoup.cl`)
1. Reúne los antecedentes del **Cuerpo de Bomberos**: RUT institucional, certificado de personalidad jurídica vigente y estatutos/directiva.
2. Crea la cuenta en [techsoup.cl](https://www.techsoup.cl) y solicita la validación de organización sin fines de lucro.
3. Una vez aprobada, obtendrás el **token de validación** que desbloquea Microsoft y Google.

### Paso B · Microsoft for Nonprofits (Beca Azure US\$2.000/año)
1. Ingresa al portal de **Microsoft for Nonprofits** con la validación de TechSoup.
2. Solicita el **Azure Grant para organizaciones sin fines de lucro**: entrega **US\$2.000 USD anuales en créditos de Azure** (renovables cada año dentro de los 30 días previos al vencimiento; los créditos no utilizados no se acumulan).
3. Configura una alerta y tope de presupuesto mensual (ej. US\$150/mes) sobre la tarjeta asociada para evitar cobros inesperados.
4. Con esos créditos pueden levantar una VM Linux (`Standard_B2ms` o `B2s_v2`, 2–4 vCPU, 4–8 GB RAM, SSD + snapshots) corriendo **Supabase Self-Hosted** (Docker Compose o Coolify) a **\$0 de bolsillo**, sin pausas ni límites de plan gratuito.
5. Adicionalmente incluye licencias **Microsoft 365** gratuitas o con descuento para oficiales y administración.

### Paso C · Google for Nonprofits (Google Workspace a \$0)
1. Postula en [google.com/nonprofits](https://www.google.com/nonprofits) usando el token de TechSoup.
2. Activa **Google Workspace for Nonprofits (\$0/mes)**: cuentas de correo institucionales (`@tucompania.cl`), Drive, Meet y envío autenticado SMTP.
3. También habilita **Google Ad Grants** (hasta US\$10.000/mes en avisos de búsqueda para campañas económicas o postulaciones).

### Paso D · Cloudflare y Supabase
- **Cloudflare:** el plan **Free** ya incluye Pages con ancho de banda ilimitado, DNS y SSL a **\$0**. Para protección WAF/DDoS avanzada de entidades públicas/voluntarias existe **Cloudflare Project Galileo**.
- **Supabase:** no tiene un programa público automático de descuento ONG (puede consultarse a soporte caso a caso, pero la estrategia con **Supabase Free + Azure Self-Hosted** no depende de ello).

---

## 3. Opciones gratuitas o económicas frente a Supabase Pro (US\$25/mes)

| Opción | Costo | Capacidad y funcionamiento | Pros y consideraciones |
|---|---|---|---|
| **Opción 1 · Supabase Cloud Free + Respaldos automáticos** *(Arranque inmediato)* | **\$0 / mes** | 500 MB PostgreSQL, 1 GB Storage, 500k Edge Functions. Respaldo `pg_dump` programado en **GitHub Actions** hacia **Cloudflare R2 Free (10 GB)**. | **Cero migración.** Para ~60 bomberos, la BD ocupa <20 MB/año y 1 GB guarda miles de PDFs livianos. El uso diario del Tablero de Cuartel + respaldo programado evita la pausa por 7 días de inactividad. |
| **Opción 2 · Supabase Self-Hosted en Azure Nonprofits** *(Recomendada definitiva)* | **\$0 / mes** *(cubierto por beca US\$2.000/año)* | VM Linux 4–8 GB RAM en Azure ejecutando Docker Compose oficial de Supabase (mínimo oficial: 4 GB RAM / 2 vCPU). | **Operación profesional 24/7 sin pagar mensualidad:** sin pausas, almacenamiento amplio y backups propios. Requiere trámite inicial en TechSoup (~1–2 semanas) y mantención básica Linux/Docker. |
| **Opción 3 · VPS económico (Hetzner o Oracle Always Free)** *(Plan B sin Azure)* | **~€9/mes** (~\$9.500 CLP) en Hetzner / **\$0** en Oracle Free | **Hetzner CPX21** (3 vCPU, 4 GB RAM, 80 GB SSD) o **Oracle Cloud Always Free** (ARM Ampere hasta 24 GB RAM). | Hetzner cuesta menos de la mitad de Supabase Pro y es muy estable. **Oracle Free es \$0**, pero suele tener falta de cupo ARM, firewall `iptables` estricto y riesgo de reclamo si la cuenta queda inactiva (siempre mantener respaldos externos). |

---

## 4. WhatsApp: número propio vs. alternativa oficial gratuita

### ¿Se puede usar un número telefónico propio para enviar WhatsApp gratis?
- **Con Meta Cloud API (oficial):** solo son gratuitas las respuestas dentro de las **24 horas** posteriores a que el bombero escriba primero. Las notificaciones iniciadas por el sistema (citaciones, órdenes, guardias) usan plantillas `UTILITY` y Meta cobra **US\$0,0200 por mensaje entregado (~\$17,66 CLP/msg)** en Chile (`+56`).
- **Con puentes no oficiales tipo WhatsApp Web (`Evolution API`, `WAHA`, `Baileys`):** permiten escanear QR con un teléfono/SIM propia y enviar mensajes (incluso a un grupo) a **\$0**. **Sin embargo:**
  1. **Violan los Términos de Servicio de Meta:** existe riesgo real de **baneo permanente e irreversible del número**. Nunca usar un número personal ni el institucional de la Compañía (a lo más una SIM prepago descartable).
  2. **Fragilidad operativa ("fallos silenciosos"):** actualizaciones internas de Meta cortan la sesión inesperadamente y exigen re-escanear el QR, arriesgando que un aviso importante no salga.

### Estrategia profesional a \$0 sin riesgo de bloqueo *(Recomendada)*
1. **Notificaciones Push Web (PWA) — \$0 ilimitado:** estándar oficial para avisos directos a pantalla de bloqueo en **Android e iOS (16.4+)**.
2. **Bot oficial de Telegram — \$0 ilimitado:** API oficial estable para canal/grupo de la compañía o mensajes 1-a-1.
3. **Correo institucional (\$0) + Tablero de Cuartel + botón "Copiar para grupo WhatsApp":** 0 riesgo de baneo y difusión inmediata en el grupo oficial.

---

## 5. Plan de despliegue paso a paso (Cloudflare Pages + Dominio `.cl`)

### Paso 1 · Comprar el dominio `.cl`
1. Ingresa a [nic.cl](https://www.nic.cl) y registra el dominio directamente a nombre de la Compañía (**\$9.990 CLP/año exento de IVA**, sin intermediarios).

### Paso 2 · Conectar el dominio a Cloudflare (DNS gratuito)
1. Crea cuenta gratuita en Cloudflare → **Add a Site** (plan **Free**).
2. Reemplaza los **Nameservers** en `nic.cl` por los dos entregados por Cloudflare.

### Paso 3 · Preparar Supabase Producción (proyecto separado de la demo)
1. Crea un proyecto nuevo en Supabase (región `sa-east-1` Sao Paulo o `us-east-2`).
2. Vincula y aplica las migraciones + catálogos base (sin `seed.sql` ficticio):
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
   - Desactiva **Allow new users to sign up** (`disable_signup = true`).
5. Crea la cuenta de pantalla de cuartel (`cuartel@<tu-dominio>.cl`, rol `cuartel`, `persona_id = null`).

### Paso 4 · Desplegar Frontend en Cloudflare Pages (gratis)
1. En Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Selecciona `SlippinJunior/CuartelOS` (rama `main`) y configura:
   - **Build command:** `pnpm --filter erp-segunda-compania-app build`
   - **Build output directory:** `app/dist`
   - **Environment variables:** `NODE_VERSION=22`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. En **Custom domains**, agrega `erp.<tu-dominio>.cl`.

### Paso 5 · Configurar Correo (\$0/mes)
- **Opción A — Brevo Free:** 300 correos/día (~9.000/mes) gratis con SMTP estándar (configurar SPF/DKIM en Cloudflare DNS y `SMTP_*` en `supabase secrets set`).
- **Opción B — Google Workspace for Nonprofits (\$0):** correo `@tucompania.cl` sin costo mensual vía TechSoup.

### Paso 6 · Activar Meta WhatsApp Cloud API *(solo si se aprueba presupuesto por mensaje)*
1. Verifica **Meta Business Portfolio**, registra las 5 plantillas `UTILITY` (`comunicado_compania`, `citacion_compania`, `orden_capitania`, `guardia_aviso`, `guardia_llegada_tardia`) y carga `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`.

---

## 6. Resumen de escenarios mensuales

*Tipo de cambio referencial: ~940 CLP/USD.*

| Escenario | Qué incluye | Costo mensual estimado | Recomendación |
|---|---|---|---|
| **1. Costo Mínimo ONG *(Recomendado)*** | Dominio `.cl` (\$833/mes) + Cloudflare Pages (\$0) + **Fase 1:** Supabase Free (\$0) con backup R2/Actions → **Fase 2:** Supabase Self-Hosted en Azure Nonprofits (\$0) + Correo Brevo/Google (\$0) + Push/Telegram | **~\$833 CLP / mes** (\$9.990/año) | **Mejor relación profesionalidad/costo:** opera con \$0 de nube y conserva el 100% de funciones. |
| **2. VPS Económico (sin beca Azure)** | Dominio `.cl` (\$833) + Cloudflare Pages (\$0) + Supabase Self-Hosted en **Hetzner CPX21** (~€9/mes) + Correo Brevo (\$0) | **~\$10.300 CLP / mes** | Alternativa estable si no tramitan la beca Azure y quieren servidor dedicado sin pausas. |
| **3. Supabase Pro Gestionado** | Dominio `.cl` (\$833) + Cloudflare Pages (\$0) + **Supabase Pro** (US\$25/mes) + Correo Brevo (\$0) | **~\$24.300 CLP / mes** (~US\$26/mes) | Cero mantención de servidor si en el futuro hay presupuesto fijo mensual. |
| **4. Producción Full + Meta WhatsApp** | Escenario 1, 2 o 3 + Meta Cloud API (~600 mensajes `Utility`/mes ≈ US\$12) | **+\$10.600 CLP / mes** sobre el escenario base | Solo si se decide pagar por WhatsApp oficial 1-a-1. |
