import type { DataLayer, LayerStyle, NumericRange } from '@/types';

/** Geometry types this app knows how to paint. */
const SUPPORTED = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
]);

export class GeoJSONError extends Error {}

export interface ParsedGeoJSON {
  collection: GeoJSON.FeatureCollection;
  /** Numeric properties found, with their range, for styling by value. */
  numericProperties: Record<string, NumericRange>;
  geometryKinds: Set<string>;
  featureCount: number;
}

/**
 * Validates untrusted GeoJSON and pulls out what the styling UI needs.
 * Throws GeoJSONError with a message meant to be shown to the user: this runs
 * on files people drag in, so "it failed" is never an acceptable answer.
 */
export function parseGeoJSON(raw: string): ParsedGeoJSON {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeoJSONError('The file is not valid JSON');
  }

  const collection = asFeatureCollection(parsed);
  if (collection.features.length === 0) {
    throw new GeoJSONError('The file has no features');
  }

  const geometryKinds = new Set<string>();
  const numericProperties: Record<string, NumericRange> = {};
  // A property only counts as numeric if it is numeric in every feature that
  // carries it; otherwise a colour scale built on it would break halfway.
  const rejected = new Set<string>();

  for (const feature of collection.features) {
    if (!feature.geometry) {
      throw new GeoJSONError('Some features have no geometry');
    }
    if (!SUPPORTED.has(feature.geometry.type)) {
      throw new GeoJSONError(`Unsupported geometry: ${feature.geometry.type}`);
    }
    geometryKinds.add(feature.geometry.type);

    for (const [key, value] of Object.entries(feature.properties ?? {})) {
      if (rejected.has(key)) continue;
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        rejected.add(key);
        delete numericProperties[key];
        continue;
      }
      const range = numericProperties[key];
      numericProperties[key] = range
        ? { min: Math.min(range.min, value), max: Math.max(range.max, value) }
        : { min: value, max: value };
    }
  }

  return {
    collection,
    numericProperties,
    geometryKinds,
    featureCount: collection.features.length,
  };
}

function asFeatureCollection(value: unknown): GeoJSON.FeatureCollection {
  if (typeof value !== 'object' || value === null) {
    throw new GeoJSONError('The file is not a GeoJSON object');
  }
  const candidate = value as { type?: unknown; features?: unknown };

  if (candidate.type === 'Feature') {
    // A lone Feature is valid GeoJSON and people export it all the time.
    return { type: 'FeatureCollection', features: [value as GeoJSON.Feature] };
  }
  if (candidate.type !== 'FeatureCollection') {
    throw new GeoJSONError('Expected a FeatureCollection or a Feature');
  }
  if (!Array.isArray(candidate.features)) {
    throw new GeoJSONError('The FeatureCollection has no features list');
  }

  return value as GeoJSON.FeatureCollection;
}

/** Rough bounding box, to fly the camera to a freshly loaded layer. */
export function boundsOf(collection: GeoJSON.FeatureCollection): [number, number, number, number] | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  // Coordinates nest to different depths per geometry type, so this walks the
  // array until it reaches a [lng, lat] pair.
  const visit = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords as [number, number];
      west = Math.min(west, lng);
      east = Math.max(east, lng);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      return;
    }
    coords.forEach(visit);
  };

  for (const feature of collection.features) {
    if (feature.geometry && 'coordinates' in feature.geometry) {
      visit(feature.geometry.coordinates);
    }
  }

  return Number.isFinite(west) ? [west, south, east, north] : null;
}

/**
 * Mapbox paint expression for the fill/line/circle colour. A layer styled by a
 * property interpolates between two colours across that property's range;
 * otherwise it is a flat colour.
 */
export function colorExpression(style: LayerStyle): string | unknown[] {
  if (!style.property || !style.range) return style.color;

  const { min, max } = style.range;
  if (min === max) return style.color;

  return [
    'interpolate',
    ['linear'],
    ['to-number', ['get', style.property], min],
    min,
    style.rampFrom,
    max,
    style.rampTo,
  ];
}

/** Layer size in bytes once serialised, used to warn before embedding. */
export function layerWeight(layer: DataLayer): number {
  return new TextEncoder().encode(JSON.stringify(layer.collection)).length;
}
