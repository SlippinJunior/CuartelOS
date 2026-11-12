#!/usr/bin/env bash
# =====================================================================
# Importa el legado (esquema `gestion` de 35 tablas) al esquema nuevo.
# Requiere una base con las migraciones aplicadas y vacía de datos reales.
#
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
#     bash scripts/importar-legado/importar.sh
# =====================================================================
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
SEED_ORIGINAL="${SEED_ORIGINAL:-data/privado/legado/seed_original.sql}"
LEGADO_SQL="docs/legado/sql/0001_esquema.sql"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! command -v psql >/dev/null; then
  echo "Falta psql (cliente de PostgreSQL)." >&2
  exit 1
fi
if [ ! -f "$SEED_ORIGINAL" ]; then
  echo "No existe $SEED_ORIGINAL." >&2
  echo "Copia el seed real a data/privado/legado/seed_original.sql (nunca a git)." >&2
  exit 1
fi
if [ ! -f "$LEGADO_SQL" ]; then
  echo "No existe $LEGADO_SQL." >&2
  exit 1
fi

echo "== 1/5 · Preparando esquema temporal legado"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/importar-legado/00_cargar_legado.sql

echo "== 2/5 · Cargando estructura original (gestion → legado)"
# El esquema de extensiones de Supabase se llama `extensions`.
sed -E \
  -e 's/\bgestion\b/legado/g' \
  -e "s/public\.unaccent/extensions.unaccent/g" \
  -e "s/'public\.unaccent'::regdictionary/'extensions.unaccent'::regdictionary/g" \
  "$LEGADO_SQL" > "$TMP/0001_legado.sql"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$TMP/0001_legado.sql"

echo "== 3/5 · Cargando datos originales"
sed -E -e 's/\bgestion\b/legado/g' -e "s/'gasto'/'egreso'/g" "$SEED_ORIGINAL" > "$TMP/seed_legado.sql"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$TMP/seed_legado.sql"

echo "== 4/5 · Transformando al esquema nuevo"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/importar-legado/10_transformar.sql

echo "== 5/5 · Exportando respaldo y limpiando"
mkdir -p data/privado
if command -v pg_dump >/dev/null; then
  pg_dump "$DB_URL" \
    --data-only --inserts --on-conflict-do-nothing \
    --schema=nucleo --schema=seguridad --schema=personal --schema=asistencia \
    --schema=operaciones --schema=material --schema=tesoreria --schema=secretaria \
    --schema=disciplina --schema=documentos \
    --exclude-table=seguridad.auditoria \
    -f data/privado/seed_real.sql
  echo "Respaldo escrito en data/privado/seed_real.sql (ignorado por git)."
fi

psql "$DB_URL" -v ON_ERROR_STOP=1 -c 'drop schema legado cascade;'

echo "Listo. Revisa nucleo.staging_importacion y el informe de conciliación."
