#!/usr/bin/env bash
# ==============================================================================
# FMVZ Halloween Contest — PostgreSQL Database Restore Script
# Compatible with PostgreSQL 16 on Hostinger VPS and local environments.
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Debes especificar el archivo de respaldo a restaurar."
  echo "Uso: ./scripts/restore_db.sh <ruta_al_archivo_respaldo.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: El archivo '$BACKUP_FILE' no existe."
  exit 1
fi

DB_URL="${TARGET_DATABASE_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  if [ -f ".env" ]; then
    echo "ℹ️  Cargando variables desde .env..."
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
    DB_URL="${TARGET_DATABASE_URL:-${DATABASE_URL:-}}"
  fi
fi

if [ -z "$DB_URL" ]; then
  echo "❌ Error: No se definió TARGET_DATABASE_URL ni DATABASE_URL."
  exit 1
fi

# Safety check: prevent accidental restore on production Supabase
if [[ "$DB_URL" == *"supabase"* ]] && [ "${FORCE_PROD_RESTORE:-0}" != "1" ]; then
  echo "🛑 BLOQUEO DE SEGURIDAD CRÍTICO:"
  echo "La URL de destino parece ser una base de datos de producción remota (Supabase)."
  echo "Por seguridad institucional, la restauración automática contra producción está bloqueada."
  echo "Si esto es intencional, define FORCE_PROD_RESTORE=1."
  exit 1
fi

echo "=================================================================="
echo "⚠️  ADVERTENCIA: Iniciando restauración de base de datos"
echo "🎯 Destino: $(echo "$DB_URL" | sed -E 's/:[^:@]+@/:****@/')"
echo "📁 Archivo fuente: ${BACKUP_FILE}"
echo "=================================================================="

# Check optional confirmation unless non-interactive
if [ "${FORCE:-0}" != "1" ] && [ -t 0 ]; then
  read -r -p "¿Estás seguro de que deseas sobrescribir la base de datos de destino? (escribe 'SI' para continuar): " CONFIRM
  if [ "$CONFIRM" != "SI" ]; then
    echo "Operación cancelada por el usuario."
    exit 0
  fi
fi

echo "🚀 Ejecutando restauración..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  if ! command -v psql &> /dev/null; then
    if command -v docker &> /dev/null && docker ps --format '{{.Names}}' | grep -q 'fmvz_halloween_db'; then
      gzip -dc "$BACKUP_FILE" | docker exec -i fmvz_halloween_db psql -U fmvz_admin -d fmvz_halloween
    else
      echo "❌ Error: 'psql' no encontrado y no hay contenedor docker activo."
      exit 1
    fi
  else
    gzip -dc "$BACKUP_FILE" | psql "$DB_URL"
  fi
else
  if ! command -v psql &> /dev/null; then
    if command -v docker &> /dev/null && docker ps --format '{{.Names}}' | grep -q 'fmvz_halloween_db'; then
      cat "$BACKUP_FILE" | docker exec -i fmvz_halloween_db psql -U fmvz_admin -d fmvz_halloween
    else
      echo "❌ Error: 'psql' no encontrado y no hay contenedor docker activo."
      exit 1
    fi
  else
    psql "$DB_URL" < "$BACKUP_FILE"
  fi
fi

echo "✅ Restauración completada con éxito."
echo "ℹ️  Ejecutando verificación de integridad..."
./scripts/verify_db_integrity.sh || true
