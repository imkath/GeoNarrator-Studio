/**
 * Accepts what people actually paste: the decimal pair from Google Maps
 * ("-33.4489, -70.6693") and the signed form from Wikipedia ("33.4489 S,
 * 70.6693 W"). Returns [lng, lat], the order Mapbox expects, or null when the
 * input is not a valid pair.
 */
export function parseCoordinates(input: string): [number, number] | null {
  const cleaned = input.trim().replace(/\s+/g, ' ');

  const decimal = cleaned.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (decimal) {
    return validate(parseFloat(decimal[1]), parseFloat(decimal[2]));
  }

  const signed = cleaned.match(
    /^(\d+(?:\.\d+)?)°?\s*([NS])[,\s]+(\d+(?:\.\d+)?)°?\s*([EW])$/i
  );
  if (signed) {
    const lat = parseFloat(signed[1]) * (signed[2].toUpperCase() === 'S' ? -1 : 1);
    const lng = parseFloat(signed[3]) * (signed[4].toUpperCase() === 'W' ? -1 : 1);
    return validate(lat, lng);
  }

  return null;
}

function validate(lat: number, lng: number): [number, number] | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lng, lat];
}
