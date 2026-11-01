# 🎃 Concurso FMVZ — Documento 19: Plan de Recuperación ante Desastres Catastróficos (Disaster Recovery)

**Fecha:** 31 de Octubre de 2026  
**Nivel de Alerta:** Catástrofe (Pérdida total del VPS, corrupción de disco o destrucción física de la instancia)  
**Objetivo de Continuidad:** Restauración total en servidor alterno en menos de 30 minutos

---

## 1. Escenarios Catastróficos Contemplados

| Escenario | Impacto | Estrategia de Mitigación Inmediata |
| :--- | :--- | :--- |
| **Pérdida total del VPS OVHcloud** | Servidor inaccesible, disco dañado o hardware destruido. | Conmutación instantánea a Render (producción viva) o aprovisionamiento de un nuevo VPS utilizando la copia `Copia_Local_FMVZ_2026-10-31.zip`. |
| **Corrupción de Base de Datos** | Tabla de votos o participantes dañada por fallo de I/O. | Restauración en caliente del último volcado válido mediante `scripts/restore_db.sh`. |
| **Pérdida de Conectividad en Auditorio** | La red Wi-Fi o datos móviles de la UNAM fallan en el recinto. | La pantalla del proyector en `/en-vivo` retiene el último estado conocido y reconecta automáticamente cada 3 segundos gracias a la resiliencia nativa de `EventSource`. |

---

## 2. Procedimiento de Reconstrucción en Frío (Bare-Metal Restore)

Si se debe levantar un nuevo servidor desde cero en cualquier proveedor:

### Paso 1: Aprovisionar nuevo VPS Ubuntu
```bash
sudo apt update && sudo apt install -y unzip curl git nginx postgresql
```

### Paso 2: Extraer el Respaldo Independiente
```bash
# Subir el ZIP respaldado
scp /Users/vickcarg/Downloads/Copia_Local_FMVZ_2026-10-31.zip ubuntu@NUEVO_VPS:/tmp/

# Descomprimir en el nuevo servidor
sudo mkdir -p /var/www/concurso-fmvz
sudo chown -R ubuntu:ubuntu /var/www/concurso-fmvz
unzip /tmp/Copia_Local_FMVZ_2026-10-31.zip -d /var/www/
mv /var/www/Copia_Local_FMVZ_2026-10-31/* /var/www/concurso-fmvz/
```

### Paso 3: Restaurar Datos y Fotografías
```bash
cd /var/www/concurso-fmvz
./scripts/restore_db.sh /ruta/al/ultimo_backup.sql.gz
./scripts/restore_uploads.sh /ruta/al/ultimo_uploads.tar.gz
```

### Paso 4: Levantar y Validar
```bash
npm install
npm run build
sudo systemctl restart fmvz-backend
./scripts/verify_db_integrity.sh
```

Tiempo total estimado de ejecución: **15 a 20 minutos**.
