# GeoNarrator Studio

> Editor visual de scrollytelling 3D con mapas. Crea historias geográficas interactivas sin escribir código.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Mapbox](https://img.shields.io/badge/Mapbox-GL-000?logo=mapbox)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)

## Características

- **Editor Visual No-Code**: Captura posiciones de cámara 3D con un click
- **Scrollytelling**: Narración sincronizada con movimientos de cámara cinematográficos
- **Mapa 3D**: Terreno con elevación, niebla atmosférica y estrellas
- **Animaciones Premium**: Microinteracciones y transiciones estilo Awwwards
- **Exportación JSON**: Guarda y comparte tus historias

## Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Next.js 14** | Framework React con App Router |
| **TypeScript** | Tipado estricto |
| **react-map-gl** | Wrapper oficial de Mapbox para React |
| **mapbox-gl** | Motor de renderizado 3D |
| **Zustand** | Estado global sin boilerplate |
| **Framer Motion** | Animaciones fluidas |
| **Tailwind CSS** | Estilos utility-first |
| **Radix UI** | Componentes accesibles |

## Arquitectura

```
src/
├── app/                      # Next.js App Router
│   ├── globals.css           # Estilos globales + efectos premium
│   ├── layout.tsx            # Layout raíz con metadata SEO
│   └── page.tsx              # Página principal
│
├── components/
│   ├── GeoNarratorStudio.tsx # Componente orquestador principal
│   │
│   ├── map/
│   │   └── MapCanvas.tsx     # Mapa 3D con react-map-gl
│   │                         # - Terreno DEM con exageración
│   │                         # - Proyección de globo
│   │                         # - Marcadores animados
│   │                         # - Fog atmosférico con estrellas
│   │
│   ├── editor/
│   │   ├── Sidebar.tsx       # Panel de edición de escenas
│   │   │                     # - Formulario título/narrativa
│   │   │                     # - Control de cámara "No-Code"
│   │   │                     # - Stats de posición actual
│   │   │
│   │   └── ChapterList.tsx   # Lista de capítulos
│   │                         # - Animaciones de entrada/salida
│   │                         # - Indicador de selección
│   │                         # - Badges 3D para pitch > 10°
│   │
│   ├── preview/
│   │   └── StoryOverlay.tsx  # Capa de scrollytelling
│   │                         # - IntersectionObserver para scroll
│   │                         # - Cards con glassmorphism
│   │                         # - Indicadores de progreso lateral
│   │
│   └── ui/
│       └── Header.tsx        # Barra superior
│                             # - Logo animado
│                             # - Toggle Editor/Preview
│                             # - Exportar JSON
│
├── store/
│   └── useStoryStore.ts      # Estado global Zustand
│                             # - chapters: Chapter[]
│                             # - activeChapterId (preview)
│                             # - selectedChapterId (editor)
│                             # - mode: 'edit' | 'preview'
│                             # - currentCamera: CameraState
│                             # - CRUD de capítulos
│
├── types/
│   └── index.ts              # Interfaces TypeScript
│                             # - CameraState
│                             # - Chapter
│                             # - EditorMode
│                             # - ViewState
│
└── lib/
    └── utils.ts              # Utilidades
                              # - cn() para clases condicionales
```

## Modelo de Datos

```typescript
interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;      // Inclinación 0-85°
  bearing: number;    // Rotación -180 a 180°
}

interface Chapter extends CameraState {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;  // Futuro: imágenes/videos
  duration?: number;  // Futuro: duración de transición
}

type EditorMode = 'edit' | 'preview';
```

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     useStoryStore (Zustand)                 │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────────┐   │
│  │chapters │  │ mode     │  │selected│  │currentCamera │   │
│  │ Array   │  │edit/prev │  │ChapterId│  │ CameraState │   │
│  └────┬────┘  └────┬─────┘  └───┬────┘  └──────┬───────┘   │
└───────┼────────────┼────────────┼──────────────┼───────────┘
        │            │            │              │
        ▼            ▼            ▼              ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐
   │Sidebar  │  │Header   │  │MapCanvas│  │StoryOverlay│
   │ChapterLi│  │(toggle) │  │(flyTo)  │  │(observer) │
   └─────────┘  └─────────┘  └─────────┘  └───────────┘
```

## Instalación

```bash
# Clonar e instalar
cd geonarrator-app
npm install

# Configurar Mapbox token
cp .env.example .env.local
# Editar .env.local con tu token

# Desarrollo
npm run dev

# Build producción
npm run build
npm start
```

## Variables de Entorno

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

Obtén tu token en [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)

## Uso

### Modo Editor
1. Navega el mapa (zoom, rotar, inclinar)
2. Click en **CAPTURE CURRENT VIEW** para guardar la posición
3. Edita título y narrativa
4. Añade más escenas con **ADD NEW SCENE**

### Modo Preview
1. Cambia a **PREVIEW** en el header
2. Haz scroll para avanzar la historia
3. El mapa se anima automáticamente entre capítulos

### Controles del Mapa
| Acción | Control |
|--------|---------|
| Mover | Click + Arrastrar |
| Zoom | Scroll / Doble click |
| Rotar | Click derecho + Arrastrar |
| Inclinar | Ctrl + Arrastrar |

## Personalización

### Estilos de Mapa
Cambia `mapStyle` en `MapCanvas.tsx`:
```typescript
mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
// Opciones: dark-v11, light-v11, streets-v12, satellite-v9
```

### Duración de Animaciones
En `MapCanvas.tsx`, ajusta `flyTo`:
```typescript
mapRef.current.flyTo({
  duration: 3500,  // milisegundos
  curve: 1.2,      // curvatura de vuelo
  speed: 0.8       // velocidad relativa
});
```

### Terreno 3D
```typescript
map.setTerrain({
  source: 'mapbox-dem',
  exaggeration: 1.5  // 1.0 = real, 2.0 = doble altura
});
```

## Roadmap

- [ ] Drag & drop para reordenar capítulos (dnd-kit)
- [ ] Soporte para imágenes/videos en capítulos
- [ ] Persistencia en Supabase/Firebase
- [ ] Autenticación de usuarios
- [ ] Compartir historias públicamente
- [ ] Embed code para websites
- [ ] Temas de color personalizables

## Licencia

MIT

---

Desarrollado con Next.js, Mapbox y mucho café.
