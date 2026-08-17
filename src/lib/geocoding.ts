export interface Place {
  id: string;
  label: string;
  /** Where it is, in words: "Recoleta, Santiago, Chile". */
  context: string;
  center: [number, number]; // [lng, lat]
  /** How close to get: a market and a region do not deserve the same zoom. */
  zoom: number;
  isCoordinate: boolean;
}

const ZOOM_BY_TYPE: Record<string, number> = {
  poi: 15.5,
  address: 16,
  street: 15,
  neighborhood: 13.5,
  locality: 12.5,
  place: 11,
  district: 9,
  region: 7,
  country: 4,
};

interface SearchFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
  };
}

/**
 * Search Box, not Geocoding.
 *
 * Geocoding only indexes addresses, streets and administrative places, so
 * searching for a named place returned whatever street matched the words:
 * "La Vega Central, Santiago" answered with three streets in the Dominican
 * Republic. Search Box includes points of interest, which is what people
 * actually type into a map.
 *
 * https://docs.mapbox.com/api/search/search-box/
 */
export async function searchPlaces(
  query: string,
  token: string,
  options: { near?: [number, number]; signal?: AbortSignal } = {}
): Promise<Place[]> {
  const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward');
  url.searchParams.set('q', query.slice(0, 256));
  url.searchParams.set('limit', '6');
  url.searchParams.set('language', 'es');
  url.searchParams.set('access_token', token);

  // Bias towards what the map already shows, so a search made while looking at
  // Chile does not answer with the other side of the continent.
  if (options.near) {
    url.searchParams.set('proximity', options.near.join(','));
  }

  const response = await fetch(url, { signal: options.signal });
  if (!response.ok) {
    throw new Error(`Mapbox returned ${response.status}`);
  }

  const data: { features?: SearchFeature[] } = await response.json();

  return (data.features ?? []).map((feature, index) => ({
    id: feature.properties.mapbox_id ?? `result-${index}`,
    label: feature.properties.name ?? feature.properties.full_address ?? 'Sin nombre',
    context: feature.properties.place_formatted ?? feature.properties.full_address ?? '',
    center: feature.geometry.coordinates,
    zoom: ZOOM_BY_TYPE[feature.properties.feature_type ?? ''] ?? 13,
    isCoordinate: false,
  }));
}
