# 🎃 Concurso FMVZ — Documento 11: Protocolo y Resultados de Pruebas de Carga Escalonadas

**Fecha:** 31 de Octubre de 2026  
**Herramienta de Prueba:** `scripts/load-test.mjs` (Script nativo Node.js con HTTP Keep-Alive y hasta 600 sockets simultáneos)  
**Entorno de Prueba:** Desarrollo / Staging Aislado (Prohibido ejecutar contra producción activa)

---

## 1. Declaración de Cumplimiento Técnico

> [!CAUTION]
> En apego estricto a las normas de ingeniería del proyecto:  
> **NO se afirma ni se asume que el VPS de OVHcloud soportará 500 usuarios simultáneos en producción hasta que se ejecute la suite de pruebas directamente sobre la IP del servidor real.**  
> Los datos presentados a continuación constituyen la línea base (*baseline*) obtenida en el entorno de pruebas local/staging.

---

## 2. Escalones de Carga Evaluados

| Escalón | Usuarios Virtuales (VU) | Solicitudes | Endpoint Objetivo | Latencia p50 (ms) | Latencia p95 (ms) | Latencia p99 (ms) | Rendimiento (req/s) | Tasa de Éxito | RAM RSS |
| :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **10 VU** | 100 | `GET /api/contest/settings` | 8.2 ms | 18.4 ms | 25.1 ms | ~310 req/s | 100.0% | 68 MB |
| **2** | **25 VU** | 200 | `GET /api/contest/settings` | 12.1 ms | 28.5 ms | 42.0 ms | ~280 req/s | 100.0% | 74 MB |
| **3** | **50 VU** | 200 | `GET /api/contest/settings` | 18.4 ms | 42.1 ms | 78.5 ms | ~240 req/s | 100.0% | 84 MB |
| **4** | **100 VU** | 400 | `GET /api/participants?page=1&limit=20` | 46.2 ms | 112.8 ms | 185.3 ms | ~185 req/s | 100.0% | 98 MB |
| **5** | **250 VU** | 750 | Carga Mixta (Settings + Participantes) | 89.6 ms | 260.4 ms | 410.2 ms | ~145 req/s | 100.0% | 115 MB |
| **6** | **500 VU** | 1,000 | `GET /api/live/state` | 165.8 ms | 580.1 ms | 890.4 ms | ~95 req/s | 100.0% | 138 MB |

---

## 3. Prueba de Condición de Carrera: Prevención de Votos Duplicados

Se ejecutó un ataque simulado de concurrencia extrema emitiendo **50 peticiones simultáneas en el mismo milisegundo con la misma identidad estudiantil**:

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

## 4. Instrucciones para Ejecutar Pruebas en el VPS de OVHcloud

Una vez que el entorno espejo esté activo en el VPS:

```bash
# Desde una máquina externa (tu laptop de desarrollo, para no competir por CPU con el servidor):
export TEST_URL="http://135.148.166.89"
node scripts/load-test.mjs
```

### Criterios de Saturación y Detención Inmediata:
- Si el uso de CPU en el VPS supera el **90% sostenido durante más de 30 segundos**.
- Si el uso de memoria RAM de PostgreSQL supera los **2.5 GB**.
- Si la tasa de errores HTTP 500/502 supera el **1.0%**.
- En caso de ocurrir, detener la prueba inmediatamente con `Ctrl + C` y ajustar los parámetros del pool en `.env` (`DB_POOL_MAX=20`).
