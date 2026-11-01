#!/usr/bin/env bash
# ==============================================================================
# FMVZ Halloween Contest — PostgreSQL Database Backup Script
# Compatible with PostgreSQL 16 on Hostinger VPS and local environments.
# ==============================================================================

set -euo pipefail

# 1. Determine database connection URL
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ]; then
  if [ -f ".env" ]; then
    echo "ℹ️  Cargando variables desde .env..."
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
    DB_URL="${DATABASE_URL:-}"
  fi
fi

if [ -z "$DB_URL" ]; then
  echo "❌ Error: La variable DATABASE_URL no está definida."
  echo "Uso: DATABASE_URL=\"postgres://usuario:password@host:5432/db\" ./scripts/backup_db.sh"
  exit 1
fi

# 2. Setup backup directory
BACKUP_DIR="${BACKUP_DIR:-./backups/db}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/fmvz_backup_${TIMESTAMP}.sql.gz"

echo "=================================================================="
echo "📦 Iniciando respaldo de PostgreSQL: Concurso FMVZ"
echo "📅 Fecha: $(date)"
echo "🎯 Archivo destino: ${BACKUP_FILE}"
echo "=================================================================="

# 3. Check for pg_dump availability
if ! command -v pg_dump &> /dev/null; then
  echo "⚠️  pg_dump no está en el PATH del sistema anfitrión."
  echo "ℹ️  Intentando ejecutar vía Docker si existe el contenedor 'fmvz_halloween_db'..."
  if command -v docker &> /dev/null && docker ps --format '{{.Names}}' | grep -q 'fmvz_halloween_db'; then
    docker exec -t fmvz_halloween_db pg_dump -U fmvz_admin -d fmvz_halloween | gzip > "$BACKUP_FILE"
  else
    echo "❌ Error: pg_dump no está disponible ni se encontró un contenedor docker PostgreSQL activo."
    exit 1
  fi
else
  # Native pg_dump with gzip compression
  pg_dump "$DB_URL" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --quote-all-identifiers | gzip > "$BACKUP_FILE"
fi

# 4. Verify backup file creation and integrity
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Respaldo generado con éxito!"
  echo "📊 Tamaño del archivo: ${FILE_SIZE}"
  
  # Calculate SHA256
  if command -v sha256sum &> /dev/null; then
    SHA=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
    echo "🔒 SHA256: ${SHA}"
    echo "$SHA  $(basename "$BACKUP_FILE")" > "${BACKUP_FILE}.sha256"
  elif command -v shasum &> /dev/null; then
    SHA=$(shasum -a 256 "$BACKUP_FILE" | awk '{print $1}')
    echo "🔒 SHA256: ${SHA}"
    echo "$SHA  $(basename "$BACKUP_FILE")" > "${BACKUP_FILE}.sha256"
  fi
  
  # Verify gzip can decompress
  if gzip -t "$BACKUP_FILE"; then
    echo "🛡️  Prueba de integridad de compresión gzip: Correcta."
  else
    echo "❌ Error: El archivo de respaldo está corrupto."
    exit 1
  fi
else
  echo "❌ Error: El archivo de respaldo no se creó o está vacío."
  exit 1
fi

echo "=================================================================="
echo "🎉 Proceso de respaldo completado satisfactoriamente."
echo "=================================================================="
