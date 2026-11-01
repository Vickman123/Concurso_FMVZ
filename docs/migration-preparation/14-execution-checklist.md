# 🎃 Concurso FMVZ — Documento 14: Lista de Verificación y Control de Ejecución (Checklist)

**Fecha de Seguimiento:** 31 de Octubre de 2026  
**Rama:** `migration/ovh-mirror`

---

## Matriz de Control de Etapas

| Fase | Descripción | Estado | Responsable | Firma / Verificación |
| :---: | :--- | :---: | :---: | :--- |
| **0** | **Respaldo Local Obligatorio** | ✅ **COMPLETADA** | DevOps / Arquitecto | `Copia_Local_FMVZ_2026-10-31.zip` (51 MB, SHA256 verificado) |
| **1** | **Auditoría Técnica del Repositorio** | ✅ **COMPLETADA** | Equipo Senior | 20 puntos evaluados en `02-supabase-audit.md` |
| **1b**| **Auditoría de Red del VPS OVHcloud** | ✅ **COMPLETADA** | Administrador Linux | Puerto 22 accesible; 80, 443, 5432 cerrados perimetralmente |
| **2** | **Diseño de Arquitectura Objetivo** | ✅ **COMPLETADA** | Arquitecto de Software | Especificada en `04-target-architecture.md` |
| **3** | **Seguridad y Preparación del VPS** | 🟡 **EN PROCESO** | Administrador Linux / Seguridad | Esperando autorización de llave SSH para ejecución de scripts en host |
| **4** | **Adaptación del Backend Independiente** | ✅ **COMPLETADA** | Backend Dev | Modos `STORAGE_MODE`, pool singleton y apagado elegante listos |
| **5** | **Esquema DDL de PostgreSQL 16** | ✅ **COMPLETADA** | DBA PostgreSQL | `001_initial_schema.sql` verificado con claves foráneas e índices |
| **6** | **Almacenamiento Local de Fotografías** | ✅ **COMPLETADA** | Backend / Seguridad | `storageService.ts` implementado con validación de magic bytes |
| **7** | **Tiempo Real (Server-Sent Events)** | ✅ **COMPLETADA** | Frontend / Backend | `/api/live/stream` con pings `:ping` cada 15s y buffer off en Nginx |
| **8** | **Frontend Espejo con `VITE_API_URL`** | ✅ **COMPLETADA** | Frontend React | Centralizado en `client/src/services/api.ts` y compilación limpia |
| **9** | **Respaldo de Datos de Supabase** | 🟡 **LISTO PARA EJECUCIÓN** | DBA PostgreSQL | Scripts `migrate_from_supabase.sh` listos |
| **10**| **Migración Inicial al Espejo** | ⚪ **PENDIENTE DE VPS** | DBA PostgreSQL | Ejecución `SUPABASE -> OVHCLOUD` |
| **11**| **Entorno Espejo Funcional** | ⚪ **PENDIENTE DE VPS** | DevOps / Fullstack | Levantamiento del servicio en puerto 4000 de OVHcloud |
| **12**| **Pruebas Funcionales y de Carga** | ✅ **STAGING OK** / ⚪ VPS | Especialista QA / Carga | Suite `scripts/load-test.mjs` lista para ejecutar contra IP VPS |
| **13**| **Auditoría de Seguridad y Hardening** | 🟡 **EN PROCESO** | Especialista Ciberseguridad | Plan documentado en `09-security-plan.md` |
| **14**| **Pruebas de Respaldo y Restauración** | ✅ **SCRIPTS LISTOS** | DevOps | Scripts con rotación a 14 días en `scripts/` |
| **15**| **Conmutación Definitiva (Go-Live)** | ⚪ **PROHIBIDO HASTA AUTORIZACIÓN** | Coordinador General | Requiere visto bueno explícito del usuario |
