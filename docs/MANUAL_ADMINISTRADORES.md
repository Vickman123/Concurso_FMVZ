# 🎃 Manual de Operación para Administradores
## Segundo Concurso de Disfraces FMVZ - UNAM (Halloween 2026)

Este manual está diseñado para guiar paso a paso al Comité Organizador y moderadores de la **Facultad de Medicina Veterinaria y Zootecnia de la UNAM** en el uso integral de la plataforma web.

---

## 📑 Índice Rápido
1. [Acceso y Seguridad al Panel](#1-acceso-y-seguridad-al-panel)
2. [Dashboard Principal y Estadísticas en Vivo](#2-dashboard-principal-y-estadísticas-en-vivo)
3. [Gestión y Validación de Participantes](#3-gestión-y-validación-de-participantes)
4. [Moderación Visual de Fotografías](#4-moderación-visual-de-fotografías)
5. [Consola del Escenario en Vivo y Aplausómetro](#5-consola-del-escenario-en-vivo-y-aplausómetro)
6. [Auditoría de Votos y Exportación a Excel / CSV](#6-auditoría-de-votos-y-exportación-a-excel--csv)
7. [Cómputo y Publicación de Ganadores](#7-cómputo-y-publicación-de-ganadores)
8. [Configuración Global y Generador de Carteles QR](#8-configuración-global-y-generador-de-carteles-qr)
9. [Bitácora Inmutable de Auditoría](#9-bitácora-inmutable-de-auditoría)
10. [Protocolo de Contingencia para el Día del Evento](#10-protocolo-de-contingencia-para-el-día-del-evento)

---

## 1. Acceso y Seguridad al Panel

- **URL de Ingreso:** `https://concurso-fmvz.onrender.com/admin/login` (o botón de candado / enlace admin en el pie de página).
- **Credenciales:** Ingrese su correo institucional registrado y contraseña autorizada.
  > [!NOTE]
  > Por razones de seguridad institucional, los campos de usuario y contraseña **no se encuentran precargados**. Deben ingresarse manualmente cada vez.
- **Roles del Sistema:**
  - `admin` (Administrador General): Acceso total a cambios de estado, apertura del escenario en vivo, publicación de ganadores y configuración global.
  - `moderator` / `staff`: Acceso enfocado en revisión de fotografías, validación de fichas y consulta de auditoría.
- **Cierre de Sesión:** En el menú lateral izquierdo inferior, pulse el icono de salida (rojo) para revocar el token de sesión de forma inmediata.

---

## 2. Dashboard Principal y Estadísticas en Vivo

**Ruta:** `/admin`

El panel principal ofrece una visión panorámica instantánea de la salud del certamen:
- **Tarjetas de Conteo Global:** Total de participantes registrados, aprobados, pendientes de validación y rechazados.
- **Bandeja de Fotografías:** Número de imágenes esperando revisión de calidad.
- **Conteo de Votos Emitidos:** Votos acumulados vía Web vs. Votos acumulados en el Escenario en Vivo.
- **Interruptor de Votación Rápida:**
  - 🟢 **Abierta:** Permite la recepción normal de votos en el portal.
  - 🟡 **Pausada:** Detiene temporalmente la votación sin cerrar el concurso (ideal para descansos o anuncios del jurado).
  - 🔴 **Cerrada:** Bloquea totalmente la emisión de nuevos votos.

---

## 3. Gestión y Validación de Participantes

**Ruta:** `/admin/participantes`

Aquí se gestiona el padrón oficial de concursantes y sus fichas técnicas.

### 3.1 Filtros y Búsqueda
- **Barra de Búsqueda:** Escriba el nombre del alumno/profesor, el título del disfraz, número de cuenta o número de folio.
- **Filtro de Estado:** `Todos`, `Aprobados` (visibles en galería pública), `Pendientes` (recién inscritos), `Requiere corrección` o `Rechazados`.
- **Filtro de Tipo:** `Alumnos`, `Académicos / Trabajadores`, `Egresados`.

### 3.2 Cómo Validar y Aprobar a un Participante
1. Localice la tarjeta o fila del participante y haga clic en **"Revisar Ficha"** (icono de ojo).
2. Se abrirá la ventana emergente con el expediente completo:
   - Nombre público de la persona y de la mascota (si aplica).
   - Título del disfraz y reseña explicativa.
   - Datos institucionales (Número de cuenta / RFC / Correo / Teléfono de emergencia).
   - Vista previa de la fotografía.
3. Para dictaminar:
   - Seleccione en el menú desplegable: **"Aprobar Participante"**.
   - Escriba una nota de justificación (ej. *"Cumple con los requisitos y foto nítida"*).
   - Haga clic en **"Guardar Estado"**.
   - **Resultado:** El participante recibe su número de concursante oficial, se hace visible en la **Galería Pública** y queda listo para recibir votos.

### 3.3 Rechazo o Solicitud de Cambio de Foto
Si la foto no cumple las reglas (es borrosa, no muestra el disfraz o infringe las normas):
1. Seleccione **"Requiere Cambio de Fotografía"** o **"Rechazar"**.
2. **IMPORTANTE:** Ingrese el motivo claro en la caja de texto (ej. *"La imagen enviada está demasiado oscura, favor de subir una foto con buena iluminación"*).
3. Haga clic en **"Guardar Estado"**.
4. El estudiante podrá entrar a `/consultar-estatus` con su número de folio y verá la indicación exacta del comité para corregirla.

### 3.4 Reemplazo Directo de Foto por el Administrador
Si el concursante le entregó una fotografía de mejor resolución en una memoria USB o por correo del comité:
1. En el mismo expediente del participante, localice el botón **"Subir / Reemplazar Fotografía"**.
2. Seleccione el archivo desde su computadora.
3. El sistema la procesará y actualizará automáticamente la versión miniatura y la versión en alta definición.

### 3.5 Importación y Exportación Masiva
- **Exportar a CSV:** Haga clic en **"Descargar CSV"** para obtener una hoja de cálculo con todos los datos registrados.
- **Importar CSV:** Permite cargar previamente registros en lote si se recabaron inscripciones físicas en mesas de registro.

---

## 4. Moderación Visual de Fotografías

**Ruta:** `/admin/fotografias`

Diseñada para revisar rápidamente las imágenes subidas por los participantes:
1. Las fotos pendientes aparecen en una cuadrícula en alta definición.
2. Cada tarjeta cuenta con acciones directas:
   - **Botón Verde (Aprobar):** Aprueba la foto y publica al participante inmediatamente.
   - **Botón Amarillo (Solicitar corrección):** Abre una ventana para enviar la retroalimentación al concursante.
   - **Botón Rojo (Rechazar):** Descarta el registro que no cumpla con los lineamientos del concurso.

---

## 5. Consola del Escenario en Vivo y Aplausómetro

**Ruta:** `/admin/en-vivo`

Esta es la consola central para coordinar el evento presencial del **3 de noviembre de 2026**. Funciona con sincronización en tiempo real (estilo Kahoot/Twitch).

### 5.1 Activar el Escenario (Visibilidad Pública)
- El escenario permanece oculto por defecto para no confundir a los usuarios antes del evento.
- Al iniciar el concurso en el auditorio/explanada, presione el botón superior:
  **`Activar Escenario en Vivo`** (verde).
- Al activarse:
  - Aparece la pestaña *"🔴 EN VIVO"* con efecto pulsante en la barra de navegación de todo el público.
  - Se activa el banner y modal emergente de bienvenida que invita a los asistentes a conectarse desde su celular.

### 5.2 Conexión de la Pantalla Gigante (Proyector)
1. Conecte la laptop del jurado o cabina de sonido al proyector del auditorio.
2. En la consola, presione **`Abrir Pantalla de Proyección (Visor)`** (o abra en otra pestaña `https://concurso-fmvz.onrender.com/en-vivo`).
3. Presione `F11` (o pantalla completa) en su navegador.
4. Esa pantalla mostrará automáticamente al concursante en turno, el temporizador, el código QR de acceso y las reacciones de emojis flotando en vivo.

### 5.3 Control de Fases del Escenario (Paso a Paso)
El flujo en vivo consta de 4 estados que usted controla desde la consola:

```
[1. Esperando] ➡️ [2. Presentando al Concursante] ➡️ [3. Abrir Votación (Aplausómetro)] ➡️ [4. Cerrar Votación] ➡️ (Siguiente Concursante)
```

1. **Llamar al Concursante:**
   - En la lista de participantes de la consola, haga clic en **"Llamar al Escenario"** sobre el participante que va a desfilar.
   - El estado cambiará a **"PRESENTANDO"**. En el proyector y en los celulares de los alumnos aparecerá la foto en grande, el nombre del disfraz y la descripción.
2. **Abrir Votación (Aplausómetro de Votos):**
   - Cuando el participante termine su pasarela, seleccione la duración deseada (ej. **30 segundos**, **45 segundos** o **60 segundos**) y presione **"Abrir Votación"**.
   - En la pantalla gigante y en los teléfonos comenzará la cuenta regresiva con animación sonora.
   - En los celulares del público se habilitará el botón gigante **`¡VOTAR! 💥 (+1 VOTO)`**.
   - **Regla del Aplausómetro:** Cada toque del público suma un voto en tiempo real. Los asistentes pueden tocar repetidamente tantas veces como quieran para apoyar a su favorito.
   - El público también puede tocar los 7 emojis de reacción (**🎃 👻 💀 🔥 👏 😻 ⭐**) que subirán flotando en la pantalla gigante.
3. **Cierre de Votación:**
   - La votación se cierra automáticamente al agotarse los segundos, o puede cerrarla anticipadamente con el botón **"Cerrar Votación Ahora"**.
   - Se congelará el conteo de aplausos/votos y se guardarán en la base de datos de auditoría.
4. **Pasar al Siguiente Concursante:**
   - Presione el botón **"Siguiente Participante ⏭"** para continuar con el siguiente desfile.

---

## 6. Auditoría de Votos y Exportación a Excel / CSV

**Ruta:** `/admin/votos`

Esta sección garantiza la total transparencia y legitimidad del certamen frente a las autoridades de la FMVZ y el Consejo Técnico.

### 6.1 Información Registrada por Cada Voto
Cada voto individual registrado en el sistema contiene:
- **Folio Único de Confirmación:** Código criptográfico o identificador del voto.
- **Fuente del Voto:** `EN VIVO` (Aplausómetro en el escenario) o `WEB` (Votación general en el portal).
- **Sentido:** Voto positivo (`Sí`) o Pase (`No`).
- **Participante Beneficiado:** Número y nombre del disfraz.
- **Tipo de Elector:** `Alumno` o `Profesor / Trabajador`.
- **Identificador Institucional Normalizado:** Número de cuenta de alumno (9 dígitos) o RFC / Número de trabajador verificado.
- **Nombre del Elector:** Nombre capturado al emitir el voto.
- **Estampa de Tiempo:** Fecha, hora, minuto y segundo exacto de la emisión.

### 6.2 Exportación de la Auditoría
1. En la esquina superior derecha, haga clic en el botón verde **`Exportar Auditoría a CSV (Excel)`**.
2. El sistema descargará un archivo nombrado:
   `auditoria_votos_fmvz_halloween_YYYY-MM-DD.csv`.
3. Este archivo puede abrirse en **Microsoft Excel**, **Google Sheets** o cualquier software estadístico para:
   - Validar que no existan votos de números de cuenta inválidos.
   - Generar gráficas y reportes oficiales para la dirección de la facultad.

---

## 7. Cómputo y Publicación de Ganadores

**Ruta:** `/admin/resultados`

Esta sección calcula en tiempo real el podio oficial:
- **Tabla General de Posiciones:** Ordena a todos los participantes de mayor a menor número de votos totales válidos, detallando cuántos provienen de la web y cuántos del aplausómetro en vivo.
- **Publicación Pública:**
  - Por defecto, los resultados están **OCULTOS** para mantener el suspenso y la emoción del certamen.
  - Una vez concluido el evento y revisada la auditoría con el jurado calificador, el administrador debe presionar el botón verde:
    **`Publicar Resultados en el Portal`**.
  - Al confirmarse, la página pública `/resultados` mostrará el podio con los tres primeros lugares, las menciones honoríficas y la tabla completa con fuegos artificiales digitales y animaciones.

---

## 8. Configuración Global y Generador de Carteles QR

**Ruta:** `/admin/configuracion`

### 8.1 Ajustes del Certamen
- **Estado de la Votación:** Abrir, cerrar o pausar el sistema de votación global.
- **Cupo Máximo de Inscripciones:** Permite limitar el número de registros disponibles (por ejemplo, máximo 100 participantes).
- Presione **"Guardar Configuración"** para que los cambios surtan efecto en los servidores.

### 8.2 Generador de Carteles y Códigos QR Oficiales
Para promover la votación en la explanada de la FMVZ:
1. En el panel lateral derecho de esta página se genera el **Código QR oficial** con el imagotipo de la FMVZ incrustado al centro.
2. Haga clic en **"Descargar QR en Alta Resolución"** (PNG).
3. Puede imprimir este código en lonas, carteles y volantes para colocarlos en los pasillos de la facultad. Al escanearlo con la cámara del celular, los alumnos entrarán directamente a la plataforma.

---

## 9. Bitácora Inmutable de Auditoría

**Ruta:** `/admin/auditoria`

Toda acción realizada por cualquier administrador queda registrada permanentemente para evitar malos entendidos o controversias:
- Cambios de estado en participantes (quién aprobó, a qué hora y con qué motivo).
- Apertura o cierre de votaciones.
- Publicación de resultados finales.
- Consultas y exportaciones de datos.
- Cuenta con barra de búsqueda para filtrar rápidamente por nombre de operador o tipo de acción.

---

## 10. Protocolo de Contingencia para el Día del Evento

Para asegurar un concurso sin contratiempos el **3 de noviembre de 2026**, siga esta lista de verificación:

| Momento | Acción Recomendada | Responsable |
| :--- | :--- | :--- |
| **08:30 hrs** | Ingresar al admin, verificar que los participantes inscritos tengan foto aprobada. | Moderador de Fichas |
| **10:00 hrs** | Conectar la laptop de cabina al proyector y abrir `/en-vivo` en pantalla completa. | Operador Audiovisual |
| **10:30 hrs** | En la consola `/admin/en-vivo`, presionar **"Activar Escenario en Vivo"**. | Administrador General |
| **Durante el desfile** | Seleccionar al concursante ➡️ Abrir votación de 30-45 seg ➡️ Animar al público a usar el botón de Aplausómetro y emojis. | Presentador / Admin |
| **Al concluir** | Cerrar votación general, descargar el reporte CSV de auditoría en `/admin/votos` y validar los 3 primeros lugares con el jurado. | Comité Organizador |
| **Premiación** | En `/admin/resultados`, presionar **"Publicar Resultados en el Portal"** para proyectar el podio y compartirlo a la comunidad. | Administrador General |

---
*Facultad de Medicina Veterinaria y Zootecnia — Universidad Nacional Autónoma de México*  
*Segundo Concurso de Disfraces de Halloween 2026*
