# 🎃 FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
# Protocolo de Contingencia y Plan de Reversión (Rollback Plan)

Este documento describe el procedimiento técnico detallado, seguro y cronometrado para revertir la migración del Concurso de Disfraces FMVZ hacia la infraestructura previa en caso de que se presenten incidentes críticos durante o después de la puesta en marcha en el VPS de Hostinger.

---

## 1. Principio Fundamental: Cero Pérdida de Datos y Única Fuente de Verdad

Durante una contingencia técnica, la máxima prioridad es:
1. **La integridad de los votos ya emitidos por la comunidad universitaria.**
2. **La continuidad del evento en el auditorio.**
3. **Evitar un estado de "Split-Brain":** En ningún momento deben existir dos bases de datos aceptando votos simultáneamente sin sincronización.

---

## 2. Criterios de Activación del Rollback (Trigger Conditions)

El Coordinador Técnico declarará la activación inmediata del Plan de Reversión si ocurre cualquiera de los siguientes escenarios durante la ventana de migración o en los primeros 60 minutos de operación en el VPS:

| Código | Condición Crítica | Tolerancia Máxima |
| :---: | :--- | :--- |
| **TR-01** | Falla de conectividad o reinicios continuos del contenedor `concurso-fmvz-app` (HTTP 502/504 continuos). | > 5 minutos |
| **TR-02** | Caída o corrupción del volumen de PostgreSQL 16 en el VPS. | Inmediata |
| **TR-03** | Latencia p95 sostenida superior a 3.0 segundos en la emisión de votos (`/api/vote/cast`). | > 3 minutos |
| **TR-04** | Fallo crítico en el túnel de Server-Sent Events (`/api/live/stream`) que impida la visualización en vivo en la pantalla del auditorio. | > 5 minutos |
| **TR-05** | Error irreparable en la emisión de certificados SSL de Let's Encrypt o bloqueo por límites de tasa (*rate limit*) de Let's Encrypt. | Inmediata |

---

## 3. Matriz de Estados de la Infraestructura

```mermaid
flowchart TD
    A["Incidente Crítico en VPS (Hostinger)"] --> B{"¿Se emitieron votos en el VPS?"}
    B -- "SÍ (Existen votos nuevos en VPS)" --> C["Paso 1: Detener tráfico en VPS\n(docker stop concurso-fmvz-app)"]
    C --> D["Paso 2: Volcar votos nuevos a SQL con pg_dump"]
    D --> E["Paso 3: Inyectar votos nuevos en Supabase"]
    E --> F["Paso 4: Apuntar Render nuevamente a Supabase"]
    B -- "NO (Falla antes de abrir votación)" --> F
    F --> G["Paso 5: Verificar salud en concurso-fmvz.onrender.com"]
    G --> H["Servicio Restablecido al 100%"]
```

---

## 4. Procedimiento de Ejecución Paso a Paso

### Paso 1: Suspender Tráfico hacia el VPS (Tiempo estimado: 1 minuto)
Para congelar el estado de la base de datos en el VPS y evitar escrituras parciales mientras se revierte:

En el VPS (vía SSH):
```bash
cd /opt/concurso-fmvz
# Detener el backend de inmediato para cerrar conexiones de votación
docker compose stop app

# Opcional: Colocar Nginx en modo mantenimiento mostrando aviso a los usuarios
cat << 'EOF' > /var/www/html/mantenimiento.html
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Concurso FMVZ - Ajuste Técnico</title></head>
<body style="font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#f8fafc;">
  <h1>🎃 Concurso de Disfraces FMVZ 2026</h1>
  <p>Estamos reajustando la conexión del auditorio. Volvemos en 3 minutos.</p>
</body>
</html>
EOF
```

---

### Paso 2: Volcado Diferencial de Votos (Si se emitieron votos en el VPS)
*(Omitir este paso si la falla ocurrió antes de que los usuarios votaran en el VPS).*

Si se registraron votos en el VPS antes de la falla, extraerlos inmediatamente para importarlos a Supabase:

```bash
# En el VPS: Exportar únicamente la tabla de votos generados
docker exec -t concurso-fmvz-db pg_dump \
  -U fmvz_admin \
  -d fmvz_halloween \
  --data-only \
  --table=votes \
  --table=live_reactions \
  > /opt/concurso-fmvz/backups/votos_diferenciales.sql

# Inspeccionar que el archivo contenga los registros
wc -l /opt/concurso-fmvz/backups/votos_diferenciales.sql
```

Descargar el archivo a la laptop de administración:
```bash
scp root@IP_HOSTINGER_VPS:/opt/concurso-fmvz/backups/votos_diferenciales.sql ./backups/
```

Inyectar los votos diferenciales en la base de datos de respaldo (Supabase):
```bash
# Insertar ignorando duplicados si ya existían algunos:
psql "$SUPABASE_DIRECT_URL" -c "\COPY votes FROM ...;" 
# O mediante el comando estándar de restauración:
psql "$SUPABASE_DIRECT_URL" < ./backups/votos_diferenciales.sql
```

---

### Paso 3: Reversión en Render (Tiempo estimado: 2 a 3 minutos)

El frontend y backend en Render permanecen intactos como contingencia activa. Para que los usuarios vuelvan al entorno operativo previo:

#### Opción A: Render aloja Backend y Frontend (Esquema Inicial Monolítico)
1. Entrar al Dashboard de Render: [dashboard.render.com](https://dashboard.render.com)
2. Seleccionar el servicio **`concurso-fmvz`**.
3. En la sección **Environment**, verificar que la variable de conexión apunte a Supabase:
   ```text
   DATABASE_URL = postgres://postgres.rflabwivtxrwtqchvjfn:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
4. Si se había cambiado la variable `VITE_API_URL` para redirigir al VPS, **eliminarla o dejarla vacía** (para que use rutas relativas `/api` del propio Render).
5. Hacer clic en **Save Changes** -> **Manual Deploy** -> **Deploy latest commit** (de la rama `main`).

#### Opción B: Render actúa como Frontend Estático
1. En el Dashboard de Render, modificar la variable de entorno:
   ```text
   VITE_API_URL = https://concurso-fmvz.onrender.com
   ```
2. Trigger Deploy inmediato. El tiempo de construcción y publicación en la CDN de Render es de aproximadamente **90 a 120 segundos**.

---

### Paso 4: Reversión de DNS (Si se utilizó un dominio personalizado)
Si para el VPS se había configurado un dominio como `concurso.fmvz.unam.mx`:

1. Acceder al panel de administración de DNS (ej. Cloudflare o registrador institucional).
2. Cambiar el registro tipo `A` o `CNAME`:
   - **Registro A actual (VPS):** `185.x.x.x` (IP de Hostinger)
   - **Revertir a CNAME:** `concurso-fmvz.onrender.com`
3. Reducir el TTL previamente a 60 segundos para garantizar propagación global instantánea.

---

### Paso 5: Verificación de Salud Post-Reversión

Ejecutar la suite de integridad y verificación automática sobre la URL productiva:

```bash
# Verificar endpoint de salud de Render
curl -I https://concurso-fmvz.onrender.com/api/health

# Ejecutar script de verificación de integridad contra Supabase
./scripts/verify_db_integrity.sh
```

Comprobar visualmente en el navegador:
1. Abrir `https://concurso-fmvz.onrender.com` en modo incógnito.
2. Comprobar que la galería cargue las fotos de los participantes.
3. Verificar acceso al panel de administración en `/admin`.
4. Verificar que la pantalla del auditorio `/live/projector` reciba eventos.

---

## 5. Tiempos Máximos de Recuperación (RTO y RPO)

- **RTO (Recovery Time Objective):** **Menor a 8 minutos** desde la declaración formal de contingencia hasta el restablecimiento total del servicio en `concurso-fmvz.onrender.com`.
- **RPO (Recovery Point Objective):** **0 minutos (Cero pérdida de votos)** gracias a las transacciones atómicas con cerrojo de fila y la capacidad de extracción diferencial de `votes` vía `pg_dump`.

---

## 6. Directorio de Contactos y Escalación de Emergencia

| Rol | Función | Responsabilidad en Rollback |
| :--- | :--- | :--- |
| **Líder Técnico** | Toma de decisión de reversión | Declarar contingencia y coordinar pasos 1 y 3. |
| **DBA / Infraestructura** | Extracción y validación de datos | Ejecutar volcado diferencial de votos y sincronización a Supabase. |
| **Soporte Auditorio** | Comunicación en el evento | Notificar a los maestros de ceremonias y proyectar aviso de breve pausa. |
