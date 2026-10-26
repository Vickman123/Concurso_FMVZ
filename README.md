# FMVZ HALLOWEEN — Segundo Concurso de Disfraces UNAM
### Facultad de Medicina Veterinaria y Zootecnia · 3 de noviembre de 2026

Aplicación web funcional, mobile-first y de alta concurrencia diseñada para el **Segundo Concurso de Disfraces de la FMVZ UNAM**, optimizada para teléfonos móviles mediante acceso por código QR y con experiencia completa de escritorio.

---

## 🎃 Características Principales

- **Experiencia Mobile-First y PWA:** Barra de navegación inferior táctil, formularios progresivos de 4 pasos, tarjetas en 2 columnas, compatibilidad PWA con manifest y diseño responsive probado en resoluciones de 360, 390, 768, 1024 y 1440 píxeles.
- **Identidad Visual "FMVZ Halloween":** Paleta oficial (`#090B14`, `#141626`, `#8B5CF6`, `#FF7417`, `#F8F5F0`), iluminación naranja y violeta, murciélagos, lunas y calabazas vectoriales.
- **57 Participantes Iniciales Precargados:** Incluye base de datos y archivo CSV oficial con los 57 concursantes existentes caracterizados con disfraces humanos (Catrinas, vampiros, cirujanos, alquimistas, etc.), números de concurso 01 a 57 y fotografías temáticas.
- **Integridad Transaccional de Voto Único:** Validación rigurosa de 9 dígitos para estudiantes y 6 dígitos para trabajadores. Motor PostgreSQL con restricciones únicas que **impiden votos duplicados** incluso bajo solicitudes simultáneas en la misma milésima de segundo.
- **Panel Administrativo Completo:** Dashboard con KPIs en tiempo real, moderación de fotografías, control manual y programado de votación, importación masiva CSV con detección de duplicados, exportación oficial, cálculo de ganadores y bitácora inmutable de auditoría.
- **Generador de Códigos QR Oficiales:** Genera y descarga carteles con código QR de alta resolución para mamparas y proyección en el auditorio.
- **Probado para 500 Usuarios Concurrentes:** Superó pruebas de carga simulando 100, 250 y 500 usuarios virtuales simultáneos, alcanzando hasta 696.36 peticiones por segundo sin errores.

---

## 🚀 Inicio Rápido (Zero-Config)

### 1. Requisitos
- Node.js versión 20 o superior.
- npm versión 10 o superior.

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Inicializar base de datos y sembrar los 57 participantes
```bash
npm run seed
```
*(Utiliza el motor PostgreSQL WASM integrado para funcionar de inmediato sin requerir configuración de bases de datos externas en desarrollo local).*

### 4. Iniciar la aplicación
- **Modo Desarrollo (con recarga rápida):**
  ```bash
  npm run dev
  ```
  - Frontend: `http://localhost:3000`
  - Backend API: `http://localhost:4000`

- **Modo Producción (Frontend + Backend en un solo puerto):**
  ```bash
  npm run build
  npm start
  ```
  - Aplicación completa en: `http://localhost:4000`

---

## 🔐 Credenciales del Panel Administrativo

Acceso en `/admin/login` o mediante el botón del pie de página:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@fmvz.unam.mx` | `Halloween2026!` | Total: apertura/cierre, publicación de resultados, configuración, importación CSV, auditoría. |
| **Operador** | `operador@fmvz.unam.mx` | `Operador2026!` | Moderación de fotografías y revisión de concursantes. |

---

## 🗺️ Mapa de Rutas Públicas y Administrativas

### Rutas Públicas:
- `/` — Landing page con hero universitario, pasos de votación, premios y destacados.
- `/participantes` — Galería con filtros por estudiante/trabajador y buscador en tiempo real.
- `/participantes/:numero` — Detalle del disfraz, concepto y botón directo de votación.
- `/registrar` — Formulario progresivo en 4 pasos con subida y previsualización de foto.
- `/registro/estado` — Consulta segura del estado del registro (requiere folio e identificador).
- `/votar` — Identificación de votante (9 dígitos estudiante / 6 dígitos trabajador).
- `/votar/confirmar/:numero` — Confirmación de voto con tarjeta del participante.
- `/voto/confirmado` — Comprobante oficial con folio único y fecha/hora.
- `/premios` — Premios del certamen (1er $10,000, 2do $7,000, 3er $6,000 y 20 premios de $5,000).
- `/preguntas-frecuentes` — Centro de ayuda con acordeón interactivo.
- `/aviso-de-privacidad` — Aviso de privacidad integral conforme a la legislación de la UNAM.

### Rutas Administrativas Protegidas:
- `/admin/login` — Acceso autenticado con JWT y limitador de fuerza bruta.
- `/admin` — Tablero de métricas en tiempo real.
- `/admin/participantes` — Gestión de concursantes, cambio de estado e importación/exportación CSV.
- `/admin/fotografias` — Mesa de moderación y aprobación de fotografías.
- `/admin/votos` — Auditoría de sufragios con folios de confirmación.
- `/admin/resultados` — Cómputo de votos, ranking de ganadores y switch de publicación oficial.
- `/admin/premios` — Configuración de modalidades de asignación para los 20 premios adicionales.
- `/admin/configuracion` — Apertura/cierre de votación y generador de código QR.
- `/admin/auditoria` — Bitácora inmutable de eventos del sistema.

---

## 🧪 Pruebas Automatizadas y de Carga

```bash
# 1. Pruebas de integración de la API (validación, duplicidad, auth)
npm run test

# 2. Pruebas de estrés y concurrencia (100, 250, 500 usuarios simultáneos)
npm run load-test
```

---

## 📚 Documentación Técnica Entregable

Todos los manuales y reportes requeridos se encuentran en la carpeta `docs/`:
1. [Manual de Instalación y Despliegue (`docs/MANUAL_INSTALACION.md`)](docs/MANUAL_INSTALACION.md)
2. [Manual Administrativo (`docs/MANUAL_ADMINISTRATIVO.md`)](docs/MANUAL_ADMINISTRATIVO.md)
3. [Manual de Operación del Evento (`docs/MANUAL_OPERACION_EVENTO.md`)](docs/MANUAL_OPERACION_EVENTO.md)
4. [Plan de Contingencia y Recuperación ante Desastres (`docs/PLAN_CONTINGENCIA.md`)](docs/PLAN_CONTINGENCIA.md)
5. [Reporte de Pruebas de Carga y Concurrencia (`docs/REPORTE_PRUEBAS_CARGA.md`)](docs/REPORTE_PRUEBAS_CARGA.md)
