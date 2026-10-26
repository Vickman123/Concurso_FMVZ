# Plan de Contingencia y Recuperación ante Desastres (Disaster Recovery)
## Segundo Concurso de Disfraces FMVZ — UNAM 2026

Este plan define las acciones de respuesta inmediata, mitigación y respaldo para salvaguardar la integridad de la base de datos y garantizar la continuidad del servicio ante eventualidades técnicas durante el concurso.

---

## 1. Objetivos de Recuperación

- **RTO (Recovery Time Objective):** Menor a **5 minutos** para restablecer la disponibilidad del servicio.
- **RPO (Recovery Point Objective):** Menor a **1 minuto** de pérdida máxima tolerable de datos de votación mediante transacciones sincrónicas.

---

## 2. Política de No Votación Offline (Integridad del Voto)

> **Decisión Arquitectónica Clave:**
> La aplicación **NO implementa almacenamiento de votos offline en el navegador del cliente para sincronización posterior**.
> 
> *Justificación de Seguridad:* Permitir votos en caché local sin conexión abre vulnerabilidades críticas de doble votación, inyección de votos artificiales y discrepancias de concurrencia que invalidarían la equidad del concurso. Si un usuario pierde la conexión antes de recibir su folio de confirmación, el sistema informa del fallo y solicita reintentar una vez restablecida la señal.

---

## 3. Matriz de Contingencias y Procedimientos de Mitigación

### Escenario A: Caída del Servidor de Base de Datos PostgreSQL
1. **Detección:**
   El endpoint `/api/health` devuelve error 500 o los logs del servidor indican desconexión de base de datos.
2. **Mitigación Inmediata:**
   - Si se opera con Docker Compose:
     ```bash
     docker-compose restart db
     ```
   - Si se opera localmente con el motor PGlite: el motor se reinicia automáticamente con la instancia Node.js ya que almacena los archivos transaccionales WAL en `./server/data/postgres_db`.
3. **Restauración desde Respaldo:**
   - Ubicar el último volcado generado en `./backups/`.
   - Restaurar la base de datos con:
     ```bash
     psql -U fmvz_admin -d fmvz_halloween < backups/backup_fmvz_latest.sql
     ```
4. **Verificación:**
   Ejecutar `SELECT COUNT(*) FROM votes;` y contrastar contra la última cifra reportada.

---

### Escenario B: Saturación por Pico de Tráfico (> 500 Usuarios Simultáneos)
1. **Detección:**
   Latencias superiores a 2,000 ms en la carga de la galería o respuesta HTTP 429 (*Too Many Requests*).
2. **Medidas de Respuesta:**
   - **Activación de Caché en Nginx:** Configurar `proxy_cache` para peticiones `GET /api/participants` con TTL de 30 segundos, reduciendo drásticamente la carga de lecturas sobre PostgreSQL.
   - **Ajuste del Pool de Conexiones:** En `server/src/db/connection.ts`, elevar temporalmente `max` en el pool de `pg` de 25 a 50 conexiones si la RAM del servidor lo soporta.
   - **Priorización de la Votación:** Las rutas de escritura (`/api/vote/cast`) operan con transacciones atómicas independientes para asegurar que el registro de votos nunca se bloquee.

---

### Escenario C: Fallo o Congestión de la Red Wi-Fi en C.U.
1. **Detección:**
   Múltiples participantes reportan tiempo de espera agotado (*timeout*) desde dispositivos conectados a la red inalámbrica de la FMVZ.
2. **Medidas de Respuesta:**
   - Indicar por megafonía o en los carteles QR que los usuarios pueden acceder a través de sus datos móviles (4G/LTE/5G).
   - La aplicación está optimizada con un bundle total menor a 400 KB gzippeado y SVGs vectoriales ligeros, consumiendo menos de 1 MB de datos móviles por sesión completa.

---

### Escenario D: Intento de Votación Masiva Automatizada (Bots / Ataque de Fuerza Bruta)
1. **Detección:**
   Picos anómalos de peticiones desde una misma IP o rango de direcciones hacia `/api/vote/identify`.
2. **Medidas de Respuesta:**
   - El middleware `voteRateLimiter` bloquea automáticamente cualquier dirección IP que exceda 60 peticiones por minuto.
   - El administrador puede banear IPs específicas en el cortafuegos del servidor Nginx (`deny <IP>;`).
   - Las restricciones de unicidad `UNIQUE (voter_type, normalized_identifier)` impiden que cualquier bot registre votos dobles.

---

## 4. Script Automatizado de Respaldo (`scripts/backup.sh`)

Crear una tarea cron que genere copias de seguridad incrementales cada 15 minutos durante el día del evento:

```bash
#!/bin/bash
# scripts/backup.sh - Respaldo de seguridad FMVZ Halloween 2026

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

if [ -n "$DATABASE_URL" ]; then
  # Respaldo nativo PostgreSQL
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/fmvz_backup_${TIMESTAMP}.sql"
  cp "$BACKUP_DIR/fmvz_backup_${TIMESTAMP}.sql" "$BACKUP_DIR/backup_fmvz_latest.sql"
else
  # Respaldo de archivos de datos locales PGlite
  tar -czf "$BACKUP_DIR/pgdata_backup_${TIMESTAMP}.tar.gz" ./server/data/postgres_db
fi

# Mantener únicamente los últimos 20 respaldos para evitar saturación de disco
ls -dt "$BACKUP_DIR"/* | tail -n +21 | xargs -r rm

echo "[BACKUP] Respaldo generado satisfactoriamente a las $(date)"
```

---

## 5. Contactos de Emergencia del Comité Técnico

- **Líder de Infraestructura y Base de Datos:** `admin@fmvz.unam.mx` / Mesa Técnica FMVZ.
- **Soporte de Aplicación Web:** Mesa de Control del Evento.
- **Dirección FMVZ:** Presidencia del Comité Organizador.
