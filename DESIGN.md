# Diseño de GeoNarrator Studio

## Dirección: la hoja de una carta topográfica

Una carta impresa del Instituto Geográfico Militar tiene un mapa encerrado en
una línea de marco, coordenadas rotuladas en el borde, una cartela con el
título y una leyenda en el margen. Todo lo que no es mapa es papel blanco y
tinta. Esa es la lógica de la interfaz: el mapa manda, y lo que lo rodea es
margen de imprenta.

Lo propio del producto es que el marco está vivo. Las coordenadas del borde
son las de la cámara en ese momento y cambian mientras el mapa vuela entre
escenas. Ningún otro sitio puede tener ese detalle, porque sale de lo que la
herramienta hace.

## Color

Los roles salen de las convenciones de color de la cartografía topográfica:
negro para la rotulación, azul para la hidrografía, siena para las curvas de
nivel.

| Token | Valor | Rol |
|---|---|---|
| `--paper` | `#ffffff` | Superficie principal. Blanco puro, sin tono hueso |
| `--paper-2` | `#f1f3f5` | Campos, filas seleccionadas, código |
| `--ink` | `#14181d` | Texto principal y línea de marco |
| `--ink-2` | `#47505a` | Texto secundario (8,2:1 sobre blanco) |
| `--ink-3` | `#646d77` | Rótulos y notas (5,2:1 sobre blanco) |
| `--rule` | `#d6dbe0` | Divisores |
| `--water` | `#1a5c96` | Acción principal, foco, selección (7,0:1) |
| `--water-tint` | `#e8f0f7` | Fondo de lo seleccionado |
| `--contour` | `#a8561c` | Marcador de la escena activa y arco de vuelo. Nunca texto largo |
| `--danger` | `#b42318` | Borrar, errores |
| `--caution` | `#7a4f00` | Avisos (sobre `#fff6e0`) |

Una sola tinta de acción. El siena aparece solo donde el mapa marca algo.

## Tipografía

**Overpass**, de Delve Fonts, interpreta Highway Gothic, la letra de la
señalética vial y de la rotulación de muchas cartas. Es letra hecha para leerse
de pasada sobre un paisaje, que es lo que hace el texto de una escena sobre el
mapa. **Overpass Mono** para coordenadas, cifras de cámara y contadores, con
cifras tabulares.

Una sola familia. La jerarquía se arma con tamaño y peso (300 contra 800), no
con una segunda fuente.

## Forma

- Radios: 2 px en controles, 4 px en paneles. Nada redondeado como píldora.
- Bordes de 1 px en `--rule`; el marco del mapa en `--ink`.
- Sin sombras de color, sin glows, sin desenfoque de fondo sobre el mapa (cuesta
  rendimiento en WebGL y ensucia la lectura). Las tarjetas sobre el mapa son
  blancas y opacas, como una cartela.
- Íconos de Lucide a 1,75 de trazo, solo donde aclaran una acción.

## Movimiento

El único movimiento que importa es el vuelo de cámara. La interfaz responde
con transiciones cortas de opacidad (150 a 200 ms) y nada rebota, pulsa ni
escala al pasar el mouse. Con `prefers-reduced-motion` los vuelos se vuelven
saltos.

## Exclusiones, con lo que va en su lugar

- Degradado índigo a rosa: tinta negra y un azul de hidrografía con razón.
- Inter y JetBrains Mono: Overpass y Overpass Mono, por la señalética.
- Glassmorphism y viñetas sobre el mapa: tarjetas opacas, el mapa sin velo.
- Etiquetas en mayúscula con tracking sobre cada título: rótulos en Overpass
  Mono pequeños solo donde nombran un dato.
- Tres tarjetas de "para quién": la landing es una historia que se recorre, y
  cada escena explica una parte de la herramienta usándola.
- Puntos pulsantes y halos en el marcador: un número de escena en un círculo,
  como las estaciones numeradas de un itinerario.
- Modo oscuro permanente: blanco de imprenta. El mapa ya pone el color.

## Copy

Español de Chile, sin voseo, en segunda persona. Los botones dicen lo que pasa
("Abrir el editor", "Copiar el código"). Los errores dicen qué falló y qué
hacer.
