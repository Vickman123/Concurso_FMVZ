# Política de Respaldos y Procedimientos de Recuperación (Disaster Recovery)
## Sistema de Votación FMVZ 2026 — Hostinger VPS

---

## 1. Objetivos de Recuperación Institucional

Para el certamen del **3 de noviembre de 2026**:
- **RPO (Recovery Point Objective):** Máximo 15 minutos de pérdida de datos en caso de catástrofe de hardware.
- **RTO (Recovery Time Objective):** Restablecimiento operativo completo en menos de 10 minutos.

---

## 2. Herramientas de Respaldo Automatizadas

El repositorio incluye herramientas validadas en el directorio `scripts/`:

| Script | Propósito | Formato Generado | Verificación de Integridad |
| :--- | :--- | :--- | :--- |
| `scripts/backup_db.sh` | Respaldo completo de PostgreSQL | `.sql.gz` comprimido con gzip | Prueba `gzip -t` + Checksum SHA256 |
| `scripts/backup_uploads.sh`| Respaldo de fotografías | `.tar.gz` | Listado de archivos + Checksum SHA256 |
| `scripts/restore_db.sh` | Restauración de base de datos | Carga directa en target DB | Bloqueo de seguridad contra producción |
| `scripts/restore_uploads.sh`| Restauración de fotografías | Extracción en `/uploads` | Verificación de conteo de archivos |
| `scripts/verify_db_integrity.sh`| Verificación estructural y referencial | Tabla diagnóstica en consola | 10 tablas, llaves foráneas, huérfanos |

---

## 3. Automatización con Cron en el VPS

Configurar en el crontab del usuario `deploy` (`crontab -e`):

```bash
# ------------------------------------------------------------------------------
# Respaldos Regulares Previos al Evento:
# - Base de datos: Diario a las 02:00 AM
# - Fotografías: Semanal los domingos a las 03:00 AM
# ------------------------------------------------------------------------------
0 2 * * * /var/www/concurso-fmvz/scripts/backup_db.sh >> /var/log/fmvz_backup.log 2>&1
0 3 * * 0 /var/www/concurso-fmvz/scripts/backup_uploads.sh >> /var/log/fmvz_backup.log 2>&1

# ------------------------------------------------------------------------------
# DÍA DEL EVENTO (3 de noviembre de 2026):
# - Respaldo de Base de Datos cada 15 minutos entre las 08:00 y las 20:00 hrs
# ------------------------------------------------------------------------------
*/15 8-20 3 11 * /var/www/concurso-fmvz/scripts/backup_db.sh >> /var/log/fmvz_backup_live.log 2>&1
```

---

## 4. Política de Retención y Limpieza de Respaldos

Para evitar que los respaldos saturen el disco del VPS, se programa un script de purga semanal que conserva:
- Todos los respaldos de las últimas 48 horas.
- 1 respaldo diario de los últimos 14 días.
- 1 respaldo semanal de los últimos 2 meses.

Comando de limpieza para eliminar archivos con más de 14 días:
```bash
find /var/backups/fmvz/db -name "*.sql.gz" -mtime +14 -delete
find /var/backups/fmvz/uploads -name "*.tar.gz" -mtime +14 -delete
```

---

## 5. Procedimiento de Recuperación ante Desastres (Runbook)

En caso de fallo total del contenedor o corrupción accidental de datos:

### Paso 1: Detener la aplicación temporalmente
```bash
docker compose stop app
```

### Paso 2: Identificar el último respaldo íntegro
```bash
ls -lht /var/backups/fmvz/db/ | head -n 5
```

### Paso 3: Validar el checksum SHA256 del respaldo
```bash
sha256sum -c /var/backups/fmvz/db/fmvz_backup_YYYYMMDD_HHMMSS.sql.gz.sha256
```

### Paso 4: Ejecutar la restauración
```bash
FORCE=1 TARGET_DATABASE_URL="postgres://fmvz_admin:PASSWORD@127.0.0.1:5432/fmvz_halloween" \
  ./scripts/restore_db.sh /var/backups/fmvz/db/fmvz_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Paso 5: Restaurar fotografías si fuera necesario
```bash
./scripts/restore_uploads.sh /var/backups/fmvz/uploads/fmvz_uploads_YYYYMMDD_HHMMSS.tar.gz /var/www/concurso-fmvz/server/uploads
```

### Paso 6: Reiniciar y verificar la aplicación
```bash
docker compose up -d app
./scripts/verify_db_integrity.sh
curl -s http://localhost:4000/api/health | jq .
```
Tiempo estimado total de recuperación: **4 a 7 minutos**.
