# 🎃 Concurso FMVZ — Documento 03: Auditoría Técnica del VPS en OVHcloud (Verificación en Vivo)

**Fecha y Hora de Auditoría:** 31 de Octubre de 2026 23:35 CST  
**Servidor Objetivo:** OVHcloud VPS (`135.148.166.89`)  
**Usuario de Operación:** `ubuntu`  
**Estado:** ✅ Auditoría en vivo completada exitosamente vía SSH (`id_ed25519`).

---

## 1. Especificaciones de Hardware y Recursos Verificados

| Parámetro | Valor Verificado en Vivo | Observación Técnica |
| :--- | :--- | :--- |
| **Sistema Operativo** | **Ubuntu 26.04 LTS (Resolute Raccoon)** | Kernel `7.0.0-14-generic` x86_64 |
| **Procesador (CPU)** | **2 vCPU** (`Intel Core Processor Haswell, no TSX`) | 2 núcleos virtuales asignados |
| **Memoria RAM** | **3.7 GiB Total** (538 MiB en uso, **3.2 GiB Disponibles**) | Excelente holgura de memoria |
| **Memoria Swap** | 0 B | Recomendado configurar swapfile de 2 GB para prevenir OOM |
| **Disco / Almacenamiento** | **38 GiB Total** (2.7 GiB usados, **36 GiB Libres** - 7% uso) | 36 GB disponibles para la aplicación y respaldos |
| **Usuarios con Shell** | `root` y `ubuntu` | Administración habitual mediante `ubuntu` con `sudo` |

---

## 2. Auditoría de Red, Puertos y Servicios en Escucha

- **Puertos en Escucha:**
  - `tcp/22` (0.0.0.0:22 y [::]:22): Demonio OpenSSH versión oficial activa.
  - `udp/53` & `tcp/53`: `systemd-resolve` (DNS local del sistema).
  - `udp/323`: `chronyd` (Sincronización horaria NTP).
- **Puertos Web (80 y 443):** Libres (sin servidor web previo).
- **Puerto Base de Datos (5432):** Libre (sin PostgreSQL previo).
- **Firewall UFW:** `Status: inactive` (listo para configurarse con política estricta).

---

## 3. Software Base Instalado

- **Git:** Instalado (`git version 2.53.0`).
- **Node.js / NPM:** No instalados.
- **PostgreSQL:** No instalado.
- **Nginx:** No instalado.
- **Docker / Docker Compose:** No instalados.
- **Directorio `/var/www`:** No existe aún.

**Conclusión:** Servidor completamente limpio, sin conflictos de dependencias ni servicios heredados, óptimo para el aprovisionamiento de la arquitectura espejo de Concurso FMVZ.
