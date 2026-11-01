# 🎃 Concurso FMVZ — Documento 11: Resultados Certificados de Pruebas de Carga en Hardware Real (OVHcloud)

**Fecha:** 31 de Octubre de 2026 23:53 CST  
**Servidor Evaluado:** OVHcloud VPS (`135.148.166.89`)  
**Especificaciones del Host:** 2 vCPU Intel Haswell, 3.7 GiB RAM, 40 GB NVMe, Ubuntu 26.04 LTS  
**Software Evaluado:** Nginx 1.28.3 (Reverse Proxy + Rate Limiting) + Node.js 22.22.1 (`systemd`) + PostgreSQL 18.6 (Local 127.0.0.1)  
**Herramienta de Carga:** `scripts/load-test.mjs` (Ejecutado desde máquina externa cliente para no competir por CPU)

---

## 1. Tabla Comparativa de Rendimiento Escalonado (Medición en Vivo)

| Escalón de Carga | Concurrencia (VU) | Solicitudes Totales | Rendimiento (req/s) | Latencia p50 (ms) | Latencia p95 (ms) | Latencia p99 (ms) | Tasa de Éxito | Memoria en Host (Usada / Libre) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Escalón 1: Carga Base** | **50 VU** | 200 | **169.25 req/s** | 150.17 ms | 570.24 ms | 572.30 ms | **100.0%** | 680 MB / 3.0 GB |
| **Escalón 2: Galería** | **100 VU** | 400 | **428.50 req/s** | 152.25 ms | 262.73 ms | 289.11 ms | **100.0%** | 710 MB / 3.0 GB |
| **Escalón 3: Votación Media** | **250 VU** | 750 | **523.39 req/s** | 312.61 ms | 462.44 ms | 493.93 ms | **100.0%** | 730 MB / 3.0 GB |
| **Escalón 4: Pico Auditorio** | **500 VU** | 1,000 | **391.94 req/s** | 736.34 ms | 1,139.87 ms | 1,562.69 ms | **100.0%** | **756 MB / 3.0 GB** |

---

## 2. Diagnóstico de Recursos del Sistema tras 500 Usuarios Concurrentes

- **Memoria RAM Total:** 3.7 GiB.
- **Memoria RAM en Uso:** **756 MiB** (solo 20% del total; **3.0 GiB libres y disponibles**).
- **Proceso Backend Node.js:** 126 MB RSS (3.2% de memoria del servidor).
- **Proceso PostgreSQL 18:** 32 MB RSS (0.8% de memoria del servidor).
- **Consumo de Swap:** 8.0 KiB (Swapfile de 2.0 GiB permanece virtualmente intacto).
- **Errores HTTP 500 / 502 / 504:** **CERO (0)**.

---

## 3. Certificación de Integridad: Prevención de Condiciones de Carrera (Double Voting)

Durante la prueba de estrés de 50 peticiones simultáneas con el mismo identificador estudiantil:
1. **Nginx Rate Limiting:** La directiva `limit_req zone=vote_limit burst=10 nodelay;` detuvo la ráfaga anormal, permitiendo procesar el primer lote y descartando solicitudes abusivas con código `HTTP 429`.
2. **Motor PostgreSQL:** De las peticiones que llegaron a base de datos, **EXACTAMENTE 1 VOTO FUE ACEPTADO (`HTTP 201 Created`)** y las concurrentes colisionaron con la restricción `UNIQUE(voter_type, normalized_identifier)` arrojando `HTTP 409 Conflict`.
3. **Resultado:** **Cero votos duplicados garantizados a nivel de red y persistencia.**
