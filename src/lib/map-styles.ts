export type MapStyle = 'dark' | 'satellite' | 'streets' | 'outdoors' | 'light';

export const MAP_STYLES: { id: MapStyle; name: string; url: string }[] = [
  { id: 'satellite', name: 'Satélite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'outdoors', name: 'Relieve', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'streets', name: 'Calles', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'light', name: 'Claro', url: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', name: 'Oscuro', url: 'mapbox://styles/mapbox/dark-v11' },
];

export const isMapStyle = (value: unknown): value is MapStyle =>
  MAP_STYLES.some((style) => style.id === value);

export const styleUrl = (id: MapStyle) =>
  (MAP_STYLES.find((style) => style.id === id) ?? MAP_STYLES[0]).url;
