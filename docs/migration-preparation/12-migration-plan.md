# 🎃 Concurso FMVZ — Documento 12: Plan Maestro de Migración hacia Infraestructura Espejo en OVHcloud

**Fecha:** 31 de Octubre de 2026  
**Dirección de la Migración Inicial:** `SUPABASE → OVHCLOUD` (Solo lectura en Supabase; cero escrituras)  
**Objetivo:** Construir una réplica funcional idéntica en OVHcloud mientras producción continúa operando en Render sin perturbación alguna.

---

## 1. Fases Cronológicas del Plan Maestro

```mermaid
flowchart TD
    F0["Fase 0: Respaldo Local (COMPLETADA Y VERIFICADA)"] --> F1["Fase 1: Auditoría Técnica y VPS"]
    F1 --> F2["Fase 2: Preparación de Sistema Operativo y Red en OVHcloud"]
    F2 --> F3["Fase 3: Despliegue de PostgreSQL 16 y Esquema Inicial"]
    F3 --> F4["Fase 4: Volcado de Solo Lectura desde Supabase"]
    F4 --> F5["Fase 5: Extracción de Fotografías a Almacenamiento Local"]
    F5 --> F6["Fase 6: Despliegue de Backend Node.js y Nginx en OVHcloud"]
    F6 --> F7["Fase 7: Verificación de Integridad y Pruebas Funcionales en Espejo"]
    F7 --> F8["Fase 8: Pruebas de Carga Progresivas (10 a 500 VU)"]
    F8 --> F9["Fase 9: Congelación y Preparación de Ventana de Conmutación Futura"]
```

---

## 2. Protocolo de Extracción de Datos de Supabase (Solo Lectura)

1. **Garantía de No Invasión:**
   - No se ejecutan `ALTER TABLE`, `UPDATE` ni `DELETE` sobre la base de datos de Supabase.
   - La extracción se realiza mediante una conexión estándar de lectura `pg_dump`:
     ```bash
     pg_dump "$SUPABASE_READONLY_URL" \
       --no-owner \
       --no-privileges \
       --data-only \
       --exclude-table=schema_migrations \
       > /tmp/supabase_production_data.sql
     ```
2. **Carga en PostgreSQL de OVHcloud:**
   - La base de datos local en OVHcloud se inicializa con `server/src/db/migrations/001_initial_schema.sql`.
   - Se inyectan los datos:
     ```bash
     psql "$OVH_LOCAL_DATABASE_URL" < /tmp/supabase_production_data.sql
     ```
3. **Sincronización de Secuencias:**
   - Se ajustan los correlativos `SELECT setval('participants_id_seq', MAX(id)) FROM participants;` para evitar colisiones en futuros registros.

---

## 3. Matriz de Validación de Datos Post-Migración

| Entidad | Criterio de Aceptación | Método de Comprobación |
| :--- | :--- | :--- |
| **`contest_settings`** | Exactamente 1 registro idéntico con límites y fechas. | `SELECT count(*) FROM contest_settings;` |
| **`admins`** | 2 registros de administradores con contraseñas encriptadas con `bcrypt`. | `SELECT email, role FROM admins;` |
| **`participants`** | 100% de los concursantes migrados con sus folios y números correlativos. | `SELECT count(*), max(contest_number) FROM participants;` |
| **`voters`** | Identidades normalizadas intactas. | `SELECT count(*) FROM voters;` |
| **`votes`** | Cero votos huérfanos (`voter_id` y `participant_id` válidos). | Query anti-join ejecutada en `verify_db_integrity.sh`. |
| **Fotografías** | Cada participante cuenta con su archivo físico en `/uploads` verificado en tamaño. | `ls -la /var/www/concurso-fmvz/server/uploads | wc -l` |
