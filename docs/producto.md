# GeoNarrator Studio: qué es, para quién y hasta dónde llega

Documento de producto. Define el alcance del MVP y sirve de criterio para
decidir qué entra y qué no. Si algo no está aquí, no está en el MVP.

## El problema

Contar una historia sobre un mapa exige hoy escribir código. Las herramientas
que existen se reparten en dos extremos: librerías como Mapbox GL o deck.gl,
que dan control total a cambio de saber programar, y plantillas cerradas donde
se elige entre tres plantillas y no se toca nada más.

En el medio queda un hueco: alguien que sabe exactamente qué quiere mostrar,
en qué orden y desde qué ángulo, pero no va a escribir JavaScript para
conseguirlo. Una periodista con datos de un incendio. Un profesor explicando
por qué Chile tiene el desierto más árido del mundo y glaciares en el mismo
territorio. Alguien que investigó rutas migratorias y necesita que se vean.

## Qué es

Un editor visual donde una historia es una secuencia de escenas, y cada escena
guarda dos cosas: un texto y una posición de cámara. En modo preview, el mapa
vuela de una escena a la siguiente a medida que se hace scroll.

La historia completa es un JSON. Se exporta, se importa, y se puede incrustar
en cualquier sitio con un iframe.

## Qué no es

- No es un editor de mapas. No se dibuja sobre el mapa ni se editan geometrías.
- No es una herramienta de análisis espacial. No calcula, no cruza capas.
- No es una red social. No hay cuentas, perfiles ni galería pública.
- No es un reemplazo de ArcGIS StoryMaps para uso institucional.

## Para quién

**Público principal: periodismo de datos y docencia.** Personas que producen
contenido y necesitan que el mapa acompañe la narración, no que la reemplace.
Manejan bien texto y estructura; no van a tocar una API.

Lo que necesitan y aquí encuentran: control de encuadre por escena, texto que
manda sobre el mapa, y una salida que se pueda pegar en un CMS.

**Público secundario: quien presenta trabajo propio.** Investigadoras,
consultoras, alguien armando una presentación donde la geografía importa. Usan
la herramienta una vez, exportan y se van. Para ellos el MVP tiene que ser
comprensible sin tutorial.

**Fuera de público**: equipos que necesitan colaborar en tiempo real sobre la
misma historia, o publicar bajo su propia marca. Eso es otro producto.

## El flujo

El recorrido completo, y el orden en que hay que resolverlo.

### 1. Llegada

Se entra a la portada, que es en sí misma una historia scrollytelling: el
mecanismo se demuestra usándolo. Al terminar de recorrerla, se sabe qué hace
la herramienta sin haber leído una descripción.

Salida: un botón al editor.

### 2. Primer contacto con el editor

Se abre con un proyecto de ejemplo cargado, no con un lienzo vacío. Tres
escenas sobre la geografía de Chile, listas para tocar. La primera pregunta de
cualquiera al entrar es "¿y ahora qué hago?", y un proyecto que ya se mueve la
responde antes de que se formule.

Salida esperada: se mueve el mapa, se cambia un texto, se entiende la relación
entre panel y escena.

### 3. Construir la historia

Por cada escena:

1. Se escribe el título y el texto narrativo.
2. Se busca el lugar por nombre, o se pegan coordenadas, o se arrastra el
   marcador sobre el mapa.
3. Se ajusta la cámara: acercamiento, inclinación y rotación, con controles
   directos o volando el mapa a mano y capturando la vista.

Las escenas se reordenan arrastrándolas en la línea de tiempo.

### 4. Ver el resultado

Se cambia a preview y se recorre la historia como la va a ver el público:
scroll, teclado o botones. Se vuelve a editar sin perder nada.

### 5. Sacarla de aquí

Tres salidas, según lo que se necesite:

- **Exportar JSON**: el proyecto completo, para guardarlo o versionarlo.
- **Incrustar**: un iframe con la historia dentro de la URL, sin servidor.
- **Compartir el link** del embed directamente.

## Alcance del MVP

### Dentro

| | Estado |
|---|---|
| Editor de escenas con texto, ubicación y cámara | hecho |
| Búsqueda de lugares y pegado de coordenadas | hecho |
| Reordenar escenas arrastrando | hecho |
| Preview con scroll, teclado y botones | hecho |
| Export e import de JSON validado | hecho |
| Embed por URL en iframe | hecho |
| Cinco estilos de mapa, terreno 3D y proyección de globo | hecho |
| Persistencia local entre sesiones, con migraciones versionadas | hecho |
| Proyectos de ejemplo cargables | hecho |
| Cargar un GeoJSON propio y pintarlo sobre el mapa | hecho |
| Control de capas y leyenda | hecho |
| Recuperación ante errores en todos los caminos | pendiente |
| Accesibilidad por teclado y lector de pantalla | pendiente |

### Fuera, y por qué

- **Cuentas de usuario**: el MVP no necesita saber quién eres. Todo vive en el
  navegador y se exporta.
- **Backend propio**: mientras la historia quepa en un archivo y en una URL, un
  servidor solo agrega costo y superficie de ataque. El acceso al
  almacenamiento queda aislado tras una interfaz para que agregarlo después no
  obligue a reescribir.
- **Colaboración en tiempo real**: exige resolver conflictos de edición. Es un
  proyecto en sí mismo.
- **Subir imágenes o video**: sin backend no hay dónde guardarlos.
- **Historias con ramificación**: la narrativa es lineal a propósito.

## Capas de datos

Lo que separa un demo de una herramienta útil. Hoy la historia solo controla la
cámara; con capas puede mostrar los datos de los que habla.

**Qué hace**: se carga un archivo GeoJSON, se elige cómo pintarlo, y queda
disponible para mostrarse u ocultarse en cada escena.

**Alcance**:

- Formatos: GeoJSON (`FeatureCollection`), puntos, líneas y polígonos.
- Estilo: color fijo, o derivado de una propiedad numérica del dato.
- Por escena se decide qué capas se ven, de modo que la historia también revele
  información y no solo se mueva.
- Leyenda automática a partir del estilo.
- El archivo viaja dentro del proyecto exportado.

**Límite explícito**: un GeoJSON grande no cabe en una URL. Sobre cierto
tamaño, el embed deja de incluir la capa y avisa. Ese es el punto donde un
backend se justifica, y no antes.

## Criterios de aceptación

Verificables. Si alguno no se cumple, el MVP no está listo.

1. Alguien que nunca vio la herramienta produce una historia de tres escenas y
   la exporta, sin ayuda y sin leer documentación.
2. Ningún camino termina en pantalla en blanco ni en un error sin explicación:
   token ausente, JSON inválido, GeoJSON malformado, sin conexión.
3. El editor se opera completo con teclado, y los controles se anuncian en un
   lector de pantalla.
4. Funciona en pantalla de teléfono, no solo en escritorio.
5. Cargar una capa de 5.000 features no congela la interfaz.
6. La suite pasa y cubre la lógica pura: codec, coordenadas, store y capas.
7. Un lector externo entiende, leyendo el repositorio, qué es el proyecto y por
   qué está construido así.

## Decisiones tomadas

**El estado vive en el navegador.** `localStorage` para la sesión, JSON para
llevárselo. Consecuencia aceptada: se pierde al limpiar el navegador, y por eso
exportar tiene que ser evidente.

**La historia viaja en la URL.** Sin servidor no hay dónde guardarla. Funciona
hasta cierto tamaño y la herramienta avisa cuando se pasa, en vez de generar en
silencio un link roto.

**El mapa es Mapbox GL.** Terreno, proyección de globo y estilos listos. La
alternativa, MapLibre, evita depender de un token, pero obliga a resolver el
terreno y los estilos por cuenta propia. Para el MVP no compensa.

**Preparado para migrar.** El acceso al almacenamiento queda tras una interfaz.
Cambiar `localStorage` por una API debería ser tocar un archivo.

## Después del MVP

En orden de valor, no de dificultad:

1. Guardar historias con URL corta, que resuelve el límite del embed.
2. Series temporales: que una capa cambie en el tiempo y la historia lo recorra.
3. Exportar a video, que es lo que en la práctica se termina pidiendo.
4. Estilos de mapa propios desde Mapbox Studio.
