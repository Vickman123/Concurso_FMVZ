# Guía de Seguridad y Fortalecimiento de Infraestructura
## Sistema de Votación FMVZ 2026 — Hostinger VPS

---

## 1. Principios de Seguridad de la Infraestructura

La arquitectura implementa el principio de **defensa en profundidad**, distribuyendo controles de seguridad en el sistema operativo, la red, el servidor web, los contenedores Docker y la lógica de aplicación.

---

## 2. Seguridad en el Sistema Operativo y Red

### 2.1 Aislamiento de Puertos con Firewall UFW
El firewall del VPS solo expone al exterior los servicios estrictamente necesarios:
- **Puerto 22 (SSH):** Gestión administrativa mediante llaves públicas criptográficas (Ed25519 o RSA 4096-bit).
- **Puerto 80 (HTTP):** Exclusivamente para redirección 301 automática a HTTPS y retos ACME de Let's Encrypt.
- **Puerto 443 (HTTPS):** Tráfico cifrado de usuarios finales.

> [!CAUTION]
> **El puerto de PostgreSQL (5432) y el puerto de Node.js (4000) NO deben abrirse en UFW.** Están asociados a la interfaz `127.0.0.1` en `docker-compose.yml`, haciéndolos invisibles e inaccesibles desde internet.

### 2.2 Fortalecimiento de SSH (`/etc/ssh/sshd_config`)
```ini
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```
Reiniciar SSH tras configurar llaves:
```bash
systemctl restart ssh
```

### 2.3 Prevención de Ataques de Fuerza Bruta (Fail2ban)
Fail2ban monitorea `/var/log/auth.log` y bloquea temporalmente por 1 hora cualquier IP que acumule 3 intentos fallidos de autenticación SSH.

---

## 3. Seguridad en Contenedores Docker

1. **Usuario no root:** El contenedor de la aplicación cambia a `USER node` (UID 1000) en el `Dockerfile`, impidiendo que una vulnerabilidad a nivel de aplicación otorgue privilegios de root en el contenedor o escape al host.
2. **Red interna privada (`fmvz_internal`):** La comunicación entre Express y PostgreSQL transcurre a través de un puente de red aislado de Docker sin visibilidad hacia otros contenedores del VPS.
3. **Sistemas de archivos de solo lectura y volúmenes acotados:** La escritura se limita estrictamente a los volúmenes `fmvz_pgdata` y `fmvz_uploads_data`.

---

## 4. Seguridad en la Aplicación y Manejo de Datos

### 4.1 Prevención de Inyecciones SQL
El 100% de las consultas a la base de datos se ejecutan mediante **consultas parametrizadas preparadas** en `pg` (`$1, $2, ...`):
```typescript
await db.query(
  'SELECT id, name FROM participants WHERE status = $1 AND participant_type = $2',
  [status, type]
);
```
No existe concatenación de cadenas SQL en ninguna ruta del proyecto.

### 4.2 Almacenamiento Seguro de Contraseñas
- Las contraseñas administrativas se procesan con `bcryptjs` utilizando un factor de costo (`salt`) de 10 rondas.
- No se almacenan contraseñas en texto claro en ninguna tabla ni archivo de registro.

### 4.3 Tokens de Sesión Administrativos (JWT)
- Firmados con algoritmo HMAC-SHA256 utilizando el secreto `JWT_SECRET`.
- Tiempo de vida limitado a 12 horas (`expiresIn: '12h'`).
- En cada solicitud a endpoints protegidos, el middleware `authenticate` verifica adicionalmente que el usuario siga existiendo y mantenga el estatus `active` en la tabla `admins`.

### 4.4 Anonimización y Privacidad del Voto Universitario
- Conforme a los principios de voto libre y secreto, la plataforma no asocia públicamente la identidad del votante con su elección.
- Los números de cuenta de los estudiantes nunca se transmiten ni muestran completos en interfaces públicas; se enmascaran automáticamente (`******789`).

---

## 5. Matriz de Mitigación de Amenazas

| Vector de Ataque | Mecanismo de Defensa Implementado |
| :--- | :--- |
| **Fuerza Bruta en Login Admin** | `express-rate-limit` (10 intentos/15 min) + Fail2ban en Nginx. |
| **Votación Masiva Automatizada** | Limitación de tasa en Nginx (30 req/min) + Constraint UNIQUE inmutable en Postgres. |
| **Inyección de Scripts en Imágenes** | Verificación de magic bytes en memoria (`validateImageMagicBytes`). |
| **Suplantación de Identidad** | Restricción criptográfica de folio único y transacciones atómicas con bloqueo de fila. |
| **Ataques Man-in-the-Middle (MitM)**| Cifrado TLS 1.2/1.3 forzado + HSTS con vigencia de 2 años (`max-age=63072000`). |
