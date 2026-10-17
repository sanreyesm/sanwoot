# San entrena

## Documento de continuidad para construir un prototipo funcional

Fecha de corte, 16 de octubre de 2026. Usuaria, San. Idioma de interfaz, español de Chile. Zona horaria, America/Santiago. Unidades, kilogramos.

Este documento reúne decisiones de la conversación, requisitos, datos iniciales, implementación existente y trabajo pendiente. No es una auditoría en vivo del Google Sheet ni una certificación de compatibilidad con COROS. La rutina que figura aquí corresponde a la importación previa del 15 de octubre y al código revisado al preparar este documento. Volver a leer la fuente antes de sincronizar cambios.

## 1. Encargo para la IA que recibe este documento

Construye un prototipo funcional, móvil primero, de una app que acompañe a San durante sus entrenamientos de fuerza. Debe funcionar sin internet en el gimnasio, mostrar demostraciones reales de los ejercicios, conservar registros y permitir grabar videos para revisión de su coach. Entrega código ejecutable, instrucciones de puesta en marcha y evidencia de las pruebas realizadas.

Prioriza completar los flujos reales sobre producir una maqueta visual. Si tienes acceso al proyecto existente, continúa desde ese código y conserva los registros. Si no tienes acceso, reconstruye los flujos a partir de esta especificación. No simules integraciones ni muestres estados de sincronización exitosa si no existe una conexión real.

Las propuestas técnicas en este documento son orientaciones de implementación, no decisiones de producto adicionales ya aprobadas por San. Puedes resolver detalles rutinarios sin pedir confirmación, pero no inventar ejercicios, prescripciones, permisos de terceros ni accesos a cuentas.

## 2. Problema y contexto de uso

San tiene una rutina de dos días de fuerza entregada por su coach en Google Sheets. Va anotando lo que hizo, pesos, repeticiones, sensaciones y comentarios. Quiere que una app la acompañe y, a futuro, intercambie información con esa planilla en ambos sentidos.

En su gimnasio no tiene internet. Consultar videos externos durante la sesión fue un problema real. Además, la distribución dificulta seguir ciertos órdenes o alternancias.

| Área | Ubicación confirmada |
| --- | --- |
| Tren inferior | Piso -1 |
| Tren superior | Piso 3 |

No asignar automáticamente todos los ejercicios de movilidad o core a un piso. Su ubicación debe ser editable. El piso 3 es la corrección final de San, no el piso 2 mencionado inicialmente.

El coach pide un video por ejercicio de la última repetición para revisar postura y ejecución. Los clips que San envió el día anterior duraban aproximadamente 1 minuto 20 segundos. No interpretar esto como una exigencia de recortar cada video a una sola repetición ni imponer un límite de 30 segundos.

## 3. Relación entre app, COROS y planilla

San usa un COROS PACE 3 y registra en él grupo muscular, peso y repeticiones. Descubrió y probó las rutinas estructuradas de COROS.

Resultados reportados por San

- Puede elegir el siguiente ejercicio.
- Para intercalar dos ejercicios debe agruparlos en un set. Si quedan individuales, debe completar las series asignadas para pasar al otro según su experiencia con la rutina.
- Al iniciar un ejercicio después del descanso, el reloj muestra una demostración si está disponible en su catálogo.
- Si no hay demostración, muestra solo el nombre.
- Para ejercicios nuevos o personalizados, una descripción escrita no le basta. Necesita una referencia visual en el celular.

Dirección de producto conversada

- COROS puede continuar siendo el registro principal de series, repeticiones, carga y descansos cuando San lo use.
- La app complementa con referencias visuales offline, notas, consulta de la rutina y videos para el coach.
- La app debe permitir registro manual como alternativa, sin obligar a duplicar cada dato ingresado al reloj.
- Sheets sigue siendo la fuente de la prescripción del coach y destino futuro de los resultados acordados.
- Esta convivencia es una orientación. La integración técnica no está resuelta ni autorizada mediante una conexión activa.

No prometer conexión directa en tiempo real al reloj, escritura de rutinas de fuerza a COROS ni recuperación de todos los campos por serie sin comprobarlo con datos reales.

## 4. Estado real al entregar este documento

Sitio privado existente, https://san-entrena.surefly2.chatgpt.site

| Función | Estado |
| --- | --- |
| Dos días de rutina importados | Implementados como copia estática |
| Registro manual por serie | Implementado |
| Notas, RIR y RPE final | Implementados |
| Historial, respaldo JSON y exportación CSV | Implementados |
| Base PWA con manifest y service worker | Implementada; falta validación completa en iPhone |
| Ilustraciones animadas propias | Implementadas, rechazadas por San por mala calidad explicativa |
| Cinco videos de COROS | Recibidos como archivos, todavía no incorporados a las demostraciones de la app |
| Grabación o adjunto de videos personales | Implementado; falta prueba completa en dispositivo |
| Límite de grabación | Actualizado y publicado a 3 minutos |
| Subida privada de videos a la nube | Backend y flujo implementados; falta validación real de punta a punta en iPhone |
| Liberar copia local tras verificar subida | Implementado y probado con pruebas automatizadas |
| Envío automático al coach | No implementado |
| Acceso del coach a la app | No habilitado |
| Sincronización de entrenamientos entre dispositivos | No implementada |
| Conexión con Google Sheets | No activa |
| Conexión con COROS | No activa |

La última respuesta sobre reemplazar dibujos por videos fue una propuesta aceptada en conversación, no evidencia de que el reemplazo ya se ejecutó. Esa es una de las primeras tareas pendientes.

## 5. Principios de experiencia

1. Abrir y usar la rutina sin señal, después de prepararla con conexión.
2. Mostrar el movimiento real y la variante correcta. Eliminar las animaciones esquemáticas rechazadas.
3. Distinguir lo planificado de lo efectivamente realizado.
4. Mostrar siempre si algo está guardado en el teléfono, pendiente de subir o confirmado en la nube.
5. Conservar el trabajo ante cierres, recargas, cortes de conexión y errores de carga.
6. Evitar doble registro si San ya usó COROS.
7. Facilitar cambios de orden por máquinas ocupadas y pisos, sin alterar silenciosamente la prescripción.
8. No hacer recomendaciones de carga ni correcciones médicas automáticas. El coach interpreta los registros y videos.
9. Mantener lenguaje claro, controles grandes y pocas acciones durante el entrenamiento.
10. Diferenciar videos de demostración de grabaciones personales para revisión técnica.

## 6. Flujos que debe resolver el prototipo

### Antes de ir al gimnasio

- Elegir Día 1 o Día 2.
- Ver ejercicios, orden, series, rangos de repeticiones, cargas orientativas, notas y antecedentes.
- Preparar el día para uso sin conexión.
- Mostrar progreso de descarga de las demostraciones y un estado comprobable de disponibilidad offline.
- Informar cuáles demostraciones faltan, sin hacer pasar un enlace externo por un video disponible offline.
- Permitir identificar piso y equipo necesario. Cualquier alternativa de ejercicio debe venir del coach o estar marcada como pendiente de su validación.

### Durante la sesión

- Consultar una tarjeta de ejercicio con demostración reproducible sin internet.
- Ver valores planificados y últimos valores realizados, claramente separados.
- Registrar series manualmente cuando corresponda, incluyendo peso y repeticiones por serie.
- Añadir comentario y RIR del ejercicio o última serie; no confundirlo con RPE global.
- Pausar, continuar, omitir o cambiar el orden sin perder series completadas.
- Permitir alternar ejercicios en la app sin exigir completar uno entero primero. Esto no implica modificar el comportamiento del reloj.
- Grabar la ejecución para el coach o adjuntar un video existente.
- Mantener la sesión recuperable si se cierra la app.

### Al terminar

- Revisar ejercicios completos, parciales y omitidos.
- Ingresar RPE de la sesión.
- Guardar una sesión parcial si no se completó toda la rutina.
- Revisar videos pendientes y comentarios antes de compartir.

### Al volver a tener conexión

- Mostrar los pendientes de subida.
- Subirlos mediante una acción explícita y permitir reintentos sin duplicación.
- Verificar persistencia en la nube antes de liberar los archivos locales.
- Preparar un video para compartir mediante el selector nativo del teléfono.
- En una futura sincronización con Sheets o COROS, mostrar una conciliación antes de sobrescribir o duplicar datos.

## 7. Demostraciones de ejercicios

San rechazó expresamente los dibujos y animaciones creados para la primera versión. No mejorarlos marginalmente ni usarlos como solución final. Sustituirlos por los videos reales que está descargando de COROS.

Archivos recibidos

| Archivo original | Asociación propuesta por nombre | Observación |
| --- | --- | --- |
| bearplank to shoulder taps.mp4 | Bear Plank to Shoulder taps, Día 1 | Verificar el contenido antes de asociar |
| horizontal press machine.mp4 | Horizontal Press Machine, Día 1 | Verificar variante de máquina |
| leg curl extention.mp4 | Posible Leg Curl o Leg Extension | Nombre ambiguo; inspección visual obligatoria antes de asociar a uno o ambos |
| 3 point row.mp4 | 3 point row, Día 1 | Verificar el contenido |
| leg press.mp4 | Leg Press, Día 1 | Verificar variante |

Los cinco archivos pesan en conjunto aproximadamente 14,1 MB decimales según los archivos recibidos. No confundirlos con las grabaciones personales de 1:20. Sus duraciones y movimientos no se analizaron para preparar este documento.

Requisitos de reproducción

- Reproductor embebido con controles, pausa, repetición y pantalla completa si el dispositivo lo permite.
- Reproducción inline en móvil y posibilidad de volver a consultar rápidamente.
- Descargar una vez con conexión y reutilizar sin señal.
- No depender de iframes de YouTube para cumplir el modo offline.
- Conservar una referencia al origen y no publicar estos archivos en un catálogo público. El uso previsto es privado; no se verificó una licencia de redistribución.
- Donde falte video, mostrar “Demostración pendiente” y el enlace de referencia disponible. No generar un movimiento inventado.
- Probar búsqueda dentro del video y respuestas HTTP Range con el mecanismo offline elegido.

Aclaración de producto sobre almacenamiento

Ver un video offline exige que sus bytes estén guardados en el dispositivo. Se puede evitar que San tenga que descargarlos manualmente a Fotos y gestionar esos archivos desde la app, pero no prometer cero espacio local. Ofrecer preparación por día y eliminación de las copias offline de demostraciones cuando ella lo decida.

## 8. Videos personales para el coach

Objetivo, registrar un video por ejercicio que permita revisar la última repetición y el movimiento completo. Conservarlo asociado al ejercicio y a la sesión.

Comportamiento implementado

- Grabación mediante cámara con límite de 3 minutos, contador minutos/segundos y botón para terminar antes.
- Grabación sin audio en la versión actual. Es una decisión de implementación, no un requisito explícito de San.
- Cámara trasera preferida y resolución objetivo de 1280 × 720.
- Adjuntos MP4, MOV o WebM de hasta 80 MB. El límite por tamaño también afecta a videos largos grabados externamente.
- Persistencia temporal en IndexedDB.
- Subida manual con la app abierta. No hay garantía de subida en segundo plano con el teléfono bloqueado.
- Verificación de identificador, tamaño y SHA-256 después de subir.
- Eliminación del blob local solamente después de esa verificación.
- En caso de error, el archivo local se conserva.
- Los originales seleccionados desde Fotos siguen en Fotos. La app no los elimina.
- El respaldo JSON de entrenamientos no contiene los blobs de videos pendientes.
- Compartir requiere una acción de San; no hay envío automático al coach.

Estados mínimos de interfaz

| Estado | Significado y acción |
| --- | --- |
| Guardado en este dispositivo | Archivo local disponible; todavía ocupa espacio |
| Pendiente de subir | Espera conexión o acción de San |
| Subiendo | Mostrar progreso cuando sea posible |
| Error de subida | Conservar archivo y ofrecer reintento |
| Verificando | Comprobar integridad y persistencia |
| Guardado en la nube | Ya puede liberarse la copia local de la app |
| Preparado para compartir | Archivo temporal listo para selector nativo |

No abrir acceso público a los videos para facilitar el envío. Si se desarrolla acceso del coach, definir autenticación, permisos y revocación. Una reproducción desde la nube o un archivo preparado para compartir puede ocupar caché temporal, por lo que “liberar la copia local” no significa consumo de almacenamiento permanentemente nulo.

## 9. Rutina inicial

Fuente de la prescripción, [Planificación Sandri Reyes](https://docs.google.com/spreadsheets/d/1dQEKW_wLIoX_tAPcg--lGaRNAypKaz5HYwaeYkwVqbM/edit).

Pestañas conocidas, `LEER ANTES` y `M1`. Los comentarios de San revisados estaban en celdas de la planilla, no en hilos de comentarios de Drive.

En M1, la primera semana usa columnas A a G, ejercicio, series, repeticiones prescritas, repeticiones realizadas, carga, comentarios y RIR. La semana siguiente empieza en H a N. Confirmar estructura y rangos actuales antes de escribir.

### Día 1

| ID existente | Ejercicio de la pauta | Series | Repeticiones prescritas | Carga de referencia |
| --- | --- | --- | --- | --- |
| rotation | Quadruped trunk rotation | 2 | 6 por lado | Sin carga |
| er | ER Knee supported | 2 | No indicada | 2 kg |
| hips | 90/90 Hip Mobility | 2 | 6 por lado | Sin carga |
| legpress | Leg Press | 4 | 10 a 12 | 20 / 30 / = / = |
| row | 3 point row | 3 | 8 a 12 por lado | 7 kg con interrogante |
| curl | Leg Curl | 3 | 10 a 12 | Probar 25 a 30 kg |
| press | Horizontal Press Machine | 3 | 10 a 12 | Probar 2 placas |
| unknown | Hacer primer ejercicio | 3 | 10 a 12 | 2 a 2,5 kg por lado, banco a 60° |
| bear | Bear Plank to Shoulder taps | 3 | 8 a 10 por lado | No indicada |

### Día 2

| ID existente | Ejercicio de la pauta | Series | Repeticiones prescritas | Carga de referencia |
| --- | --- | --- | --- | --- |
| rotation | Quadruped trunk rotation | 2 | 6 por lado | Sin carga |
| er | ER Knee supported | 2 | No indicada | 2 kg |
| hams | 90/90 Hams Stretch | 2 | 6 por lado | Sin carga |
| rdl | BB RDL | 4 | 8 a 10 por lado, tal como aparece en la pauta | 20 / 30 kg / = / = |
| incline | Inclined Bench Press | 3 | 10 a 12 | 5 a 6 kg por lado, con interrogante |
| extension | Leg Extension | 3 | 10 a 12 | Probar 15 a 20 kg |
| pulldown | Pulldown machine | 3 | 10 a 12 | Probar 15 a 20 kg |
| clamshell | Clamshell | 3 | 8 a 10 por lado | Sin banda; consultar disponibilidad |
| crunch | Vertical crunch | 3 | 10 a 15 | 5 kg |

Los tres primeros ejercicios de cada día se presentan como calentamiento. Los siguientes se organizaron en bloques A, B, C, D y los dos últimos como E en el prototipo. No convertir automáticamente ese bloque E en una obligación de biserie sin revisar la pauta y las condiciones del gimnasio.

### Resultados y comentarios previos del Día 1

Son antecedentes reales anotados, no valores objetivos para próximas sesiones ni registros completos por serie salvo donde se indica.

| Ejercicio | Realizado | RIR | Comentario resumido |
| --- | --- | --- | --- |
| Rotación de tronco | 6, sin carga | 4 | Se sintió rígida; le gustó para mejorar flexibilidad |
| ER Knee supported | 6 por lado, 2,5 kg | 0 | Era la mancuerna disponible |
| Movilidad 90/90 | 6, sin carga | 5 | Sin comentario adicional |
| Leg Press | 10 reps; 20 / 30 / 30 / 30 kg | 0 | Algo de dolor de rodilla; pesado al retomar |
| 3 point row | 12 reps, 6 kg; hizo 4 series en vez de 3 | 2 | No había mancuernas de 7, 8, 9 o 10 kg |
| Leg Curl | 12 reps; 20 / 25 / 25 kg | 4 | Primera serie con 20 por equivocación |
| Horizontal Press Machine | 10 reps, 14 kg | 0 | Intenso; molestó algo el hombro |
| Ejercicio sin nombre | 10 reps, 2,5 kg | 0 | Hombro bien |
| Bear Plank | 8 reps; carga no registrada | 0 | Hombro bien |

RPE final anotado, 6. No transformar las molestias reportadas en diagnósticos ni recomendaciones automáticas.

Indicaciones previas del coach registradas en la conversación

- Anotar RIR de la última serie y RPE al final de la sesión.
- Puede cambiar el orden, preferentemente comenzar por A/B.
- Evitar biseries de máquinas en pisos distintos.
- Mantener la planificación durante cinco semanas y revisar en la sexta, según la pauta previa. Confirmar vigencia antes de automatizarlo.

## 10. Ambigüedades que no se deben completar por intuición

- ER Knee supported no tiene repeticiones prescritas. Haber hecho seis por lado no convierte seis en la pauta.
- El ejercicio “Hacer primer ejercicio” no tiene nombre identificado. Mantenerlo pendiente.
- Confirmar la variante de Leg Curl, sentada o acostada, usando la referencia correcta.
- El archivo “leg curl extention.mp4” puede tener una denominación ambigua. Inspeccionarlo antes de asignarlo.
- BB RDL figura con “por lado”, aunque la anotación requiere aclaración. No corregir la fuente silenciosamente.
- Horizontal Press y Bear Plank comparten el mismo enlace de YouTube en la copia de la pauta. No tratarlo como una referencia válida para ambos.
- Confirmar variantes de Hams Stretch y Vertical crunch antes de crear o asignar demostraciones.
- Los valores con “?” son orientativos o dudosos en la fuente, no pesos confirmados.

## 11. Integración futura con Sheets

Objetivo pedido por San, leer la rutina y comentarios desde Sheets y devolver resultados desde la app.

Requisitos de diseño técnico

- Autenticación y permisos mínimos necesarios.
- Importar prescripción por semana y día con una versión identificable.
- Mantener las notas originales del coach y las de San separadas cuando sea necesario.
- Escribir únicamente resultados en los rangos acordados, sin sobreescribir fórmulas, pauta ni otras semanas.
- Conservar valores anteriores y detectar cambios concurrentes.
- Identificador estable por sesión, ejercicio y serie; no usar solo el nombre visible como clave.
- Cola local de operaciones cuando no hay señal.
- Reintentos idempotentes y estado visible de última sincronización real.
- Presentar conflictos para revisión si la misma celda cambió en ambos lados.
- No llamar “sincronizado” a un JSON exportado, una copia estática o una acción pendiente.

La interfaz exacta de escritura por serie debe acordarse con la estructura de la planilla. Si una celda solo permite resumen, conservar detalle por serie en la app y exportar un resumen explícito.

## 12. Integración futura con COROS

Rutina compartida por San, [Training · Día 1](https://globalsharepage.coros.com/share/training/program/481081734486736996/region-1-time-1792170243).

El contenido de ese enlace no pudo inspeccionarse en la conversación previa. No usarlo como prueba del listado exacto de ejercicios.

Las capturas de actividad mostraban grupos musculares, tiempo, repeticiones y peso. Por ejemplo, una actividad del 15 de octubre de 2026 a las 19:48 mostraba cuatro series de piernas con 10 repeticiones y 20/30/30/30 kg; cuatro de espalda con 12 repeticiones y 6 kg; tres de pecho con 10 repeticiones y 14 kg; y otro bloque de piernas con 12 repeticiones y 20/25/25 kg. Duración total mostrada, 1:20:14. Esto ayuda a contrastar resultados, pero los grupos musculares no identifican por sí solos un ejercicio.

En investigación previa se identificó documentación oficial sobre COROS MCP, OAuth y consulta de actividades/FIT. No se activó una conexión ni se verificó la disponibilidad exacta de los datos de fuerza por serie. La escritura de entrenamientos de fuerza tampoco quedó comprobada. Revalidar las capacidades vigentes antes de implementar.

Referencias para investigar, no contratos de integración ya probados

- https://www.coros.com/stories/coros-metrics/c/mcp-testing
- https://support.coros.com/hc/en-us/articles/53181619102996-Build-on-COROS-MCP
- https://support.coros.com/hc/en-us/articles/360043959812-Strength-Mode

Primer experimento recomendado

1. Obtener una exportación real o una actividad autenticada de San.
2. Comprobar si contiene series, pesos, repeticiones, tiempos y grupos musculares.
3. Comparar con una sesión conocida.
4. Proponer correspondencias por rutina, orden y tiempo, pero pedir revisión cuando sean ambiguas.
5. Importar sin duplicar sesiones ni series.

No asociar automáticamente “Legs/Hips” a Leg Curl, ya que también puede ser Leg Press u otro ejercicio. No enviar mensajes ni datos al coach por inferencia.

## 13. Pantallas del prototipo

| Pantalla | Contenido y acciones |
| --- | --- |
| Hoy | Día seleccionado, resumen, preparación offline, empezar o continuar |
| Rutina | Lista de ejercicios, piso, equipo, estado, cambiar orden |
| Ejercicio | Demostración real, pauta, últimos valores, registro, RIR, notas, cámara |
| Cierre | Resumen completo/parcial, RPE, guardar |
| Historial | Sesiones por fecha, detalle y exportación |
| Mis videos | Filtro por sesión/ejercicio, local o nube, reproducir, subir, compartir |
| Ajustes | Disponibilidad offline, espacio, respaldos, estado real de conexiones |

Diseño actual de referencia, fondos claros crema, acentos morados, tarjetas, navegación inferior móvil y barra lateral en escritorio. No es una restricción para reproducir la mala visualización anterior. Priorizar legibilidad, contraste, botones fáciles de tocar, estados claros y acceso rápido al video.

## 14. Arquitectura recomendada y modelo de datos

PWA significa Progressive Web App, una aplicación web que puede instalarse en la pantalla de inicio y ofrecer funciones offline si se implementan explícitamente. Tener un manifest no garantiza que todo funcione sin conexión.

Separar cuatro clases de datos

1. Prescripción versionada del coach.
2. Sesiones y resultados de San.
3. Demostraciones y su disponibilidad offline.
4. Grabaciones personales y su estado de subida privada.

Modelo orientativo

```ts
type Exercise = {
  id: string;
  name: string;
  originalName: string;
  muscleGroup?: string;
  floor?: '-1' | '3' | 'unknown';
  equipment?: string;
  demoId?: string;
  needsConfirmation: boolean;
};
type Prescription = {
  id: string;
  version: string;
  day: 1 | 2;
  exerciseId: string;
  order: number;
  sets: number;
  repsText: string | null;
  loadText: string | null;
  coachNote?: string;
  sourceRange?: string;
};
type WorkoutSession = {
  id: string;
  day: 1 | 2;
  prescriptionVersion: string;
  startedAt: string;
  finishedAt?: string;
  status: 'active' | 'partial' | 'complete';
  rpe?: number;
  source: 'manual' | 'coros' | 'mixed';
  externalActivityId?: string;
};
type SetResult = {
  id: string;
  sessionId: string;
  exerciseId: string;
  index: number;
  reps: number | null;
  weightKg: number | null;
  completedAt: string;
  source: 'manual' | 'coros';
  externalSetId?: string;
};
type ExerciseFeedback = {
  sessionId: string;
  exerciseId: string;
  rir: number | null;
  note: string;
  skipped: boolean;
};
type PersonalClip = {
  id: string;
  sessionId: string;
  exerciseId: string;
  createdAt: string;
  mimeType: string;
  size: number;
  durationSeconds?: number;
  sha256?: string;
  status: 'local' | 'queued' | 'uploading' | 'verifying' | 'cloud' | 'error';
  cloudKey?: string;
  localBlob?: Blob;
};
type DemoAsset = {
  id: string;
  exerciseId: string;
  source: string;
  version: string;
  offlineStatus: 'missing' | 'downloading' | 'ready' | 'error';
  size?: number;
};
```

Este esquema es una propuesta. Si se continúa el código actual, migrar sus datos en vez de asumir que ya utiliza estas entidades.

## 15. Implementación existente para continuidad técnica

Proyecto local del entorno original, `/workspace/sites/san-entrena`. Esa ruta no estará disponible automáticamente para otra IA. El Markdown tampoco incluye un repositorio ni los videos binarios.

ID de Sites, `appgprj_6ad18e13f88c8191bd01fb3bff9a71d1`.

Último commit publicado conocido, `a8f67ede7d91892883196ddfc0bc891e325fc96e`. Último despliegue conocido exitoso, actualización de clips a tres minutos. Conservar el sitio y su audiencia privada si se sigue trabajando en él.

Estructura relevante

- `public/index.html`, interfaz principal.
- `public/data.js`, copia estática de la rutina y notas.
- `public/app.js`, sesión, registro, historial, exportaciones.
- `public/visuals.js`, dibujos actuales a reemplazar.
- `public/videos.js` y `public/videos.css`, grabación y gestión de videos personales.
- `public/sw.js`, caché offline versión `san-entrena-v3`.
- Manifest e iconos de PWA.
- `app/page.tsx`, redirección a la interfaz.
- `app/api/videos/[[...path]]/route.ts`, adaptador del servicio de videos.
- `lib/video-service.mjs`, lógica de almacenamiento privado.
- `tests/video-service.test.mjs` y `tests/video-upload.test.mjs`, pruebas del flujo de videos.

Persistencia actual

- Entrenamientos y sesión activa en localStorage con clave `san-entrena-v1`.
- Clips en IndexedDB `san-entrena-videos`, almacén `clips`.
- Nube de videos en R2, binding `BUCKET`.
- No hay respaldo servidor de los entrenamientos manuales ni sincronización entre dispositivos.

API existente de videos

- Listado autenticado con paginación.
- `PUT /api/videos/{id}` para subir cuerpo binario con metadatos, tamaño y hash.
- `GET /api/videos/{id}?info=1` para verificar persistencia e integridad.
- `GET /api/videos/{id}` para reproducción privada con soporte de rangos.
- Claves separadas por usuario autenticado; validación de origen, tipo y tamaño.
- Respuestas privadas sin caché para grabaciones personales.
- No existe endpoint de borrado en nube ni enlace público para el coach.

Al portar fuera de Sites, reemplazar su mecanismo de identidad por autenticación real del backend. No confiar en un encabezado de identidad enviado arbitrariamente por el navegador. Preservar controles por propietario y nunca guardar credenciales en el frontend o el Markdown.

El README conserva algunas descripciones históricas de la etapa estática, como referencias a `dist/` y buildless. La implementación actual usa `public/` y backend Vinext/Worker. Tomar el código y esta aclaración como referencia para la migración.

## 16. Validación realizada y límites

Se verificaron sintaxis, construcción de producción y publicación. Las pruebas automatizadas cubrieron registro por serie, edición, persistencia, cierre parcial, exportación, integridad de subida, reintentos idempotentes, aislamiento por usuario, rangos de reproducción y conservación del archivo local ante fallas.

No se ha demostrado todavía en un iPhone real

- Permiso de cámara, grabación completa de más de 1:20 y conservación del clip.
- Subida autenticada completa y reproducción posterior desde nube.
- Apertura de la PWA en modo avión después de cerrar completamente.
- Persistencia de videos offline y reproducción con avance/retroceso.
- Comportamiento ante bloqueo del dispositivo, cuota insuficiente o eliminación de datos por el sistema.

Las pruebas unitarias y un despliegue exitoso no reemplazan estas verificaciones.

## 17. Criterios de aceptación prioritarios

- [ ] Cada uno de los cinco videos recibidos se inspecciona y se asocia a la variante correcta o queda explícitamente pendiente.
- [ ] Las animaciones rechazadas dejan de ser la referencia principal.
- [ ] Después de preparar un día con conexión, la rutina y sus videos disponibles se reproducen en modo avión.
- [ ] El estado offline no dice “listo” hasta que los archivos necesarios están disponibles.
- [ ] Los ejercicios sin demostración se identifican honestamente.
- [ ] Una sesión conserva sus series al recargar o cerrar la app.
- [ ] Se puede omitir o reordenar sin borrar resultados anteriores.
- [ ] Se distinguen prescripción, datos previos y valores actuales.
- [ ] Un clip de al menos 1:20 se graba, guarda y reproduce; el límite actual es 3:00.
- [ ] Un error de red o de verificación no borra el clip local.
- [ ] Reintentar una subida no crea duplicados.
- [ ] Tras una subida verificada, el archivo local de la app se libera y el video sigue accesible en nube.
- [ ] Un video de otro usuario no es accesible cambiando el ID.
- [ ] Compartir requiere una acción explícita y el coach no recibe acceso general a la cuenta.
- [ ] Las conexiones con Sheets/COROS figuran como pendientes hasta que funcionen con datos reales.
- [ ] Fechas locales correctas para Santiago y pesos con decimales.
- [ ] Una migración no elimina registros existentes ni videos pendientes.

## 18. Orden de implementación sugerido

### Primera entrega

Reemplazar las demostraciones por los archivos recibidos, resolver asociaciones ambiguas, implementar preparación offline por día y validar en iPhone. Mantener los flujos de registro y video personal ya implementados.

### Segunda entrega

Pulir orden flexible, agrupación por piso, recuperación de sesión, estados de subida y manejo de espacio. Validar grabación de duración real y nube con un clip de San.

### Tercera entrega

Probar lectura real de COROS con una actividad exportada o conexión autorizada. Solo después diseñar importación y conciliación. Implementar Sheets con rangos precisos, conflictos y revisión de escritura.

### Posterior

Acceso específico del coach, comentarios de revisión y evolución de ejercicios, si San lo solicita. No son condiciones para completar la primera versión funcional.

## 19. Material que debe acompañar este Markdown

Adjuntar a la otra IA los cinco MP4 originales. Este archivo describe sus nombres y finalidad, pero no contiene los videos.

Rutas en el entorno original, útiles solo si el entorno se conserva

```text
/workspace/scratch/ab1a1e69e233/upload/01-bearplank-to-shoulder-taps.mp4
/workspace/scratch/ab1a1e69e233/upload/02-horizontal-press-machine.mp4
/workspace/scratch/ab1a1e69e233/upload/03-leg-curl-extention.mp4
/workspace/scratch/ab1a1e69e233/upload/04-3-point-row.mp4
/workspace/scratch/ab1a1e69e233/upload/05-leg-press.mp4
```

Para continuar exactamente la implementación existente también hace falta acceso a su código. El sitio privado por sí solo no otorga acceso al repositorio. Para sincronizar fuentes, San debe conectar sus cuentas por un mecanismo autorizado; no pedir contraseñas en texto.

## 20. Referencias audiovisuales de la pauta importada

Son enlaces originales de referencia, no evidencia de disponibilidad offline ni de variante verificada.

| Ejercicio | URL |
| --- | --- |
| Quadruped trunk rotation | https://www.youtube.com/watch?v=QWwiOHexU8I |
| ER Knee supported | https://www.youtube.com/shorts/MFmh1mmCQC0 |
| 90/90 Hip Mobility | https://www.youtube.com/watch?v=D2ThOWxGbSI |
| Leg Press | https://www.youtube.com/shorts/EotSw18oR9w |
| 3 point row | https://www.youtube.com/watch?v=AgjwVQmycuQ |
| Leg Curl | https://www.youtube.com/watch?v=Th_m1_3upXo |
| Horizontal Press Machine | https://www.youtube.com/shorts/bdcKHTb-LGU |
| Ejercicio sin nombre | https://www.youtube.com/shorts/lRTT2YABNIM |
| Bear Plank, enlace duplicado pendiente | https://www.youtube.com/shorts/bdcKHTb-LGU |
| 90/90 Hams Stretch | https://www.youtube.com/shorts/GNEfNkFuoWU |
| BB RDL | https://www.youtube.com/watch?v=2G6m2hWvMWM |
| Inclined Bench Press | https://www.youtube.com/watch?v=Fv5EYoJfRt4 |
| Leg Extension | https://www.youtube.com/shorts/uM86QE59Tgc |
| Pulldown machine | https://www.youtube.com/shorts/3q1Zsi3vkjo |
| Clamshell | https://www.youtube.com/shorts/us39nzaFu9Q |
| Vertical crunch | https://www.youtube.com/shorts/dTJhFFyLBOU |

## 21. Instrucción final de entrega para la otra IA

Entrega un prototipo que permita completar los flujos definidos. Explica brevemente qué quedó operativo, qué probaste y qué depende de cuentas, archivos o pruebas en dispositivo. Incluye instrucciones para ejecutar, instalar y preparar el uso offline. No presentar botones decorativos como funcionalidad real ni afirmar que una integración está lista por tener su pantalla diseñada.
