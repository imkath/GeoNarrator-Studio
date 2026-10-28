# Diseño de GeoNarrator Studio

## Dirección: la hoja de una carta topográfica

Una carta del Instituto Geográfico Militar tiene coordenadas rotuladas, una
cartela con el título y una leyenda en el margen. Esa es la lógica de los
componentes: rótulos en mono, cifras de cámara, leyendas que se arman solas.

El mapa satelital ocupa la pantalla y la historia corre encima, como un vuelo.
Lo propio del producto es la lectura en vivo de la cámara en la esquina: son
los valores reales mientras el mapa vuela entre escenas.

## Color

Hoja nocturna. La primera versión fue blanca, como una carta impresa, y le
quitó al sitio lo que lo hacía sentir como un vuelo; se volvió a oscuro el
27-oct-2026. Los roles siguen saliendo de la cartografía topográfica (tinta,
hidrografía, curvas de nivel), invertidos para leerse sobre un satélite.

| Token | Valor | Rol |
|---|---|---|
| `--paper` | `#0e1114` | Superficie. Casi negro con un dejo de azul, nunca azul marino |
| `--paper-2` | `#181c21` | Campos, filas, código |
| `--ink` | `#eef0f2` | Texto principal y bordes de lo activo |
| `--ink-2` | `#b6bdc5` | Texto secundario |
| `--ink-3` | `#8b939c` | Rótulos y notas |
| `--rule` | `#2a3037` | Divisores |
| `--water` | `#7fb2e0` | Acción principal, foco, selección |
| `--contour` | `#d98a45` | Escena activa y marcador. Nunca texto largo |
| `--danger` / `--caution` | `#ff7a6b` / `#f0b860` | Borrar y errores / avisos |

Una sola tinta de acción, sin degradados ni brillos. El mapa pone el color.

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
- Glassmorphism y halos: tarjetas opacas. Sobre el mapa solo se oscurece la
  franja donde va el texto.
- Etiquetas en mayúscula con tracking sobre cada título: rótulos en Overpass
  Mono pequeños solo donde nombran un dato.
- Tres tarjetas de "para quién": la landing es una historia que se recorre, y
  cada escena explica una parte de la herramienta usándola.
- Puntos pulsantes y halos en el marcador: un número de escena en un círculo,
  como las estaciones numeradas de un itinerario.
- Navy de Tailwind (`slate-950`) como fondo: casi negro neutro.

## Copy

Español de Chile, sin voseo, en segunda persona. Los botones dicen lo que pasa
("Abrir el editor", "Copiar el código"). Los errores dicen qué falló y qué
hacer.
