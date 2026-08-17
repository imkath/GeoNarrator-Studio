# GeoNarrator Studio

Editor visual para armar historias sobre un mapa 3D. Cada escena guarda un
texto y una posición de cámara (coordenadas, zoom, inclinación, rotación); en
modo preview el mapa vuela de una a otra a medida que se hace scroll.

Nació de una pregunta concreta: cuánto del trabajo de un scrollytelling
geográfico es contar la historia, y cuánto es pelear con la API del mapa. La
respuesta fue separar las dos cosas. El editor produce un JSON de escenas, y el
reproductor solo sabe volar entre ellas.

## Qué hace

- **Editor**: buscador de lugares o pegado directo de coordenadas, marcadores
  arrastrables sobre el mapa, sliders de zoom / inclinación / rotación y un
  botón que captura la vista actual de la cámara tal como quedó.
- **Timeline**: reordenar escenas con drag and drop.
- **Preview**: scroll, teclado (flechas, `j`/`k`, `Home`/`End`, `1`-`9`) o
  botones; el mapa hace `flyTo` a la escena activa.
- **Export / import**: el proyecto entero es un JSON, validado al cargarlo.
- **Embed**: `/embed?data=...` lleva la historia codificada en la propia URL,
  para pegar en un iframe sin necesidad de backend.

## Stack

Next.js 14 (App Router), TypeScript, Mapbox GL JS vía `react-map-gl`, Zustand
con `persist`, Framer Motion, dnd-kit, Tailwind CSS y Vitest.

No hay backend. El estado vive en `localStorage` y las historias viajan en la
URL o en un archivo JSON.

## Correr en local

```bash
npm install
cp .env.example .env.local   # y agregar el token de Mapbox
npm run dev
```

Sin `NEXT_PUBLIC_MAPBOX_TOKEN` el mapa no carga y la app lo dice en pantalla.

```bash
npm test        # tests unitarios
npm run lint
npm run typecheck
npm run build
```

## Decisiones que vale la pena explicar

**La cámara se guarda en `onMoveEnd`, no en `onMove`.** `onMove` dispara en
cada frame; escribir el store ahí re-renderizaba el editor completo unas 60
veces por segundo mientras duraba cada vuelo de 3,5 segundos. El dato solo
importa cuando el movimiento termina.

**El embed usa base64url sobre UTF-8, no `btoa` directo.** `btoa` solo acepta
Latin-1: un emoji o una comilla tipográfica en el texto de una escena lanzaba
`InvalidCharacterError`. La implementación está en `src/lib/story-codec.ts`.
Como la historia viaja dentro de la URL, el modal avisa cuando pasa los ~2000
caracteres, que es donde algunos navegadores y proxies empiezan a truncar.

**Geocoding v6, no v5.** La v5 (`mapbox.places`) sigue respondiendo, pero ya no
devuelve puntos de interés, que era la mitad de lo que se buscaba desde el
editor.

**Los acentos de color de los sliders son clases completas, no interpoladas.**
Tailwind escanea el código como texto: `bg-${color}-400` nunca llega al CSS.

## Estructura

```
src/
  app/            rutas (landing, editor, embed) y metadata
  components/
    map/          canvas de Mapbox, marcadores, terreno
    editor/       sidebar, lista de escenas, controles de cámara, búsqueda
    preview/      overlay de scrollytelling
    ui/           header, modales, logo
  store/          estado del proyecto (Zustand + persist)
  lib/            lógica pura: codec del embed, parser de coordenadas, geocoding
```

Los tests viven junto al código que prueban (`*.test.ts`) y cubren la lógica
pura: el codec, el parser de coordenadas y las operaciones del store.
