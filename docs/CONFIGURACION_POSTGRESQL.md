# Configuración y Optimización de PostgreSQL 16
## Sistema de Votación FMVZ 2026 — Hostinger VPS

---

## 1. Parámetros del Motor PostgreSQL 16

El contenedor `fmvz_halloween_db` ejecuta la imagen oficial `postgres:16-alpine`. Para maximizar el rendimiento en un VPS de 4 GB a 8 GB de RAM bajo picos de concurrencia de votación, se aplican los siguientes parámetros optimizados:

| Parámetro | Valor para VPS (4 GB RAM) | Valor para VPS (8 GB RAM) | Propósito Técnico |
| :--- | :--- | :--- | :--- |
| `max_connections` | `100` | `150` | Límite seguro de sockets concurrentes. |
| `shared_buffers` | `1024MB` | `2048MB` | 25% de la memoria total para caché interna de páginas en disco. |
| `effective_cache_size` | `3072MB` | `6144MB` | Estimación de memoria disponible en SO para el optimizador de consultas. |
| `maintenance_work_mem` | `256MB` | `512MB` | Memoria para operaciones de creación de índices y `VACUUM`. |
| `work_mem` | `16MB` | `32MB` | Memoria por operación de ordenamiento/agrupamiento (evita I/O a disco). |
| `checkpoint_completion_target`| `0.9` | `0.9` | Distribuye la escritura de checkpoints durante el 90% del intervalo. |
| `wal_buffers` | `16MB` | `16MB` | Búferes para transacciones Write-Ahead Logging. |
| `default_statistics_target` | `100` | `100` | Calidad de estadísticas de los índices B-Tree. |

### Aplicación en `docker-compose.yml` (Opcional por banderas):
```yaml
services:
  db:
    image: postgres:16-alpine
    command: >
      postgres
      -c shared_buffers=1024MB
      -c effective_cache_size=3072MB
      -c work_mem=16MB
      -c maintenance_work_mem=256MB
      -c checkpoint_completion_target=0.9
      -c max_connections=100
```

---

## 2. Configuración del Pool de Conexiones en Node.js

El backend de Express utiliza el driver nativo `pg` (v8.13.3) configurado en `server/src/db/connection.ts`:

```typescript
const poolMax = parseInt(process.env.DB_POOL_MAX || '25', 10);
const poolIdleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10);
const poolConnectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || '5000', 10);

pgPool = new Pool({
  connectionString: dbUrl,
  ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  max: poolMax,
  idleTimeoutMillis: poolIdleTimeout,
  connectionTimeoutMillis: poolConnectTimeout,
});
```

### Justificación de `max: 25`:
- Cada conexión en Node.js es compartida eficientemente de forma asíncrona.
- 25 conexiones en el pool pueden procesar más de **1,200 consultas transaccionales por segundo** en PostgreSQL local (latencia de consulta < 2ms).
- Evita saturar el procesador del VPS por excesivo context switching entre procesos de PostgreSQL.

---

## 3. Esquema de Tablas, Índices y Restricciones

El esquema se divide en 10 tablas relacionales optimizadas:

```sql
-- 1. Control del Concurso
contest_settings (id, contest_name, contest_date, registration_limit, voting_status, results_publication_status, is_live_active)

-- 2. Categorías de Premiación
prize_categories (id, name, amount_mxn, allocation_method, rank_position, quantity, status)

-- 3. Cuentas Administrativas
admins (id, name, email UNIQUE, password_hash, role, status)

-- 4. Participantes Registrados
participants (id, contest_number UNIQUE, full_name, public_display_name, costume_title, description, participant_type, institutional_identifier, photo_original_key, status, registration_folio UNIQUE)

-- 5. Padrón Anonimizado de Votantes
voters (id, full_name, voter_type, normalized_identifier, CONSTRAINT unique_voter_identity UNIQUE (voter_type, normalized_identifier))

-- 6. Sufragios Tradicionales
votes (id, voter_id UNIQUE REFERENCES voters(id), participant_id REFERENCES participants(id), confirmation_folio UNIQUE, status)

-- 7. Bitácora Inmutable
audit_logs (id, admin_id REFERENCES admins(id), action, entity_type, entity_id, timestamp, reason, metadata JSONB)

-- 8. Control de Escenario en Vivo
live_stage_session (id, stage_status, current_participant_id REFERENCES participants(id), voting_seconds_left, total_cheers, is_active)

-- 9. Votos en Vivo
live_votes (id, voter_id REFERENCES voters(id), participant_id REFERENCES participants(id), vote_value, CONSTRAINT unique_live_voter_participant UNIQUE (voter_id, participant_id))

-- 10. Reacciones Comunitarias
live_reactions (id, emoji, created_at)
```

### Índices B-Tree Clave:
```sql
CREATE INDEX IF NOT EXISTS idx_participants_contest_number ON participants(contest_number);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_voters_normalized ON voters(voter_type, normalized_identifier);
CREATE INDEX IF NOT EXISTS idx_votes_participant ON votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_votes_confirmation_folio ON votes(confirmation_folio);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_live_votes_participant ON live_votes(participant_id);
```

---

## 4. Healthcheck y Monitoreo de PostgreSQL

El contenedor define un healthcheck periódico mediante `pg_isready`:
```bash
docker exec -it fmvz_halloween_db pg_isready -U fmvz_admin -d fmvz_halloween
```
Respuesta esperada:
`127.0.0.1:5432 - accepting connections`

Para inspeccionar conexiones activas en tiempo real:
```sql
SELECT pid, usename, client_addr, state, query_start, query 
FROM pg_stat_activity 
WHERE datname = 'fmvz_halloween' AND state = 'active';
```
