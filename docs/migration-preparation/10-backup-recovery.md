# 🎃 Concurso FMVZ — Documento 10: Plan de Respaldos, Retención y Recuperación ante Desastres

**Fecha:** 31 de Octubre de 2026  
**Objetivo de Recuperación:** RTO < 8 minutos | RPO = 0 minutos (Cero pérdida de votos)  
**Scripts Automatizados:** `scripts/backup_db.sh`, `scripts/restore_db.sh`, `scripts/backup_uploads.sh`, `scripts/restore_uploads.sh`

---

## 1. Política de Respaldos y Frecuencias

| Componente | Método de Respaldo | Frecuencia | Ubicación en Servidor | Retención Automática |
| :--- | :--- | :--- | :--- | :--- |
| **Base de Datos PostgreSQL** | Volcado lógico comprimido (`pg_dump` formato personalizado `.dump` / `.sql.gz`) | Cada 6 horas durante evento; Diario en reposo | `/var/backups/concurso-fmvz/db/` | 14 días (rotación automática) |
| **Fotografías de Disfraces** | Archivo comprimido con preservación de metadatos (`tar -czf`) | Diario a las 03:00 hrs | `/var/backups/concurso-fmvz/uploads/` | 14 días |
| **Configuraciones y Nginx** | Respaldo de `/etc/nginx/` y `.env` sanitizado | Ante cada cambio administrativo | `/var/backups/concurso-fmvz/config/` | 30 días |

---

## 2. Automatización con Cron en Linux

En el crontab del usuario `ubuntu` o `root` (`crontab -e`):

```bash
# ==============================================================================
# TAREAS AUTOMATIZADAS DE RESPALDO - CONCURSO FMVZ 2026
# ==============================================================================

# Respaldo de Base de Datos cada 6 horas (00:00, 06:00, 12:00, 18:00)
0 */6 * * * /var/www/concurso-fmvz/scripts/backup_db.sh >> /var/log/concurso-fmvz-backup.log 2>&1

# Respaldo diario de Fotografías a las 03:30 AM
30 3 * * * /var/www/concurso-fmvz/scripts/backup_uploads.sh >> /var/log/concurso-fmvz-backup.log 2>&1
```

---

## 3. Procedimiento de Verificación de Integridad de un Respaldo

Para asegurar que un respaldo no esté corrupto antes de necesitarlo:

```bash
# 1. Comprobar que el archivo exista y tenga tamaño mayor a cero
ls -lh /var/backups/concurso-fmvz/db/

# 2. Verificar la cabecera del archivo comprimido
gzip -t /var/backups/concurso-fmvz/db/backup_latest.sql.gz
echo "Salida 0 indica integridad valida"

# 3. Comprobar que contenga las tablas críticas
zcat /var/backups/concurso-fmvz/db/backup_latest.sql.gz | grep -E "CREATE TABLE (participants|voters|votes)"
```

---

## 4. Procedimiento de Restauración Paso a Paso

Si ocurre una falla que requiera restaurar la base de datos:

```bash
# Paso 1: Localizar el respaldo deseado
BACKUP_FILE="/var/backups/concurso-fmvz/db/fmvz_backup_20261031_200000.sql.gz"

# Paso 2: Ejecutar el script automatizado de restauración
TARGET_DATABASE_URL="postgres://fmvz_admin:PASSWORD@127.0.0.1:5432/fmvz_halloween" \
./scripts/restore_db.sh "$BACKUP_FILE"

# Paso 3: Validar que la base de datos quedó íntegra
./scripts/verify_db_integrity.sh
```

---

## 5. Matriz de Roles y Responsabilidades

| Rol | Responsable | Tarea |
| :--- | :--- | :--- |
| **Operador de Infraestructura** | Administrador Linux / DevOps | Monitorear el espacio libre en disco (`df -h`) y verificar la ejecución de Cron. |
| **Administrador de Base de Datos** | Especialista PostgreSQL | Ejecutar restauraciones de prueba semanales en un esquema aislado. |
| **Comité Organizador FMVZ** | Coordinación del Evento | Conservar una copia externa semanal descargada en un equipo seguro fuera del VPS. |
