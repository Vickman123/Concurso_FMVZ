#!/usr/bin/env bash
# ==============================================================================
# FMVZ Halloween Contest — Costume Photos Persistent Storage Backup
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

UPLOAD_DIR="${UPLOAD_DIR:-${ROOT_DIR}/server/uploads}"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups/uploads}"

if [ ! -d "$UPLOAD_DIR" ]; then
  echo "❌ Error: El directorio de uploads '$UPLOAD_DIR' no existe."
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_FILE="${BACKUP_DIR}/fmvz_uploads_${TIMESTAMP}.tar.gz"

echo "=================================================================="
echo "🖼️  Iniciando respaldo de fotografías: Concurso FMVZ"
echo "📂 Directorio origen: ${UPLOAD_DIR}"
echo "🎯 Archivo destino:   ${ARCHIVE_FILE}"
echo "=================================================================="

TOTAL_FILES=$(find "$UPLOAD_DIR" -type f | wc -l | tr -d ' ')
echo "ℹ️  Total de archivos encontrados: ${TOTAL_FILES}"

# Create tar.gz excluding temporary files
tar -czf "$ARCHIVE_FILE" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

if [ -f "$ARCHIVE_FILE" ] && [ -s "$ARCHIVE_FILE" ]; then
  FILE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1)
  echo "✅ Respaldo de fotografías generado con éxito!"
  echo "📊 Tamaño comprimido: ${FILE_SIZE}"

  if command -v sha256sum &> /dev/null; then
    SHA=$(sha256sum "$ARCHIVE_FILE" | awk '{print $1}')
    echo "🔒 SHA256: ${SHA}"
    echo "$SHA  $(basename "$ARCHIVE_FILE")" > "${ARCHIVE_FILE}.sha256"
  elif command -v shasum &> /dev/null; then
    SHA=$(shasum -a 256 "$ARCHIVE_FILE" | awk '{print $1}')
    echo "🔒 SHA256: ${SHA}"
    echo "$SHA  $(basename "$ARCHIVE_FILE")" > "${ARCHIVE_FILE}.sha256"
  fi
else
  echo "❌ Error: Falló la creación del archivo de respaldo."
  exit 1
fi

echo "=================================================================="
echo "🎉 Proceso de respaldo de fotografías finalizado exitosamente."
echo "=================================================================="
