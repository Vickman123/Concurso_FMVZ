#!/usr/bin/env bash
# ==============================================================================
# FMVZ Halloween Contest — Costume Photos Restore Script
# ==============================================================================

set -euo pipefail

ARCHIVE_FILE="${1:-}"

if [ -z "$ARCHIVE_FILE" ]; then
  echo "❌ Error: Debes especificar el archivo de respaldo a restaurar."
  echo "Uso: ./scripts/restore_uploads.sh <ruta_al_archivo_respaldo.tar.gz> [directorio_destino]"
  exit 1
fi

if [ ! -f "$ARCHIVE_FILE" ]; then
  echo "❌ Error: El archivo '$ARCHIVE_FILE' no existe."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TARGET_DIR="${2:-${UPLOAD_DIR:-${ROOT_DIR}/server/uploads}}"
mkdir -p "$TARGET_DIR"

echo "=================================================================="
echo "🖼️  Iniciando restauración de fotografías: Concurso FMVZ"
echo "📦 Archivo fuente:     ${ARCHIVE_FILE}"
echo "🎯 Directorio destino: ${TARGET_DIR}"
echo "=================================================================="

# Extract contents
tar -xzf "$ARCHIVE_FILE" -C "$(dirname "$TARGET_DIR")"

RESTORED_COUNT=$(find "$TARGET_DIR" -type f | wc -l | tr -d ' ')

echo "✅ Restauración completada exitosamente."
echo "📊 Total de archivos en destino: ${RESTORED_COUNT}"
echo "=================================================================="
