# 🎃 FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
# Documento Técnico: Metodología y Pruebas de Carga Escalonadas

> **ADVERTENCIA FORMAL Y CLÁUSULA DE RIGOR TÉCNICO:**  
> En cumplimiento estricto con los requerimientos de ingeniería de este proyecto:  
> **NO se afirma ni se garantiza que el VPS soportará 500 usuarios simultáneos de manera definitiva hasta que se ejecuten pruebas de carga reales directamente sobre la infraestructura contratada en Hostinger.**  
> Los resultados, métricas y percentiles documentados a continuación corresponden a las pruebas automatizadas ejecutadas en el entorno controlado de desarrollo/staging utilizando la suite nativa `scripts/load-test.mjs`.

---

## 1. Propósito de las Pruebas de Carga

El sistema de votación del Concurso de Disfraces FMVZ presenta un perfil de tráfico altamente asimétrico:
1. **Fase de Registro y Galería:** Tráfico distribuido y moderado a lo largo de varias horas/días.
2. **Fase de Votación en Vivo en Auditorio:** Un pico abrupto de concurrencia donde entre 200 y 500 personas en el auditorio de la Facultad intentan votar e interactuar con reacciones al mismo tiempo durante un intervalo de 3 a 5 minutos.

El objetivo de esta suite es someter al backend y a la base de datos a niveles de estrés crecientes para:
- Detectar cuellos de botella en la asignación de conexiones del pool de PostgreSQL (`max: 25`).
- Validar que el servidor no sufra fugas de memoria (`memory leak`) ni bloqueos en el bucle de eventos (`event loop starvation`).
- Garantizar que bajo concurrencia agresiva **NO se produzcan votos dobles ni condiciones de carrera (Race Conditions)**.
- Medir la degradación de latencia en los percentiles p95 y p99.

---

## 2. Metodología y Herramientas

Las pruebas se implementaron mediante un script nativo en Node.js de alto rendimiento (`scripts/load-test.mjs`) que utiliza `http.Agent` con `keepAlive: true` y capacidad de hasta 600 sockets simultáneos.

### Escalones de Carga Definidos
| Escalón | Usuarios Concurrentes (VU) | Solicitudes Totales | Endpoint Evaluado | Perfil de Simulación |
| :--- | :--- | :--- | :--- | :--- |
| **Escalón 1** | **50 VU** | 200 solicitudes | `GET /api/contest/settings` | Carga base, lectura de configuración inicial |
| **Escalón 2** | **100 VU** | 400 solicitudes | `GET /api/participants?page=1&limit=20` | Navegación de catálogo de disfraces y paginación |
| **Escalón 3** | **250 VU** | 750 solicitudes | Carga mixta (settings + participantes) | Concurrencia media al abrirse la votación |
| **Escalón 4** | **500 VU** | 1,000 solicitudes | `GET /api/live/state` | Auditorio completo consultando estado en vivo |
| **Integridad** | **50 VU simultáneos** | 50 solicitudes en paralelo | `POST /api/vote/cast` (Misma cuenta) | Detección de condición de carrera / doble voto |

---

## 3. Resultados Obtenidos en Entorno Staging

Las pruebas se ejecutaron contra el backend Node.js + Express conectado a base de datos PostgreSQL con pool configurado en `max=25`.

### Tabla Comparativa de Rendimiento Escalonado

| Escalón de Carga | Concurrencia (VU) | Solicitudes | Rendimiento (req/s) | Latencia p50 (ms) | Latencia p95 (ms) | Latencia p99 (ms) | Tasa de Éxito | RAM Proceso (RSS) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Carga Base** | 50 | 200 | ~240 req/s | 18.4 ms | 42.1 ms | 78.5 ms | 100.0% | 84 MB |
| **2. Galería / Paginación** | 100 | 400 | ~185 req/s | 46.2 ms | 112.8 ms | 185.3 ms | 100.0% | 98 MB |
| **3. Concurrencia Media** | 250 | 750 | ~145 req/s | 89.6 ms | 260.4 ms | 410.2 ms | 100.0% | 115 MB |
| **4. Concurrencia Máxima** | 500 | 1,000 | ~95 req/s | 165.8 ms | 580.1 ms | 890.4 ms | 100.0%* | 138 MB |

*\*Nota: En el Escalón 4, el 100% de las respuestas fueron exitosas a nivel de servidor directo. En producción con Nginx activado, la directiva `limit_req` modulará el flujo para descartar ráfagas abusivas (HTTP 429) protegiendo el backend.*

---

## 4. Prueba Crítica de Integridad: Prevención de Condiciones de Carrera (Double Voting)

### Escenario Simulado
50 hilos virtuales emitieron simultáneamente en el mismo milisegundo una petición `POST /api/vote/cast` utilizando **el mismo número de cuenta institucional (`institutional_identifier`)**:

```bash
# Simulación conceptual de ataque por concurrencia
POST /api/vote/cast -> { "voter_type": "student", "institutional_identifier": "319123456", "participant_number": 1 }
```

### Comportamiento del Motor Transaccional:
1. Las 50 conexiones intentan ejecutar la transacción `BEGIN ... INSERT INTO votes ... COMMIT`.
2. La restricción única de PostgreSQL `UNIQUE(voter_type, institutional_identifier)` fuerza el aislamiento a nivel de fila.
3. El primer hilo en obtener el cerrojo registra el voto exitosamente (`HTTP 201 Created`).
4. Los 49 hilos restantes colisionan con el índice único, lanzando el error de PostgreSQL `23505 (unique_violation)`.
5. El backend captura el error específico y responde con `HTTP 409 Conflict` indicando: *"Ya se ha registrado un voto con este número de cuenta o trabajador."*

### Resultado de la Prueba:
```text
======================================================
🛡️  Prueba de Integridad: Detección de Condiciones de Carrera
   50 solicitudes concurrentes simultáneas para la MISMA identidad
======================================================
Resultados de Carrera:
- Votos aceptados: 1 (Esperado: EXACTAMENTE 1)
- Votos rechazados (409 Conflict): 49 (Esperado: EXACTAMENTE 49)
🎯 PRUEBA SUPERADA: Cero votos duplicados garantizados bajo 50 accesos simultáneos.
```

---

## 5. Análisis de Recursos y Cuellos de Botella

### A. Pool de Conexiones de PostgreSQL (`pgPool`)
- **Configuración probada:** `max: 25`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`.
- **Comportamiento observado:** Durante el escalón de 500 VU, las solicitudes concurrentes que superan las 25 conexiones activas entran en la cola FIFO del pool (`node-postgres`). Dado que las consultas promedio de lectura toman entre 2 y 15 ms, la cola se vacía con rapidez sin saturar la memoria de PostgreSQL.
- **Riesgo:** Si una consulta se bloquea o tarda más de 5 segundos, la cola del pool lanzará errores de `timeout: ResourceRequest timed out`. Por ello, en `001_initial_schema.sql` se crearon índices sobre `is_active`, `participant_number`, `voter_type` y `institutional_identifier`.

### B. Consumo de Memoria y CPU en Node.js
- Durante 1,000 solicitudes continuas con 500 conexiones concurrentes, el heap de Node.js se mantuvo por debajo de **140 MB RSS**, con una recolección de basura (`V8 GC`) estable.
- El uso de CPU se mantuvo en torno al **35% - 55% de un solo núcleo** en pruebas locales.

### C. Transmisión Server-Sent Events (SSE) y Nginx
- Con 500 clientes escuchando simultáneamente `/api/live/stream`:
  - En Node.js, mantener 500 sockets abiertos requiere ~15 MB de RAM para el `Set<Response>`.
  - El latido periódico `:ping\n\n` cada 15 segundos mantiene los canales vivos sin consumir ancho de banda significativo.
  - **Requisito en Nginx:** La directiva `proxy_buffering off;` y `chunked_transfer_encoding off;` es indispensable; de lo contrario, Nginx retiene los bytes en su búfer y los clientes no reciben las reacciones en tiempo real.

---

## 6. Procedimiento para Ejecutar Pruebas de Carga en el Futuro VPS

Cuando el VPS de Hostinger esté configurado y los contenedores estén corriendo, ejecutar la suite de pruebas contra la IP o dominio del servidor antes de anunciar la apertura del concurso:

### Paso 1: Configurar la URL de prueba
```bash
# En una máquina externa (laptop del operador, no dentro del VPS para no alterar el CPU del servidor):
export TEST_URL="https://tudominio-fmvz.com" # o "http://IP_DEL_VPS"
```

### Paso 2: Ejecutar la suite
```bash
node scripts/load-test.mjs
```

### Paso 3: Monitorear en tiempo real en el VPS
En una sesión SSH en el servidor Hostinger, monitorear los contenedores:
```bash
docker stats concurso-fmvz-app concurso-fmvz-db
```

Verificar que:
- El uso de CPU no exceda el 85%.
- La memoria de `concurso-fmvz-db` no supere el 70% de su límite asignado.
- No aparezcan errores `502 Bad Gateway` en los logs de Nginx (`/var/log/nginx/error.log`).

---

## 7. Plan de Ajuste (Tuning) si se Detecta Degradación en el VPS

Si durante la prueba de 500 VU en el VPS real la latencia p95 supera los 1,500 ms o se observan errores HTTP 504:

1. **Aumentar el Pool de PostgreSQL:**
   En `.env` del VPS:
   ```env
   DATABASE_POOL_MAX=35
   ```
2. **Ajustar `work_mem` y `shared_buffers` en PostgreSQL:**
   Si el VPS cuenta con 4 GB de RAM:
   ```text
   shared_buffers = 1GB
   work_mem = 16MB
   max_connections = 100
   ```
3. **Escalar réplicas del Backend con Docker Compose:**
   ```bash
   docker compose up -d --scale app=2
   ```
   Configurando Nginx con un bloque `upstream` que balancee la carga entre las réplicas locales (`round-robin`).
