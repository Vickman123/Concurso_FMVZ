#!/usr/bin/env bash
# ==============================================================================
# FMVZ Halloween Contest — Supabase to Hostinger VPS Migration Wrapper
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"
node scripts/migrate_from_supabase.mjs
