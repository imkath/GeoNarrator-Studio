export interface Place {
  id: string;
  label: string;
  center: [number, number]; // [lng, lat]
  isCoordinate: boolean;
}

interface GeocodeFeature {
  id: string;
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
  };
}

/**
 * Geocoding v6. The v5 endpoint (mapbox.places) still answers but no longer
 * returns points of interest, which was half of what this searches for.
 * https://docs.mapbox.com/api/search/geocoding/
 */
export async function searchPlaces(
  query: string,
  token: string,
  signal?: AbortSignal
): Promise<Place[]> {
  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.searchParams.set('q', query.slice(0, 256));
  url.searchParams.set('limit', '5');
  url.searchParams.set('access_token', token);

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Mapbox returned ${response.status}`);
  }

  const data: { features?: GeocodeFeature[] } = await response.json();
  return (data.features ?? []).map((feature) => ({
    id: feature.id,
    label:
      feature.properties.full_address ??
      [feature.properties.name, feature.properties.place_formatted]
        .filter(Boolean)
        .join(', '),
    center: feature.geometry.coordinates,
    isCoordinate: false,
  }));
}
