import type { Map as MapboxMap } from 'mapbox-gl';

/** Sky and horizon, shared so the editor and the embed look the same. */
export const FOG = {
  range: [0.8, 8] as [number, number],
  color: '#dfe6ec',
  'high-color': '#3f6c9a',
  'space-color': '#0c1420',
  'horizon-blend': 0.05,
  'star-intensity': 0.12,
};

const DEM = 'mapbox-dem';

/**
 * Registers the elevation source and turns terrain on. setStyle() wipes
 * sources the style does not declare, and 'load' only fires once, so switching
 * map style used to flatten every tilted scene. This runs on every style.load.
 */
export function keepTerrain(map: MapboxMap, exaggeration = 1.4) {
  const apply = () => {
    if (!map.getSource(DEM)) {
      map.addSource(DEM, {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: DEM, exaggeration });
    map.setFog(FOG);
  };
  if (map.isStyleLoaded()) apply();
  map.on('style.load', apply);
  return () => {
    map.off('style.load', apply);
  };
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** flyTo, or a cut when the reader asked the system for less motion. */
export function flyDuration(ms: number) {
  return reducedMotion() ? 0 : ms;
}
