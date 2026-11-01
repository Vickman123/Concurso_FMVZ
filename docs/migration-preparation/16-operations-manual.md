# 🎃 Concurso FMVZ — Documento 16: Manual de Operaciones y Mantenimiento del Sistema

**Fecha:** 31 de Octubre de 2026  
**Público Objetivo:** Administradores de Sistemas y Equipo Técnico FMVZ  
**Servidor:** OVHcloud (`135.148.166.89`)

---

## 1. Comandos Frecuentes de Control de Servicios

| Acción | Comando Systemd | Descripción |
| :--- | :--- | :--- |
| **Ver estado del Backend** | `sudo systemctl status fmvz-backend` | Revisa si el servidor Node.js está activo, PID y memoria. |
| **Reiniciar el Backend** | `sudo systemctl restart fmvz-backend` | Aplica cambios tras actualizar código o `.env`. |
| **Ver logs en vivo del Backend** | `journalctl -u fmvz-backend -f` | Monitorea peticiones y posibles errores en tiempo real. |
| **Ver estado de PostgreSQL** | `sudo systemctl status postgresql` | Comprueba estado del motor de persistencia. |
| **Ver logs de Nginx** | `tail -f /var/log/nginx/error.log` | Muestra bloqueos de rate limit o errores de proxy. |
| **Recargar Nginx sin caídas** | `sudo nginx -t && sudo systemctl reload nginx` | Recarga configuraciones sin desconectar usuarios. |

---

## 2. Monitoreo de Recursos y Rendimiento

```bash
# Monitoreo de CPU y Memoria en tiempo real
htop

# Ver uso de disco y espacio libre en /var/www y /var/backups
df -h /

# Ver conexiones activas en PostgreSQL
sudo -u postgres psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
```

---

## 3. Procedimiento para Ejecutar un Respaldo Manual Inmediato

Antes de iniciar la fase de votación en el auditorio:

```bash
cd /var/www/concurso-fmvz

# Respaldo inmediato de la base de datos
./scripts/backup_db.sh

# Respaldo inmediato de fotografías
./scripts/backup_uploads.sh

# Confirmar la creación de los archivos
ls -lht /var/backups/concurso-fmvz/db/ | head -n 3
```

---

## 4. Gestión de Administradores y Restablecimiento de Credenciales

Si un administrador olvida su contraseña:

```bash
cd /var/www/concurso-fmvz/server

# Generar nuevo hash con bcrypt vía Node.js:
node -e 'const bcrypt = require("bcrypt"); console.log(bcrypt.hashSync("NUEVA_CONTRASENA_AQUI", 10));'

# Actualizar el hash en la base de datos:
sudo -u postgres psql -d fmvz_halloween -c "UPDATE admins SET password_hash = 'HASH_GENERADO' WHERE email = 'admin@fmvz.unam.mx';"
```
