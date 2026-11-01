# 🎃 Concurso FMVZ — Documento 18: Auditoría de Seguridad y Resolución de Vulnerabilidades

**Fecha:** 31 de Octubre de 2026  
**Auditor:** Especialista Senior en Ciberseguridad  
**Alcance:** Repositorio de Código, Configuración de Servidor, Dependencias y Base de Datos

---

## 1. Hallazgos de Seguridad Evaluados y Resoluciones

| # | Riesgo / Vulnerabilidad | Severidad | Estado Original | Resolución Técnica Aplicada |
| :---: | :--- | :---: | :---: | :--- |
| **V-01** | **Exposición de Credenciales en Texto Plano** | **Alta** | `.env` contenía contraseñas de Supabase en el repositorio local. | Excluido de respaldos ZIP y Git; creado `.env.example` y plantillas sanitizadas `.env.sanitized`. |
| **V-02** | **Ataques de Concurrencia (Race Condition / Double Voting)** | **Crítica** | Votantes simultáneos enviando el mismo número de cuenta en paralelo. | Blindado en dos capas: normalización en backend y cerrojo a nivel de motor en PostgreSQL `UNIQUE(voter_type, normalized_identifier)`. |
| **V-03** | **Filtro de Datos Personales de Participantes** | **Media** | Endpoint `/api/participants` retornaba `institutional_identifier` en lecturas públicas. | Removido el campo del `SELECT` público en `participantController.ts` para cumplir con avisos de privacidad y protección de datos UNAM. |
| **V-04** | **Subida de Archivos Arbitrarios (Web Shells)** | **Alta** | Subida de imágenes sin comprobación profunda de tipo MIME binario. | Implementado `storageService.ts` con análisis de magic bytes y asignación de nombres criptográficos UUIDv4. |
| **V-05** | **Fugas de Memoria en SSE (Server-Sent Events)** | **Media** | El intervalo de latido `:ping` retenía el bucle de eventos de Node.js. | Desreferenciado mediante `pingInterval.unref()` permitiendo cierre elegante. |
| **V-06** | **Exposición Pública de PostgreSQL** | **Alta** | Riesgo de abrir puerto 5432 en el VPS. | PostgreSQL configurado para escuchar exclusivamente en `127.0.0.1:5432`. UFW no expone el puerto al exterior. |
| **V-07** | **Ataques de Fuerza Bruta en SSH** | **Alta** | Intentos masivos automatizados de login SSH en servidores públicos de OVHcloud. | Implementación de `fail2ban` con bloqueo de 2 horas tras 5 intentos fallidos y uso de llaves Ed25519. |

---

## 2. Auditoría de Dependencias (NPM Audit)

- La totalidad de paquetes npm utilizados en `client/` y `server/` se encuentran en versiones estables y sin vulnerabilidades críticas reportadas.
- `helmet` y `cors` proporcionan cabeceras de seguridad estrictas contra Clickjacking (`X-Frame-Options: DENY`) y MIME Sniffing (`X-Content-Type-Options: nosniff`).
