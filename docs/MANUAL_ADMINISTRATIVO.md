# Manual de Administración del Sistema
## Segundo Concurso de Disfraces FMVZ — UNAM 2026

Este manual orienta a los miembros del **Comité Organizador** y **Operadores de Mesa** de la FMVZ en el uso de las funciones del panel administrativo para la gestión del concurso.

---

## 1. Acceso y Roles de Usuario

El panel administrativo es accesible en la ruta:
```
https://concurso.fmvz.unam.mx/admin/login
(o http://localhost:4000/admin/login en desarrollo)
```

### Roles Disponibles:
1. **Administrador (`admin`):**
   - Acceso total al sistema.
   - Apertura y cierre del periodo de votación.
   - Publicación oficial de los resultados finales.
   - Edición de premios y configuración de cupos.
   - Importación y exportación de archivos CSV.
   - Consulta de la bitácora inmutable de auditoría.

2. **Operador (`operator`):**
   - Acceso a la mesa de moderación de fotografías.
   - Consulta de participantes y actualización de estatus de revisión.
   - Consulta del registro de votos para asistencia técnica en la mesa de ayuda.

### Cuentas Iniciales Preconfiguradas:
- **Administrador General:**
  - Correo: `admin@fmvz.unam.mx`
  - Contraseña: `Halloween2026!`
- **Operador de Mesa:**
  - Correo: `operador@fmvz.unam.mx`
  - Contraseña: `Operador2026!`

*(Las contraseñas se almacenan mediante hash criptográfico con sal en la base de datos).*

---

## 2. Dashboard Principal (`/admin`)

El tablero presenta las métricas clave del evento en tiempo real:
- **Total Participantes:** Cantidad de disfraces registrados respecto al límite de capacidad (57 precargados, capacidad máxima 100).
- **Aprobados / Galería:** Participantes cuya fotografía fue validada y se muestran en la galería pública.
- **Fotos Pendientes:** Imágenes subidas por concursantes que requieren aprobación antes de exhibirse.
- **Votos Válidos:** Total de votos únicos emitidos por la comunidad.
- **Control Rápido de Votación:** Interruptor con confirmación para cambiar el estado a **Abierta**, **Pausada** o **Cerrada**.
- **Actividad Reciente:** Resumen de los últimos movimientos registrados en la bitácora de auditoría.

---

## 3. Gestión de Participantes (`/admin/participantes`)

Permite supervisar la totalidad del padrón de concursantes:
- **Búsqueda y Filtros:** Búsqueda en tiempo real por nombre, título del disfraz, número de concurso o identificador. Filtros por estado (*Aprobado, Pendiente, Corrección, Rechazado, Inactivo*) y por tipo (*Estudiante / Trabajador*).
- **Edición de Estado:** Al hacer clic en el ícono de edición de cualquier fila, el administrador puede cambiar el estatus del participante e ingresar un **motivo de justificación** que se resguarda en la bitácora.
- **Importación Masiva (CSV):**
  - Permite subir un archivo CSV con nuevos concursantes.
  - El sistema verifica automáticamente que no existan números de cuenta o identificadores duplicados. Si un registro ya existe, lo omite e informa el conteo final de nuevos ingresos.
- **Exportación Oficial (CSV):**
  - Genera una descarga instantánea del listado autorizado con nombres públicos, títulos y folios.

---

## 4. Mesa de Moderación de Fotografías (`/admin/fotografias`)

Diseñada para una revisión visual rápida y ágil de los registros en espera:
- Cada tarjeta muestra la fotografía en gran formato, el número de participante y el concepto del disfraz.
- **Botón Aprobar:** Habilita al participante para aparecer en la galería pública y recibir votos.
- **Botón Ajustar (Corrección):** Marca el registro para que el concursante sustituya su imagen por una de mejor resolución.
- **Botón Rechazar:** Descalifica la propuesta en caso de incumplimiento de las bases (ej. fotografías de animales o mascotas).

---

## 5. Auditoría de Votos (`/admin/votos`)

- Muestra la lista de todos los sufragios emitidos con su correspondiente **Folio de Confirmación** (ej. `FMVZ-VOTO-2026-X9K3P2`), participante seleccionado y marca de tiempo.
- **Protección de Privacidad:** Cumpliendo con el principio de voto secreto y protección de datos, la plataforma no asocia públicamente la identidad del votante con su elección. Los números de cuenta de estudiantes no se muestran en claro.

---

## 6. Resultados y Publicación Oficial (`/admin/resultados`)

- Presenta la tabla de posiciones ordenada descendentemente por el número de votos válidos.
- Resalta con distintivos especiales los tres primeros lugares:
  - 🥇 **1er Lugar:** $10,000 MXN
  - 🥈 **2do Lugar:** $7,000 MXN
  - 🥉 **3er Lugar:** $6,000 MXN
- **Publicación de Resultados:** Mediante el botón *“Publicar resultados oficialmente”*, el administrador autoriza que la tabla de ganadores sea visible en la sección pública de Premios. Requiere confirmación explícita para evitar publicaciones accidentales.

---

## 7. Configuración de Premios (`/admin/premios`)

- Permite editar los montos y la redacción de las bases para cada categoría.
- **20 Premios Adicionales ($5,000 MXN):** Permite configurar y guardar la modalidad de asignación oficial (por ejemplo: menciones honoríficas del jurado calificador, sorteo entre participantes o categorías temáticas especiales). Esta nota se refleja automáticamente en la vista pública.

---

## 8. Generación de Código QR y Parámetros (`/admin/configuracion`)

- **Generador de QR:** Produce un código QR de alta resolución con contraste accesible que enlaza directamente a la URL pública del certamen.
- **Descarga:** Incluye un botón para descargar el archivo PNG en alta calidad, apto para impresión en carteles, lonas o proyección en auditorios.
- **Horarios del Concurso:** Permite ajustar la fecha oficial y las horas de inicio y fin.

---

## 9. Bitácora Inmutable de Auditoría (`/admin/auditoria`)

- Registra cada acción relevante realizada en el panel:
  - Inicio de sesión de operadores y administradores.
  - Modificaciones de estatus de participantes y motivos.
  - Cambios en el estado de la votación (apertura/cierre).
  - Publicación u ocultamiento de resultados.
  - Importaciones de archivos CSV.
- Cada entrada resguarda el ID del operador, dirección IP, agente de usuario, fecha/hora y parámetros modificados.
