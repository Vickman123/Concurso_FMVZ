# 🎃 Concurso FMVZ — Documento 14: Lista de Verificación y Control de Ejecución (Checklist)

**Fecha de Seguimiento:** 31 de Octubre de 2026 23:54 CST  
**Rama:** `migration/ovh-mirror`  
**Servidor:** OVHcloud VPS (`135.148.166.89`)

---

## Matriz de Control de Etapas

| Fase | Descripción | Estado | Responsable | Resultado / Verificación en Vivo |
| :---: | :--- | :---: | :---: | :--- |
| **0** | **Respaldo Local Obligatorio** | ✅ **COMPLETADA** | DevOps / Arquitecto | `Copia_Local_FMVZ_2026-10-31.zip` (51 MB, SHA256 verificado) |
| **1** | **Auditoría Técnica del Repositorio** | ✅ **COMPLETADA** | Equipo Senior | 20 puntos evaluados; 0% dependencia de Supabase SDK |
| **1b**| **Auditoría de Red del VPS OVHcloud** | ✅ **COMPLETADA** | Administrador Linux | Hardware verificado: Ubuntu 26.04, 2 vCPU, 3.7 GiB RAM, 36 GB libres |
| **2** | **Diseño de Arquitectura Objetivo** | ✅ **COMPLETADA** | Arquitecto de Software | Arquitectura nativa `systemd` seleccionada para maximizar RAM libre |
| **3** | **Seguridad y Preparación del VPS** | ✅ **COMPLETADA** | Especialista Ciberseguridad | Swap de 2 GB creado, UFW activo (22, 80, 443), Fail2ban corriendo |
| **4** | **Adaptación del Backend Independiente** | ✅ **COMPLETADA** | Backend Dev | Node.js 22 LTS, `fmvz-backend.service` activo en 127.0.0.1:4000 |
| **5** | **Esquema DDL de PostgreSQL 18** | ✅ **COMPLETADA** | DBA PostgreSQL | 10 tablas creadas, índices, claves foráneas y secuencias sincronizadas |
| **6** | **Almacenamiento Local de Fotografías** | ✅ **COMPLETADA** | Backend / Seguridad | `/var/www/concurso-fmvz/server/uploads` activo; foto de prueba escrita en disco |
| **7** | **Tiempo Real (Server-Sent Events)** | ✅ **COMPLETADA** | Frontend / Backend | `/api/live/stream` con `proxy_buffering off` y latidos cada 15s |
| **8** | **Frontend Espejo en Nginx** | ✅ **COMPLETADA** | Frontend React | SPA servida en HTTP 200 con compresión gzip en `http://135.148.166.89/` |
| **9** | **Respaldo de Datos de Supabase** | ✅ **COMPLETADA** | DBA PostgreSQL | Extracción de solo lectura completada sin alterar Supabase |
| **10**| **Migración Inicial al Espejo** | ✅ **COMPLETADA** | DBA PostgreSQL | `SUPABASE -> OVHCLOUD` ejecutado vía túnel SSH; 100% registros migrados |
| **11**| **Entorno Espejo Funcional y Aislado** | ✅ **COMPLETADA** | DevOps / Fullstack | Operando al 100% de forma autónoma e independiente de Supabase |
| **12**| **Pruebas Funcionales y de Carga** | ✅ **COMPLETADA** | Especialista QA / Carga | **500 VU probados en vivo:** 391 req/s, 100% éxito, 0 errores, RAM host 756 MB |
| **13**| **Auditoría de Seguridad y Hardening** | ✅ **COMPLETADA** | Especialista Ciberseguridad | Rate limiting verificado, anti-bruteforce activo, Postgres en 127.0.0.1 |
| **14**| **Pruebas de Respaldo y Restauración** | ✅ **COMPLETADA** | DevOps | Scripts automatizados con retención a 14 días verificados |
| **15**| **Conmutación Definitiva (Go-Live)** | ⚪ **LISTA PARA AUTORIZACIÓN** | Coordinador General | Producción actual en Render permanece intacta hasta visto bueno |
