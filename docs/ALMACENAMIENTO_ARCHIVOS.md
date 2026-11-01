# Almacenamiento Persistente de Archivos y Fotografías
## Sistema de Votación FMVZ 2026 — Hostinger VPS

---

## 1. Estrategia de Almacenamiento

El certamen maneja fotografías de disfraces cargadas por concursantes y moderadas por administradores. Durante la fase inicial en Render (cuyo disco es efímero en el plan gratuito), las fotografías se convirtieron temporalmente a cadenas Base64 almacenadas dentro de la tabla `participants` en PostgreSQL.

En el VPS de Hostinger, el almacenamiento migra a un **volumen persistente en disco**:
- **Volumen Docker:** `fmvz_uploads_data` montado en `/app/server/uploads`.
- **Ruta en Host:** `/var/lib/docker/volumes/fmvz_uploads_data/_data` o `/var/www/concurso-fmvz/server/uploads`.
- **Acceso:** Servido de forma estática por Nginx en la ruta `/uploads/archivo.jpg`.

---

## 2. Servicio de Almacenamiento (`storageService.ts`)

Ubicado en `server/src/services/storageService.ts`, el servicio abstrae el guardado de archivos soportando dos modalidades mediante la variable `STORAGE_MODE`:

1. `STORAGE_MODE=disk` (Por defecto en VPS y Docker):
   - Genera nombres aleatorios criptográficos no predecibles.
   - Guarda el archivo binario en el directorio `UPLOAD_DIR`.
   - Retorna la URL relativa `/uploads/costume_1730000000_a1b2c3d4e5f6.jpg`.
2. `STORAGE_MODE=base64` (Fallback para entornos sin disco persistente):
   - Convierte el buffer en un Data URL `data:image/jpeg;base64,...`.
   - Permite retrocompatibilidad con despliegues efímeros.

### Retrocompatibilidad Garantizada:
El frontend de React maneja de forma idéntica `<img src={participant.photo_original_key} />` tanto si es una URL `/uploads/...` como si es un Data URL Base64 `data:image/...`.

---

## 3. Validación y Seguridad de Archivos Cargados

El pipeline de carga en `server/src/middleware/upload.ts` implementa tres barreras de seguridad:

### 3.1 Límite de Tamaño de Archivo
- Configurado a **8 Megabytes (8 * 1024 * 1024 bytes)** en Multer.
- Nginx limita a **15 Megabytes** a nivel HTTP antes de alcanzar Node.js.

### 3.2 Validación de Extensiones y Tipos MIME Permitidos
Solo se aceptan:
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)

### 3.3 Verificación de Magic Bytes (Firmas de Cabecera)
El middleware `validateImageMagicBytes` inspecciona los primeros bytes del búfer en memoria RAM para evitar que scripts ejecutables o archivos maliciosos sean disfrazados de imágenes:
- **JPEG:** `0xFF 0xD8 0xFF`
- **PNG:** `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
- **WebP:** `RIFF .... WEBP`

Si los magic bytes no coinciden con la firma esperada, la solicitud es rechazada con código `400 Bad Request`.

---

## 4. Extracción de Fotografías Existentes en Base64

Para extraer las fotografías existentes en Supabase hacia el disco del VPS durante la migración:

```bash
# Ejecutar extractor en el contenedor o en local
node scripts/extract_photos_to_disk.mjs --update-db
```

### Funcionamiento del Script:
1. Consulta la tabla `participants` filtrando `photo_original_key LIKE 'data:image/%'`.
2. Decodifica el payload Base64 a buffer binario.
3. Escribe el archivo en `uploads/costume_pXX_[hash].jpg`.
4. Si `--update-db` está activo, actualiza la fila en PostgreSQL con la nueva ruta `/uploads/costume_pXX_[hash].jpg`.

---

## 5. Respaldos y Restauración del Almacenamiento

### 5.1 Generar Respaldo Comprimido con Checksum
```bash
./scripts/backup_uploads.sh
```
- Empaqueta el directorio de uploads en un archivo tar gzipped: `backups/uploads/fmvz_uploads_YYYYMMDD_HHMMSS.tar.gz`.
- Calcula y guarda el hash SHA256 en `.sha256`.

### 5.2 Restaurar Respaldo de Fotografías
```bash
./scripts/restore_uploads.sh backups/uploads/fmvz_uploads_20261030_120000.tar.gz
```
- Descomprime y restaura la estructura en `/app/server/uploads`.
- Valida el número de archivos restaurados.
