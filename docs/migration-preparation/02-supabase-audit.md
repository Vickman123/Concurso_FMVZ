# 🎃 Concurso FMVZ — Documento 02: Auditoría Técnica Integral y Dependencias de Supabase

**Fecha:** 31 de Octubre de 2026  
**Auditor:** Equipo Senior Multidisciplinario (Arquitectura, Seguridad y BD)  
**Objetivo:** Determinar con precisión matemática qué dependencias reales existen respecto a Supabase y servicios externos.

---

## Matriz de los 20 Puntos de Auditoría Técnica

| # | Área de Auditoría | Hallazgo en el Código Real | Nivel de Dependencia de Supabase | Acción Requerida para OVHcloud |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Arquitectura Frontend** | SPA en React 18, Vite y Tailwind CSS. Consume endpoints REST vía `fetch` y SSE vía `EventSource`. | **Nula (0%)** | Ninguna en la lógica; solo modularizar `VITE_API_URL`. |
| **2** | **Componentes y Rutas** | 12 rutas públicas y 8 administrativas estructuradas en `react-router-dom`. | **Nula (0%)** | Reutilización directa al 100%. |
| **3** | **Dependencias de Supabase** | **NO existe `@supabase/supabase-js`** en `package.json` de frontend ni backend. No se importan clientes de Supabase. | **Nula (0%)** | No hay código de biblioteca de Supabase que eliminar. |
| **4** | **Tablas y Relaciones** | 10 tablas estándar PostgreSQL con claves foráneas e integridad referencial (`ON DELETE CASCADE / SET NULL`). | **Exclusivamente Hosting** | Replicar esquema DDL mediante `001_initial_schema.sql` en PostgreSQL 16. |
| **5** | **Políticas RLS (Row Level Security)** | **NO se utilizan políticas RLS de Supabase.** La seguridad y control de acceso se ejecutan 100% en el backend de Node.js mediante middlewares Express y JWT. | **Nula (0%)** | No se requiere migrar ni adaptar políticas RLS. |
| **6** | **Funciones RPC de Supabase** | **NO se utilizan funciones RPC.** Todas las consultas SQL (`SELECT`, `INSERT`, `UPDATE`, transacciones) están escritas en TypeScript en los controladores (`participantController.ts`, `voteController.ts`, etc.). | **Nula (0%)** | No hay stored procedures dependientes de Supabase. |
| **7** | **Triggers de Base de Datos** | No existen triggers PL/pgSQL activos en la base de datos de Supabase. Los cálculos y normalizaciones se realizan en la capa de servicio de Node.js. | **Nula (0%)** | Reutilizar la lógica existente en Node.js. |
| **8** | **Autenticación** | Sistema propio basado en `bcrypt` (hash de passwords en tabla `admins`) y `jsonwebtoken` (JWT emitido con `JWT_SECRET`). No se usa Supabase Auth (`gotrue`). | **Nula (0%)** | 100% independiente de Supabase. Se preservan los hashes de administradores. |
| **9** | **Gestión de Sesiones** | Token JWT almacenado en `localStorage` del navegador cliente, enviado en la cabecera `Authorization: Bearer <token>`. | **Nula (0%)** | Totalmente compatible sin cambios. |
| **10** | **Participantes** | Gestión integral en tabla `participants` con campos `contest_number`, `status` (`pending`, `approved`, etc.), `registration_folio`. | **Alojamiento BD** | Migrar datos vía `pg_dump` conservando los identificadores y relaciones. |
| **11** | **Sistema de Votación** | Validación institucional en `server/src/utils/validation.ts` y registro en dos fases: inserción de `voters` e inserción en `votes`. | **Alojamiento BD** | Preservar intacta la lógica transaccional. |
| **12** | **Prevención de Votos Duplicados** | Garantizada a dos niveles: (a) validación en backend con `normalizeIdentifier()`, y (b) restricción estricta de base de datos `UNIQUE(voter_type, normalized_identifier)`. | **Motor PostgreSQL** | Idéntica funcionalidad en PostgreSQL 16 local. |
| **13** | **Fotografías** | Almacenadas originalmente como cadenas Base64 en la columna `photo_url` (`data:image/jpeg;base64,...`). **No se utilizó Supabase Storage S3.** | **Nula respecto a S3** | Desacoplar a disco persistente `/uploads` con `storageService.ts` para aliviar la BD. |
| **14** | **Reacciones en Vivo** | Emojis transmitidos y guardados en tabla `live_reactions` con timestamp. | **Alojamiento BD** | Replicación idéntica en PostgreSQL local. |
| **15** | **Funcionalidades Realtime** | Implementadas mediante **Server-Sent Events (SSE)** nativos de HTTP en `/api/live/stream`. **No se usa Supabase Realtime Channels.** | **Nula (0%)** | Ajustar directivas de Nginx (`proxy_buffering off`) para que los eventos fluyan en tiempo real. |
| **16** | **Panel Administrativo** | 8 vistas completas en React consumiendo `/api/admin/*`. Control de acceso basado en rol (`admin` y `operator`). | **Nula (0%)** | Totalmente independiente. |
| **17** | **Variables de Entorno** | Actualmente requiere `DATABASE_URL` (cadena de Supabase) y `JWT_SECRET`. | **Solo Configuración** | Cambiar `DATABASE_URL` a la instancia local de OVHcloud (`127.0.0.1:5432`) y desactivar SSL obligatorio (`DATABASE_SSL=false`). |
| **18** | **Funciones Serverless** | No se utilizan Supabase Edge Functions ni AWS Lambda. El backend es un servidor continuo Express. | **Nula (0%)** | Desplegar como servicio persistente (`systemd` o Docker Compose). |
| **19** | **Servicios Externos** | Ninguno (no depende de Stripe, Auth0, SendGrid, ni servicios de terceros). Sistema 100% autocontenido. | **Nula (0%)** | Ninguna dependencia de terceros que gestionar. |
| **20** | **Dependencias de Terceros** | Dependencias npm estándar: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `cors`, `helmet`, `lucide-react`, `canvas-confetti`. | **Nula (0%)** | Compatibilidad nativa en Node.js 20 sobre Ubuntu. |

---

## Conclusión Técnica de la Auditoría

> [!IMPORTANT]
> **Supabase actúa en este proyecto únicamente como un servidor remoto de PostgreSQL.**  
> No existe acoplamiento a SDKs propietarios, funciones RPC, Supabase Auth, ni Supabase Storage.  
> Por lo tanto, la migración a la infraestructura propia en OVHcloud consiste en:
> 1. Exportar la base de datos PostgreSQL de Supabase hacia el PostgreSQL 16 de OVHcloud.
> 2. Desacoplar las fotos en Base64 para guardarlas en el sistema de archivos local (`/uploads`).
> 3. Apuntar la variable de entorno `DATABASE_URL` al PostgreSQL local (`127.0.0.1:5432`).
> 4. Servir el tráfico a través del proxy inverso Nginx con certificados SSL propios.
