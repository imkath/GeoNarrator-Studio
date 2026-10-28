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
- **Capas**: un GeoJSON propio (puntos, líneas o polígonos, también Multi*),
  coloreado según una propiedad numérica, visible u oculto por escena y con
  leyenda automática.
- **Export / import**: el proyecto entero es un JSON, validado al cargarlo.
- **Embed**: `/embed?data=...` lleva la historia codificada en la propia URL,
  para pegar en un iframe sin necesidad de backend.

## Stack

Next.js 14 (App Router, export estático), TypeScript, Mapbox GL JS vía
`react-map-gl`, Zustand con `persist`, dnd-kit, Tailwind CSS 4 y Vitest.

La dirección visual (una hoja de carta topográfica: papel blanco, tinta, azul
de hidrografía, siena de curvas de nivel y Overpass, la letra de la
señalética vial) está explicada en [`DESIGN.md`](DESIGN.md).

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

## Despliegue

El sitio es estático: `npm run build` deja todo en `out/`, sin servidor que
mantener. Está en Cloudflare Pages, proyecto `geonarrator`, y se sube a mano
(el proyecto no está conectado al repo). Hace falta Node 20.19 o superior.

```bash
NEXT_PUBLIC_SITE_URL=https://geonarrator.nvrkth.com npm run build
npx wrangler pages deploy out --project-name geonarrator --branch main
```

El token de Mapbox se hornea en el bundle durante el build, así que el de
producción tiene que tener restricción de URL al dominio. Verificado: con un
token restringido, tanto los tiles como la búsqueda responden 403 desde
cualquier otro origen.

## Datos para probar

Cualquier GeoJSON sirve. Para probar con datos reales de Chile, la
Infraestructura de Datos Geoespaciales publica capas vía WFS y GeoServer las
entrega en GeoJSON directamente:

```bash
curl "https://geoportal.cl/geoserver/Ferias_Libres/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Ferias_Libres:ferias_libres&outputFormat=application/json" \
  -o ferias-libres.geojson
```

Son las 370 ferias libres de la Región Metropolitana, como tramos de calle,
con el número de puestos de cada una. Sirve para ver el coloreado por
propiedad: `puestos` va de 0 a 911.

Fuente: [Geoportal de Chile](https://geoportal.cl/geoportal/catalog/35097/Ferias%20Libres),
Secretaría Ejecutiva SNIT.

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

**Cada `<Layer>` recibe su `source` de forma explícita.** `<Source>` de
react-map-gl solo le pasa su id a los hijos directos; el par relleno y borde
de los polígonos iba dentro de un fragmento, Mapbox los rechazaba por no tener
fuente y ninguna capa de polígonos se dibujaba, aunque aparecía en la leyenda.

**El filtro de geometría incluye las variantes Multi\*.** En una fuente
GeoJSON, `geometry-type` devuelve `MultiPolygon` tal cual, así que filtrar
por `Polygon` dejaba fuera la mitad de los archivos reales.

**El terreno se registra en cada `style.load`.** `setStyle` borra las fuentes
que el estilo nuevo no declara y `load` dispara una sola vez: cambiar el
estilo del mapa aplanaba todas las escenas inclinadas.

**El vuelo depende de los números de la cámara, no del objeto escena.**
Escribir el título creaba un objeto nuevo por tecla y reiniciaba un vuelo de
tres segundos con cada letra.

**Lo que entra desde afuera pasa por un solo validador** (`src/lib/validate.ts`):
el import de JSON y el embed por URL. Una escena sin `zoom` tumbaba el editor
entero, y una capa sin estilo tumbaba el iframe en la página de otra persona.

## Estructura

```
src/
  app/            rutas (landing, editor, embed) y metadata
  components/
    landing/      portada: la historia de demostración y su mapa enmarcado
    map/          canvas de Mapbox, marcadores numerados, capas, leyenda
    editor/       panel, lista de escenas, cámara, búsqueda, capas
    preview/      vista previa y la tarjeta de escena que comparte con el embed
    embed/        la historia incrustable
    ui/           header, modales, logo
  store/          estado del proyecto (Zustand + persist)
  lib/            lógica pura: codec del embed, validación, GeoJSON, geocoding
```

Los tests viven junto al código que prueban (`*.test.ts`) y cubren la lógica
pura: el codec, la validación, el GeoJSON, el parser de coordenadas, las
operaciones del store y sus migraciones.

Los datos de la portada (`public/data/ferias-libres-rm.geojson`) son las 370
ferias libres del Geoportal de Chile reducidas a un punto por feria, con su
nombre, comuna y número de puestos.
