# Manual de Operación del Evento (Runbook Oficial)
## Segundo Concurso de Disfraces FMVZ — 3 de noviembre de 2026

Este documento establece el protocolo operativo paso a paso que debe seguir el **Comité Técnico y Organizador** durante la jornada del evento el **3 de noviembre de 2026**.

---

## 1. Cronograma Operativo de la Jornada

| Horario | Etapa | Responsable | Acción Principal |
| :--- | :--- | :--- | :--- |
| **08:00 – 08:30** | Verificación técnica | Equipo de Software / DBA | Check de infraestructura, base de datos y respaldos. |
| **08:30 – 08:50** | Revisión de cartelería | Comité Organizador | Colocación de carteles con Código QR en mamparas. |
| **08:50 – 09:00** | Apertura de Votación | Administrador General | Cambio de estado de votación a `open` en el panel. |
| **09:00 – 18:00** | Jornada de Votación | Operadores de Mesa | Monitoreo de concurrencia y atención en mesa de ayuda. |
| **18:00** | Cierre de Votación | Administrador General | Cambio de estado a `closed` y congelamiento de votos. |
| **18:05 – 18:45** | Validación y Desempates | Jurado y Comité | Revisión del cómputo oficial y asignación de 20 premios. |
| **19:00** | Publicación de Ganadores | Administrador General | Activación de visibilidad de resultados en el portal. |
| **19:15** | Premiación Presencial | Dirección FMVZ | Entrega simbólica de cheques y reconocimientos. |
| **20:00** | Resguardo y Archivo | DBA / Seguridad | Respaldo final de base de datos y cierre de sesión. |

---

## 2. Protocolo Previo a la Apertura (08:00 – 09:00)

1. **Verificación de Salud de la API:**
   Ingresar a `https://concurso.fmvz.unam.mx/api/health` y comprobar respuesta HTTP 200 con estado `"ok"`.
2. **Inspección de Galería Inicial:**
   Verificar que los 57 participantes autorizados se muestren con fotografía, número y título en `/participantes`.
3. **Comprobación de la Mesa de Moderación:**
   Asegurarse de que no existan fotografías pendientes sin revisar en `/admin/fotografias`.
4. **Validación del Código QR Físico:**
   Escanear el código QR impreso en las mamparas con al menos dos dispositivos móviles (un iPhone y un Android) para confirmar que redirige inmediatamente a la landing page del concurso.

---

## 3. Protocolo de Apertura de Votación (09:00)

1. Iniciar sesión en `/admin/login` con la cuenta de Administrador.
2. Ir a **Configuración & QR** (`/admin/configuracion`) o al interruptor superior del Dashboard.
3. Cambiar el estado de la votación a **🟢 Abierta**.
4. Confirmar en la alerta emergente.
5. Realizar un voto de prueba desde una cuenta técnica de control para verificar que el folio de comprobación se genere correctamente.

---

## 4. Operación durante la Jornada y Mesa de Ayuda (09:00 – 18:00)

### Gestión de Alta Concurrencia (Objetivo: 500 Usuarios Simultáneos)
- El sistema cuenta con limitadores de tasa por IP (`express-rate-limit`) que previenen ataques de denegación de servicio o scripts automatizados.
- Si se detecta saturación en la red Wi-Fi universitaria de la facultad, recordar a los usuarios que la web app está optimizada para conexiones móviles 4G/5G con carga ligera de imágenes vectoriales y WebP.

### Protocolo para Incidencias en Mesa de Ayuda:
1. **El usuario indica que su identificador ya fue utilizado:**
   - Solicitar credencial UNAM vigente al estudiante o trabajador.
   - El operador busca el identificador en `/admin/participantes` o consulta la hora de emisión del voto en `/admin/votos`.
   - Si se confirma duplicidad no autorizada, registrar el caso formalmente en la hoja de incidencias y elevar al Comité Directivo.
2. **El participante desea corregir su fotografía:**
   - El operador ingresa a `/admin/participantes`, ubica el número de concurso y cambia el estado a *“Requiere corrección”*, notificando al participante para resubir la imagen.

---

## 5. Protocolo de Cierre de Votación (18:00)

1. A las **18:00:00 horas**, el Administrador General ingresa a `/admin/configuracion` y cambia el estado a **🔴 Cerrada**.
2. A partir de ese milisegundo, cualquier intento de envío de voto es rechazado con código HTTP 403 (*“La votación no se encuentra abierta en este momento”*).
3. No se admiten votos presenciales extemporáneos.

---

## 6. Validación del Cómputo y Criterios de Desempate (18:05 – 18:45)

1. Ingresar a `/admin/resultados` y hacer clic en el botón de **Recalcular**.
2. **Revisión del Podio Principal:**
   - 1er Lugar: Participante con el mayor número de votos válidos ($10,000 MXN).
   - 2do Lugar: Segundo con mayor número de votos ($7,000 MXN).
   - 3er Lugar: Tercero con mayor número de votos ($6,000 MXN).
3. **Criterio de Desempate Oficial:**
   En caso de empate en sufragios entre dos o más participantes en los primeros tres lugares:
   - *Criterio A:* Prevalecerá el participante que haya alcanzado primero en el tiempo la cifra final de votos (verificado mediante la marca de tiempo de la tabla `votes`).
   - *Criterio B (Subsidiario):* Si persiste la igualdad, el Jurado Calificador de la FMVZ deliberará con base en originalidad, apego al tema y complejidad de la caracterización.
4. **Asignación de los 20 Premios Adicionales ($5,000 MXN):**
   - El Jurado y el Comité aplican la modalidad configurada (menciones honoríficas, sorteo o categorías especiales).
   - Registrar la resolución en la bitácora administrativa.

---

## 7. Publicación Oficial de Resultados (19:00)

1. En la pantalla `/admin/resultados`, el Administrador General presiona **“Publicar resultados oficialmente”**.
2. Aceptar la confirmación del sistema.
3. Verificar en un dispositivo móvil no autenticado que la página `/premios` muestre la tabla de ganadores con sus respectivos números de votos.
4. Proceder al anuncio en el estrado del auditorio.
