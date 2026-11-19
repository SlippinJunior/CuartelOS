#!/usr/bin/env bash
# =====================================================================
# Prepara el Supabase de la demo: migraciones, seed ficticio y Edge Functions.
#
# Uso:
#   SUPABASE_PROJECT_REF=xxxx SUPABASE_DB_PASSWORD=yyyy \
#   SITE_URL=https://tu-demo.vercel.app \
#     bash scripts/preparar-demo.sh
#
# Requiere la Supabase CLI autenticada (`supabase login`) y psql.
# No toca datos reales: todo lo que carga es ficticio.
# =====================================================================
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

: "${SUPABASE_PROJECT_REF:?Falta SUPABASE_PROJECT_REF}"
: "${SUPABASE_DB_PASSWORD:?Falta SUPABASE_DB_PASSWORD}"
SITE_URL="${SITE_URL:-http://localhost:5173}"

DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"

FUNCIONES=(
  invitar-usuario
  emitir-documento
  emitir-acta
  orden-capitania
  notificar-guardias
  emitir-guardia-pdf
  emitir-secretaria-pdf
)

echo "== 1/4 · Vinculando proyecto $SUPABASE_PROJECT_REF"
supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo "== 2/4 · Aplicando migraciones"
supabase db push

echo "== 3/4 · Cargando el seed ficticio"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql

echo "== 4/4 · Desplegando Edge Functions"
supabase secrets set SITE_URL="$SITE_URL"
for f in "${FUNCIONES[@]}"; do
  echo "   - $f"
  supabase functions deploy "$f"
done

cat <<EOF

Listo. Configura en Vercel:
  VITE_SUPABASE_URL=https://${SUPABASE_PROJECT_REF}.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon key (JWT, empieza con eyJ)>

Y en Supabase → Authentication → URL Configuration:
  Site URL: ${SITE_URL}
  Redirect URLs: ${SITE_URL}/auth/establecer

Usuarios demo (contraseña demo1234): director@demo.local, secretario@demo.local,
tesorero@demo.local, capitan@demo.local, ayudante@demo.local, consejo@demo.local,
bombero@demo.local, admin@demo.local
EOF
