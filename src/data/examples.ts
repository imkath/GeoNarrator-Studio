import type { Chapter } from '@/types';
import type { MapStyle } from '@/store/useStoryStore';

export interface Example {
  id: string;
  name: string;
  description: string;
  mapStyle: MapStyle;
  chapters: Chapter[];
}

/**
 * The editor opens with a project already loaded. An empty canvas puts the
 * burden of "what do I do now" on someone who has not yet understood what the
 * tool does; three scenes that already move answer it before it is asked.
 */
export const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    title: 'La Geografía de los Extremos',
    content:
      'Chile es una larga y angosta faja de tierra. Vista desde el espacio, parece un borde delgado entre la cordillera y el mar. Esta herramienta permite narrar su geografía sin escribir una sola línea de código.',
    longitude: -70.6693,
    latitude: -33.4489,
    zoom: 4.4,
    pitch: 45,
    bearing: -12,
  },
  {
    id: 'atacama',
    title: 'El Desierto de Atacama',
    content:
      'Al norte, el desierto más árido del mundo. Aquí usamos una inclinación de cámara para apreciar la vastedad de la planicie desértica y la ausencia total de vegetación.',
    longitude: -68.5,
    latitude: -23.5,
    zoom: 8.5,
    pitch: 60,
    bearing: -20,
  },
  {
    id: 'torres',
    title: 'Torres del Paine',
    content:
      'En el sur profundo, el granito se eleva verticalmente. La rotación de la cámara nos permite enfrentar las torres directamente, simulando un vuelo de dron sobre el parque nacional.',
    longitude: -72.9,
    latitude: -50.9423,
    zoom: 10,
    pitch: 75,
    bearing: 45,
  },
];

export const EXAMPLES: Example[] = [
  {
    id: 'chile',
    name: 'La geografía de los extremos',
    description: 'Tres paradas en Chile, del desierto a la Patagonia. El proyecto con el que abre el editor.',
    mapStyle: 'dark',
    chapters: INITIAL_CHAPTERS,
  },
  {
    id: 'santiago',
    name: 'Santiago de sur a norte',
    description: 'Un recorrido urbano a nivel de calle, con la cámara baja y el estilo de mapa claro.',
    mapStyle: 'streets',
    chapters: [
      {
        id: 'centro',
        title: 'Plaza de Armas',
        content:
          'El punto cero desde el que se midieron todas las distancias del país. La ciudad creció alrededor de este damero.',
        longitude: -70.6506,
        latitude: -33.4372,
        zoom: 16,
        pitch: 55,
        bearing: 20,
      },
      {
        id: 'mapocho',
        title: 'El río que parte la ciudad',
        content:
          'El Mapocho baja desde la cordillera y separa el norte del sur. Durante décadas fue también la frontera entre dos ciudades distintas.',
        longitude: -70.6725,
        latitude: -33.4256,
        zoom: 14.5,
        pitch: 60,
        bearing: -35,
      },
      {
        id: 'cordillera',
        title: 'La pared del fondo',
        content:
          'A treinta kilómetros del centro, la cordillera supera los cuatro mil metros. Ninguna otra capital americana tiene esta pared tan cerca.',
        longitude: -70.4,
        latitude: -33.42,
        zoom: 11,
        pitch: 75,
        bearing: 90,
      },
    ],
  },
  {
    id: 'vacio',
    name: 'Empezar de cero',
    description: 'Una sola escena centrada en el mundo, para construir una historia desde el principio.',
    mapStyle: 'dark',
    chapters: [
      {
        id: 'escena-1',
        title: 'Primera escena',
        content: 'Escribe aquí el texto, busca el lugar y ajusta la cámara.',
        longitude: -70.6693,
        latitude: -33.4489,
        zoom: 3,
        pitch: 0,
        bearing: 0,
      },
    ],
  },
];
