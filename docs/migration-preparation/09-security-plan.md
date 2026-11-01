# 🎃 Concurso FMVZ — Documento 09: Plan Integral de Seguridad y Ciberseguridad

**Fecha:** 31 de Octubre de 2026  
**Entorno:** OVHcloud VPS (`135.148.166.89`)  
**Estándar de Seguridad:** OWASP Top 10 + CIS Linux Hardening Benchmarks

---

## 1. Perímetro de Red y Firewall (UFW)

El cortafuegos nativo del kernel (`iptables`/`ufw`) opera bajo el principio de **denegación por defecto** (*Default Deny*):

```bash
# Política por defecto: bloquear todo el tráfico entrante
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Puertos estrictamente autorizados
sudo ufw allow 22/tcp comment 'SSH Administracion'
sudo ufw allow 80/tcp comment 'HTTP Redireccion LetEncrypt'
sudo ufw allow 443/tcp comment 'HTTPS Trafico Seguro'

# Habilitar firewall
sudo ufw enable
```

### Reglas de Aislamiento de Base de Datos:
- PostgreSQL **NO TIENE PUERTO ABIERTO** en UFW.
- El archivo `postgresql.conf` se configura con:
  ```text
  listen_addresses = '127.0.0.1'
  ```
- Cualquier intento de conexión externa a `135.148.166.89:5432` es descartado silenciosamente por el firewall.

---

## 2. Hardening del Acceso Administrativo SSH

1. **Autenticación por Par de Claves Criptográficas:**
   - Se desaconseja el acceso con contraseñas débiles. Se utiliza la llave `~/.ssh/id_ed25519.pub`.
2. **Protección contra Fuerza Bruta con `fail2ban`:**
   - Monitorea `/var/log/auth.log`.
   - Si una IP remota acumula 5 intentos fallidos en 10 minutos, queda baneada a nivel de firewall durante 2 horas.
3. **Usuario Dedicado No-Root:**
   - Toda la administración se realiza con el usuario `ubuntu`, empleando `sudo` únicamente para comandos privilegiados.

---

## 3. Seguridad a Nivel de Aplicación Web

### 3.1 Protección contra Inyecciones SQL
- **100% de consultas parametrizadas:** Se utiliza `node-postgres` con marcadores posicionales `$1, $2, ...`.
- Ningún parámetro proveniente de `req.body`, `req.params` o `req.query` es interpolado directamente en consultas SQL.

### 3.2 Protección contra Inyecciones XSS y Robo de Sesiones
- En React, el renderizado escapa automáticamente caracteres peligrosos (`<`, `>`, `&`).
- El backend implementa cabeceras seguras mediante `helmet`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 3.3 Rate Limiting y Mitigación de Denegación de Servicio (DoS)
- **Nginx (Nivel 1):**
  - Zona de votación: `limit_req_zone $binary_remote_addr zone=vote_limit:10m rate=10r/s;`
  - Descarta ráfagas anormales con código HTTP 429.
- **Express (Nivel 2):**
  - Middleware `express-rate-limit` con límites por ventana de 15 minutos.

### 3.4 Gestión de Secretos y Cero Fugas en Git
- Ninguna contraseña real, token JWT o credencial se guarda en el repositorio.
- Las variables de entorno se inyectan a través del archivo `/etc/environment` o `.env` local en el servidor, protegido con permisos `chmod 600`.

---

## 4. Registro Seguro de Logs y Auditoría

1. **Ofuscación de Datos Personales:**
   - Los números de cuenta o identificadores institucionales de los votantes se anonimizan en las respuestas públicas.
   - Los logs del servidor no registran contraseñas ni tokens de autenticación.
2. **Tabla Inmutable `audit_logs`:**
   - Cada acción sensible de un administrador (aprobación de participante, anulación de voto, cambio de estado de concurso) queda registrada con `admin_id`, `action`, `timestamp`, `reason` y metadatos JSONB.
