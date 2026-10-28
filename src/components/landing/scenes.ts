import type { CameraState, DataLayer } from '@/types';

export interface LandingScene extends CameraState {
  id: string;
  /** Show the ferias layer in this scene. */
  data?: boolean;
}

/**
 * The landing is itself a story made of these scenes. Index 0 is the opening
 * view behind the hero text.
 */
export const LANDING_SCENES: LandingScene[] = [
  { id: 'inicio', longitude: -69.5, latitude: -30, zoom: 2.3, pitch: 20, bearing: -10 },
  // Santiago from the west, the cordillera as the back wall.
  { id: 'escena', longitude: -70.69, latitude: -33.47, zoom: 10.4, pitch: 64, bearing: 78 },
  // Osorno volcano over Llanquihue lake.
  { id: 'relieve', longitude: -72.55, latitude: -41.16, zoom: 11.2, pitch: 72, bearing: 28 },
  { id: 'datos', longitude: -70.66, latitude: -33.47, zoom: 10.1, pitch: 0, bearing: 0, data: true },
  { id: 'compartir', longitude: -71.5, latitude: -37, zoom: 3.1, pitch: 25, bearing: -8 },
];

export const FERIAS_URL = '/data/ferias-libres-rm.geojson';

/** Built once the file arrives; the style matches what the editor would make. */
export const feriasLayer = (collection: GeoJSON.FeatureCollection): DataLayer => ({
  id: 'ferias',
  name: 'Ferias libres de la RM',
  collection,
  geometryKinds: ['Point'],
  numericProperties: { puestos: { min: 0, max: 911 } },
  featureCount: collection.features.length,
  style: {
    color: '#a8561c',
    opacity: 0.95,
    property: 'puestos',
    range: { min: 0, max: 911 },
    rampFrom: '#fde3c0',
    rampTo: '#e0601f',
  },
});
