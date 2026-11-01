# Configuración de Servidor Web y Proxy Inverso Nginx
## Sistema de Votación FMVZ 2026 — Hostinger VPS

---

## 1. Arquitectura de Nginx en el VPS

Nginx opera como la **única puerta de entrada pública** hacia el sistema en el VPS, encargándose de:
1. Terminación segura de conexiones HTTPS (puerto 443) mediante certificados TLS emitidos por Let's Encrypt / Certbot.
2. Redirección automática de cualquier tráfico HTTP no seguro (puerto 80) hacia HTTPS.
3. Servir directamente las fotografías de disfraces desde el directorio `/uploads/` sin consumir ciclos de CPU de Node.js.
4. Desactivar el almacenamiento intermedio de respuestas (buffering) para el streaming Server-Sent Events (SSE) en vivo (`/api/live/stream`).
5. Limitar ráfagas de solicitudes abusivas mediante directivas `limit_req` sobre endpoints sensibles de votación y registro.

---

## 2. Explicación de Bloques de Configuración Clave

### 2.1 Desactivación de Buffering para Server-Sent Events (SSE)
> [!CRITICAL]
> Si Nginx tiene `proxy_buffering on;`, los eventos en tiempo real enviados por el servidor (cambios de participante en pasarela, temporizador y conteo de vítores) se acumulan en un búfer de 4KB a 8KB y no llegan a los teléfonos móviles de los asistentes hasta que el búfer se llena.

La configuración en `nginx/conf.d/concurso-fmvz.conf` anula el búfer exclusivamente en la ruta del stream:
```nginx
location /api/live/stream {
    proxy_pass http://127.0.0.1:4000/api/live/stream;
    proxy_http_version 1.1;

    # Desactivar búfer y compresión por fragmentos para SSE
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;

    # Tiempo de espera prolongado para mantener la conexión abierta
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2.2 Entrega Directa de Fotografías de Disfraces (`/uploads/`)
Las imágenes se sirven directamente por Nginx desde el disco del host:
```nginx
location /uploads/ {
    alias /var/www/concurso-fmvz/server/uploads/;
    expires 7d;
    add_header Cache-Control "public, no-transform";
    access_log off;
    try_files $uri =404;
}
```
**Beneficio:** Node.js no interviene en la lectura de imágenes estáticas, liberando memoria RAM para procesar votos y validaciones.

### 2.3 Protección contra Denegación de Servicio y Ráfagas (Rate Limiting)
```nginx
limit_req_zone $binary_remote_addr zone=vote_limit:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=general_api_limit:10m rate=60r/s;

location /api/vote/cast {
    limit_req zone=vote_limit burst=10 nodelay;
    proxy_pass http://127.0.0.1:4000;
    ...
}
```
- Cada IP puede emitir hasta 30 peticiones de voto por minuto con una tolerancia de ráfaga de 10 solicitudes inmediatas (`nodelay`).

---

## 3. Emisión y Renovación de Certificados TLS (Certbot)

### Emisión Inicial:
```bash
certbot --nginx -d concurso.fmvz.unam.mx -d www.concurso.fmvz.unam.mx --non-interactive --agree-tos -m admin@fmvz.unam.mx
```

### Renovación Automática:
Certbot instala un cron / systemd timer automáticamente. Para probar el ciclo de renovación:
```bash
certbot renew --dry-run
```

---

## 4. Encabezados de Seguridad Institucional

Se inyectan encabezados recomendados por OWASP en todas las respuestas HTTPS:
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 5. Verificación y Recarga de Configuración

Antes de aplicar cambios a Nginx:
```bash
# Validar sintaxis
nginx -t

# Recargar sin interrupción de conexiones existentes
systemctl reload nginx
```
