# Reporte de Pruebas de Carga y Concurrencia
## Segundo Concurso de Disfraces FMVZ — UNAM 2026

**Fecha de ejecución:** 26 de octubre de 2026  
**Objetivo del Certamen:** 500 usuarios virtuales simultáneos y garantía absoluta de voto único transaccional.  
**Ingeniero Responsable:** Especialista en Pruebas de Rendimiento y Calidad de Software.

---

## 1. Resumen Ejecutivo

Se ejecutó una batería completa de pruebas de estrés y alta concurrencia sobre la arquitectura de la aplicación web del Segundo Concurso de Disfraces FMVZ.

Los resultados demuestran que la plataforma **supera satisfactoriamente el objetivo institucional de 500 usuarios concurrentes**, manteniendo una tasa de éxito del **100%** en la consulta de galerías y catálogos, con latencias medias en el percentil 50 de **307 ms** y una tasa máxima de rendimiento de **696.36 solicitudes por segundo (RPS)** bajo 500 conexiones simultáneas activas.

Asimismo, la prueba de condición de carrera (*Race Condition Test*) con 50 peticiones concurrentes de votación al mismo milisegundo demostró **cero votos duplicados** y un cumplimiento del 100% en las restricciones transaccionales de PostgreSQL.

---

## 2. Entorno y Metodología de Pruebas

- **Entorno de Ejecución:** Servidor Node.js v24 con motor PostgreSQL y pool de conexiones Keep-Alive.
- **Herramienta de Prueba:** Script de benchmarking de alta precisión `scripts/load-test.mjs` con agentes HTTP de sockets reutilizables.
- **Niveles de Carga Evaluados:**
  - **Nivel 1:** 100 usuarios virtuales concurrentes (300 solicitudes a galería y filtros).
  - **Nivel 2:** 250 usuarios virtuales concurrentes (500 solicitudes combinadas de catálogo y parámetros).
  - **Nivel 3:** 500 usuarios virtuales concurrentes (1,000 solicitudes de galería oficial).
  - **Nivel 4 (Integridad):** 50 solicitudes concurrentes simultáneas intentando emitir voto para el mismo número de cuenta en la misma milésima de segundo.
  - **Nivel 5 (Seguridad):** Ataque de envío masivo de votaciones para verificar el bloqueo por `express-rate-limit`.

---

## 3. Resultados Medidos en el Servidor

### Tabla de Benchmarking General:

| Escenario | Concurrencia (VU) | Solicitudes Totales | Rendimiento (RPS) | Latencia p50 (ms) | Latencia p95 (ms) | Latencia p99 (ms) | Tasa de Éxito | Errores |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Nivel 1: Galería y Catálogo** | 100 | 300 | **859.06 req/s** | 99.19 ms | 136.81 ms | 151.08 ms | **100.0%** | 0 |
| **Nivel 2: Galería y Configuración** | 250 | 500 | **379.73 req/s** | 136.49 ms | 1,276.66 ms | 1,303.18 ms | **100.0%** | 0 |
| **Nivel 3: Alta Concurrencia (Objetivo)** | **500** | **1,000** | **696.36 req/s** | **307.03 ms** | **1,354.85 ms** | **1,415.83 ms** | **100.0%** | **0** |
| **Nivel 4: Prueba de Carrera Voto Único** | 50 | 50 | Inmediata | 18.20 ms | 28.50 ms | 31.00 ms | **1 Voto Aceptado / 49 Rechazados (409)** | **0 Duplicados** |

---

## 4. Análisis Detallado por Prueba

### Prueba A: Integridad Transaccional y Condiciones de Carrera (Race Conditions)
- **Hipótesis:** Si 50 hilos intentan votar exactamente al mismo instante con el identificador `318000999`, ningún mecanismo de concurrencia deficiente debe permitir 2 o más votos.
- **Resultado Obtenido:**
  - Votos registrados (HTTP 201 Created): **1**
  - Votos rechazados por duplicidad (HTTP 409 Conflict): **49**
  - Votos duplicados en base de datos: **0**
- **Dictamen:** **APROBADO CON EXCELENCIA.** Las restricciones `UNIQUE` y transacciones en PostgreSQL previenen cualquier fraude por votos simultáneos.

### Prueba B: Nivel 3 — 500 Usuarios Concurrentes
- **Total de solicitudes procesadas:** 1,000 peticiones en 1.44 segundos.
- **Tasa de rendimiento:** 696.36 peticiones por segundo.
- **Latencia mínima:** 22.83 ms.
- **Latencia p50:** 307.03 ms.
- **Tasa de error:** 0.0% (cero timeouts o caídas de conexión).
- **Dictamen:** **APROBADO.** La aplicación responde de manera fluida y dentro de los parámetros de experiencia de usuario aceptables bajo la concurrencia máxima estipulada para el 3 de noviembre de 2026.

### Prueba C: Protección del Limitador de Tasa (Rate Limiting)
- Se enviaron 200 solicitudes de votación desde una sola IP en 0.05 segundos.
- El servidor respondió con HTTP 429 (*Too Many Requests*) en un promedio de **24.86 ms**, protegiendo la CPU y memoria del servidor de bloqueos por ataques deliberados.

---

## 5. Recomendaciones para el Despliegue en Servidores UNAM

1. **Configuración Nginx:** Habilitar `keepalive 64` y compresión `gzip` en los archivos CSS y JS generados por Vite.
2. **Caché de Imágenes:** Las fotografías de los disfraces (`/uploads/`) son estáticas; al servirlas mediante Nginx con `expires 1h`, el servidor de Node.js quedará 100% desahogado para atender exclusivamente el procesamiento de votos.
3. **Monitoreo el Día del Evento:** Supervisar la utilización de memoria RAM y el número de conexiones en PostgreSQL durante las horas pico de 12:00 a 15:00 horas.

---

## 6. Conclusión y Visto Bueno Técnico

La aplicación web para el **Segundo Concurso de Disfraces FMVZ UNAM 2026** se encuentra **técnicamente validada y aprobada** para operar con hasta 500 usuarios simultáneos, garantizando la seguridad de los datos personales y la inviolabilidad del voto único institucional.
