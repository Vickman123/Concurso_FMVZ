# 23 — Procedimiento de Reversión Inmediata (Rollback)

> [!CAUTION]
> **TIEMPO OBJETIVO DE RECUPERACIÓN (RTO):** Menor a **60 segundos**.
> Si tras un eventual despliegue del Gateway se detecta alguna anomalía inesperada, este procedimiento restablece la operación de Render al estado previo garantizando cero pérdida de información y continuidad del servicio.

---

## 1. Criterios de Disparo de Reversión (Triggers)

Se debe ejecutar la reversión inmediata ante cualquiera de los siguientes incidentes:

1. El Gateway no logra comunicarse con el VPS de OVHcloud (error `HTTP 502 Bad Gateway` en `/api/*`).
2. Errores recurrentes en el streaming de Server-Sent Events (`/api/live/stream`).
3. El tiempo de respuesta de Render supera los 2000 ms de forma sostenida.
4. Reportes de votación duplicada no bloqueada.

---

## 2. Opciones de Rollback

### Opción 1: Reversión Rápida desde Render Dashboard (RTO: ~45 segundos)

Dado que `main` no ha sido tocado ni alterado en ningún momento:

1. Ingresar a **Render Dashboard** -> `concurso-fmvz`.
2. Navegar a **Settings**.
3. Cambiar el campo **Branch** de vuelta a:
   ```text
   main
   ```
4. Restaurar los comandos originales:
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
5. Guardar cambios (**Save Changes**).
6. Ir a **Deploys** -> **Manual Deploy** -> **Deploy latest commit**.
7. En menos de un minuto, Render volverá a ejecutar el contenedor anterior de `main`.

---

### Opción 2: Reversión por Rollback de Despliegue en Render (RTO: ~15 segundos)

Render mantiene el historial de despliegues exitosos inmutables:

1. Ingresar a **Render Dashboard** -> `concurso-fmvz` -> **Events / Deploys**.
2. Ubicar el último despliegue exitoso correspondiente a la rama `main`.
3. Hacer clic en los tres puntos (`...`) del despliegue previo y seleccionar **Rollback to this deploy**.
4. Render reactiva inmediatamente la imagen anterior sin necesidad de recompilar.

---

### Opción 3: Desactivación Temporal de Restricción de Secreto en OVHcloud (RTO: ~10 segundos)

Si el problema es únicamente una discrepancia en el secreto `GATEWAY_SECRET`:

```bash
# Conectarse al VPS de OVHcloud
ssh ubuntu@135.148.166.89

# Comentar o vaciar GATEWAY_SECRET en el .env de OVH
sudo sed -i 's/^GATEWAY_SECRET=.*/#GATEWAY_SECRET=/' /var/www/concurso-fmvz/.env

# Reiniciar el backend de OVHcloud
sudo systemctl restart fmvz-backend.service
```

Al vaciar `GATEWAY_SECRET`, el middleware `validateGatewaySecret` pasa a modo permisivo inmediato (retrocompatible), permitiendo cualquier petición mientras se depura la incidencia.

---

## 3. Verificación Post-Rollback

Confirmar el restablecimiento del servicio con:

```bash
# Verificar que el servicio responde
curl -s -I https://concurso-fmvz.onrender.com | head -n 5

# Verificar endpoint de salud original
curl -s https://concurso-fmvz.onrender.com/api/health
```
