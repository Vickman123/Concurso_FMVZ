# 🎃 FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
# REPORTE Y PROTOCOLO DE RESPALDO LOCAL INDEPENDIENTE

**Fecha y Hora de Generación:** 2026-10-31 20:46:40 CST  
**Repositorio de Origen:** https://github.com/Vickman123/Concurso_FMVZ  
**Estado:** ✅ Respaldo Creado, Verificado Criptográficamente e Integro.

---

## 1. Identificación y Metadatos del Respaldo

| Parámetro | Valor Verificado |
| :--- | :--- |
| **Nombre del Archivo ZIP** | `Copia_Local_FMVZ_2026-10-31.zip` |
| **Ruta Absoluta del ZIP** | `/Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31.zip` |
| **Directorio de la Copia** | `/Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31` |
| **Rama Git Respaldada** | `migration/hostinger-preparation` (con historial completo de `main` y ramas remotas) |
| **Último Commit (HEAD)** | `8a4e5315bc481b797feeeb7f4bde30b76ca5d08d` |
| **Mensaje de Commit** | *fix(qr): actualizar emblema de alta resolucion y renderizar QR y cartel promocional en ultra alta definicion* |
| **Tamaño del ZIP** | **51 MB** (53,059,584 bytes) |
| **Tamaño del Directorio** | **78.3 MB** (2,425 archivos) |
| **Algoritmo de Integridad** | SHA-256 |
| **Hash Criptográfico SHA256** | `33d86dc5debd6bfa4832f6b42466fd1ec2c29d91cfae2d177ae6e96f1959de90` |

---

## 2. Contenido del Respaldo

El archivo comprimido y la carpeta independiente contienen el 100% de los elementos necesarios para reconstruir el estado exacto del proyecto:

1. **Código Fuente Completo:**
   - Frontend en React + TypeScript + Vite (`client/`).
   - Backend en Node.js + Express + TypeScript (`server/`).
   - Todos los componentes, hooks, contextos y servicios.
2. **Historial Git Completo (`.git/`):**
   - Todos los commits, ramas, etiquetas y objetos del repositorio.
3. **Archivos Modificados y de Trabajo (Working Tree):**
   - Todas las adaptaciones de arquitectura y preparación realizadas.
4. **Recursos y Multimedia:**
   - Fotografías de disfraces en `server/uploads/`.
   - Logotipos vectoriales y PNGs en `client/public/logos/`.
   - Carteles y recursos promocionales en ultra alta definición.
5. **Infraestructura y Scripts:**
   - `docker-compose.yml`, `Dockerfile`, `.dockerignore`.
   - Configuraciones completas de Nginx en `nginx/`.
   - Scripts de respaldo, migración, pruebas de carga y verificación en `scripts/`.
   - Sistema de migraciones SQL en `server/src/db/migrations/`.
   - Los 11 manuales y documentos técnicos en `docs/`.

---

## 3. Tratamiento de Información Sensible y Ciberseguridad

En estricto apego a las normas de seguridad del proyecto:

1. **Exclusión de Secretos en Texto Plano:**
   - Los archivos `.env` y `server/.env` locales (que contenían la cadena de conexión activa con credenciales a Supabase) **NO** fueron incluidos en el archivo ZIP ni en la copia.
2. **Plantillas Sanitizadas:**
   - Se crearon `.env.sanitized` y `server/.env.sanitized` con las variables requeridas por el proyecto pero con valores redactados:
     ```env
     PORT=4000
     NODE_ENV=production
     DATABASE_URL=postgresql://[USERNAME_REDACTED]:[PASSWORD_REDACTED]@[HOST_REDACTED]:6543/[DATABASE_REDACTED]
     JWT_SECRET=[JWT_SECRET_REDACTED_MIGRATION_SAFE]
     ```
3. **Exclusión de `node_modules`:**
   - Se omitió la carpeta `node_modules/` (~197 MB) para garantizar un tamaño de compresión óptimo y portable (51 MB), garantizando que las dependencias se reinstalen de manera limpia y determinista mediante `package-lock.json`.

---

## 4. Verificación de Integridad Realizada

1. **Comprobación de Integridad del Archivo ZIP:**
   ```bash
   unzip -t /Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31.zip
   ```
   *Resultado:* `No errors detected in compressed data of Copia_Local_FMVZ_2026-10-31.zip.`
2. **Comprobación de Ausencia de Secretos:**
   ```bash
   unzip -l /Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31.zip | grep -E "\.env$"
   ```
   *Resultado:* 0 coincidencias.
3. **Comprobación del Hash SHA-256:**
   ```bash
   shasum -a 256 /Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31.zip
   ```
   *Resultado:* `33d86dc5debd6bfa4832f6b42466fd1ec2c29d91cfae2d177ae6e96f1959de90`

---

## 5. Procedimiento de Restauración Paso a Paso

Para restaurar el proyecto a partir de este respaldo en cualquier equipo o servidor:

### Paso 1: Descomprimir el archivo ZIP
```bash
cd /ruta/deseada/de/restauracion
unzip /Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31.zip
cd Copia_Local_FMVZ_2026-10-31
```

### Paso 2: Configurar Variables de Entorno
```bash
# Copiar plantilla sanitizada y colocar las credenciales del entorno deseado
cp .env.sanitized .env
# O utilizar la plantilla completa:
cp .env.example .env
```

### Paso 3: Reinstalar Dependencias
```bash
npm install
```

### Paso 4: Validar Compilación y Pruebas
```bash
npm run build
npm test
```

### Paso 5: Ejecutar el Proyecto
```bash
# Modo desarrollo:
npm run dev

# Modo producción o Docker:
docker compose up -d
```
