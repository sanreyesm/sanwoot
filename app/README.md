# SanWoot

Prototipo funcional, móvil primero, para acompañar a San en sus entrenamientos de fuerza. PWA (React + Vite + TypeScript), sin backend: todo vive en el teléfono (IndexedDB + Cache Storage).

## Qué funciona de verdad (probado el 16 oct 2026)

- **Rutina de los dos días**, con la estructura real de bloques/bi-serie de la pauta del coach.
- **16 demostraciones en video** del catálogo de 378 clips, reencodadas (promedio 74x más livianas, ~13 MB el catálogo completo) y cacheadas offline con soporte de Range (scrubbing funciona sin conexión).
- **6 ejercicios sin match en el catálogo** muestran "Demostración pendiente" + enlace de referencia (nunca un movimiento inventado ni un falso estado offline).
- **Registro de series** (reps + peso), RIR, comentario — persistido en IndexedDB en cada cambio, verificado que sobrevive a un `F5` a mitad de sesión.
- **Reordenar / omitir** ejercicios sin perder series ya registradas.
- **Cierre de sesión** con RPE y clasificación automática completa/parcial.
- **Historial** con detalle por sesión y exportación a JSON/CSV.
- **Grabación de video** con cámara (MediaRecorder, límite 3 min, sin audio) y adjuntar desde Fotos — guardado local, compartir vía selector nativo (Web Share API). **No hay subida a la nube en esta versión**: no se simula ningún estado de "subiendo" o "en la nube" que no exista de verdad.
- **Ajustes** con estado honesto de conexiones: Sheets y COROS marcados "no conectado", no "pendiente de activar".

Probado con Chrome (desktop, emulando viewport móvil) contra un build de producción real (`vite build` + `vite preview`), incluyendo recarga de página a mitad de sesión para confirmar recuperación.

## Lo que falta probar en tu iPhone real

Esto no se puede verificar desde una terminal — son las pruebas que la especificación marca como pendientes y que siguen pendientes acá:

- Permiso de cámara y grabación completa en iOS Safari.
- Apertura de la PWA en modo avión después de cerrarla completamente (instalada desde "Compartir → Agregar a inicio").
- Reproducción y scrubbing de los demos guardados, sin conexión.
- Comportamiento ante poco espacio o bloqueo del teléfono durante una grabación.

## Cómo correrlo

```bash
cd app
npm install
npm run dev        # desarrollo, http://localhost:5173 (sin service worker, para no interferir con hot-reload)
```

Para probar el modo real (con service worker y offline):

```bash
npm run build
npm run preview    # sirve el build de producción, http://localhost:4173
```

Para instalar en el iPhone: abre la URL del build desplegado en Safari, `Compartir → Agregar a pantalla de inicio`. Desde ahí:

1. Entra a **Ajustes → Preparar catálogo completo** (o a **Hoy → Preparar para sin conexión** para solo el día) con conexión.
2. Activa modo avión.
3. Confirma que la rutina, los videos y el registro de series siguen funcionando.

## Regenerar el catálogo de videos

Si agregas o cambias archivos en `../Video ejercicios/`:

```bash
node scripts/process-videos.mjs
```

Reencoda todo a `public/demos/*.mp4` (720p, sin audio, crf 26) y regenera `src/data/video-catalog.json`.

## Lo que NO está en esta entrega (a propósito)

- Conexión real con Google Sheets o COROS: el estado en Ajustes lo dice explícitamente. Ver la especificación (`../San-entrena-especificacion-prototipo.md`) secciones 11 y 12 para el diseño de esa integración futura.
- Subida de videos personales a la nube.
- Aviso a Telegram por cambios del coach en la planilla: esto no vive en esta app — es un Google Apps Script independiente pegado a la planilla (trigger `onChange`), pendiente del token/chat del bot que San ya usa.
- Acceso del coach a la app.
