# 22 — Procedimiento de Despliegue del Gateway (Render → OVHcloud)

> [!IMPORTANT]
> **RESTRICCIÓN OPERATIVA:** Este procedimiento **NO debe ejecutarse sobre el servicio productivo** hasta contar con la autorización explícita y formal del usuario. Este documento detalla la secuencia exacta para cuando dicha autorización sea otorgada.

---

## 1. Prerrequisitos de Despliegue

Antes de iniciar el despliegue en Render, verificar:

1. [x] VPS de OVHcloud (`135.148.166.89`) con servicio `fmvz-backend.service` y `nginx` activos.
2. [x] `GATEWAY_SECRET` configurado en `/var/www/concurso-fmvz/.env` del VPS.
3. [x] Base de datos PostgreSQL local en OVHcloud sincronizada y accesible.
4. [x] Rama `migration/render-gateway` probada localmente con `npm run test:gateway` (28/28 pruebas superadas).
5. [x] Acceso al panel de administración de Render para el servicio `concurso-fmvz`.

---

## 2. Parámetros de Configuración en Render

Cuando se autorice la activación, se actualizarán los parámetros del servicio en **Render Dashboard** -> `concurso-fmvz`:

| Parámetro | Valor Anterior (Main / Monolítico) | **Nuevo Valor (Gateway Desacoplado)** |
| :--- | :--- | :--- |
| **Branch** | `main` | `migration/render-gateway` |
| **Build Command** | `npm install --include=dev && npm run build` | `npm install && npm run build --workspace=client` |
| **Start Command** | `npm start` (o `node server/dist/index.js`) | `npm run start:gateway` (o `node gateway/server.js`) |
| **Health Check Path**| `/api/health` | `/api/health` |

### Variables de Entorno en Render:
| Variable | Valor |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `OVH_BACKEND_URL` | `http://135.148.166.89` |
| `GATEWAY_SECRET` | `682dde1e2f7ac003f25295c1adc71c9c5b1021e5d52beb40bd00c6a7527a4148` |
| `CLIENT_DIST_PATH` | `./client/dist` |

> [!NOTE]
> En Render ya **NO** se requieren las variables `DATABASE_URL` ni `SUPABASE_*`, reduciendo drásticamente la superficie de ataque y los fallos de despliegue por agotamiento de memoria.

---

## 3. Secuencia de Despliegue Paso a Paso

### Paso 1: Publicación de la Rama en el Repositorio Remoto
```bash
# Desde la máquina local, confirmar y subir la rama
git push origin migration/render-gateway
```

### Paso 2: Actualización de Variables en Render Dashboard
1. Ingresar a `https://dashboard.render.com`.
2. Seleccionar el servicio `concurso-fmvz`.
3. Navegar a **Environment**.
4. Añadir `OVH_BACKEND_URL` con valor `http://135.148.166.89`.
5. Añadir `GATEWAY_SECRET` con el valor criptográfico acordado.
6. Guardar cambios.

### Paso 3: Cambio de Rama y Comandos en Settings
1. Navegar a **Settings**.
2. Modificar **Branch**: cambiar a `migration/render-gateway`.
3. Modificar **Build Command**: `npm install && npm run build --workspace=client`.
4. Modificar **Start Command**: `npm run start:gateway`.
5. Hacer clic en **Save Changes**.

### Paso 4: Despliegue Manual con Limpieza de Caché
1. En la parte superior derecha de Render, pulsar **Manual Deploy** -> **Clear build cache & deploy**.
2. Monitorear los logs en tiempo real.
3. El build debe completarse en menos de 45 segundos (solo compila Vite y Tailwind).
4. El inicio del Gateway reportará:
   ```text
   ==> Starting service with 'npm run start:gateway'
   🌐 FMVZ HALLOWEEN — Render Gateway -> OVHcloud
   🎯 Target VPS Backend: http://135.148.166.89
   🔐 Inter-Server Auth: Configurada (X-Gateway-Secret activo)
   📁 Client Dist Path: /opt/render/project/src/client/dist (Existe: true)
   🚀 Concurso FMVZ Gateway listening on http://localhost:10000
   ```

---

## 4. Batería de Pruebas de Humo Post-Despliegue (Smoke Tests)

Ejecutar inmediatamente sobre la URL pública de producción:

```bash
# 1. Verificar diagnóstico del Gateway
curl -s https://concurso-fmvz.onrender.com/gateway-health | jq .

# 2. Verificar salud del backend de OVH
curl -s https://concurso-fmvz.onrender.com/api/health | jq .

# 3. Verificar consulta de participantes
curl -s https://concurso-fmvz.onrender.com/api/participants | jq .

# 4. Verificar entrega de fotos
curl -I https://concurso-fmvz.onrender.com/uploads/costume_01.jpg

# 5. Verificar navegación SPA en el navegador
# Abrir https://concurso-fmvz.onrender.com en navegador móvil y de escritorio
```

Si todas las pruebas de humo responden con `HTTP 200` y sin alertas de consola (sin Mixed Content), el despliegue se considera **100% exitoso y operativo**.
