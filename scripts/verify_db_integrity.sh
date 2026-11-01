#!/usr/bin/env bash
# ==============================================================================
# FMVZ Halloween Contest — Database Integrity Verification Shell Wrapper
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"
node scripts/verify_db_integrity.mjs
