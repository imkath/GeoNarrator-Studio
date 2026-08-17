import { describe, expect, it } from 'vitest';
import { boundsOf, colorExpression, GeoJSONError, parseGeoJSON } from './geojson';
import type { LayerStyle } from '@/types';

const point = (lng: number, lat: number, properties: Record<string, unknown> = {}) => ({
  type: 'Feature' as const,
  properties,
  geometry: { type: 'Point' as const, coordinates: [lng, lat] },
});

const collection = (features: unknown[]) =>
  JSON.stringify({ type: 'FeatureCollection', features });

describe('parseGeoJSON', () => {
  it('accepts a FeatureCollection and counts its features', () => {
    const parsed = parseGeoJSON(collection([point(-70.6, -33.4), point(-71.6, -33.0)]));
    expect(parsed.featureCount).toBe(2);
    expect([...parsed.geometryKinds]).toEqual(['Point']);
  });

  it('wraps a lone Feature, which is what many exports produce', () => {
    const parsed = parseGeoJSON(JSON.stringify(point(-70.6, -33.4)));
    expect(parsed.collection.type).toBe('FeatureCollection');
    expect(parsed.featureCount).toBe(1);
  });

  it('reports the range of each numeric property for styling', () => {
    const parsed = parseGeoJSON(
      collection([
        point(0, 0, { poblacion: 100, nombre: 'A' }),
        point(1, 1, { poblacion: 500, nombre: 'B' }),
      ])
    );
    expect(parsed.numericProperties).toEqual({ poblacion: { min: 100, max: 500 } });
  });

  it('discards a property that is not numeric in every feature', () => {
    const parsed = parseGeoJSON(
      collection([point(0, 0, { valor: 10 }), point(1, 1, { valor: 'sin dato' })])
    );
    expect(parsed.numericProperties).toEqual({});
  });

  it('discards NaN and Infinity, which would break a colour ramp', () => {
    const parsed = parseGeoJSON(
      collection([point(0, 0, { valor: 10 }), point(1, 1, { valor: Infinity })])
    );
    expect(parsed.numericProperties.valor).toBeUndefined();
  });

  it('explains what is wrong instead of throwing a parser error', () => {
    expect(() => parseGeoJSON('{ not json')).toThrow(GeoJSONError);
    expect(() => parseGeoJSON('{ not json')).toThrow(/JSON válido/);
    expect(() => parseGeoJSON(collection([]))).toThrow(/no contiene features/);
    expect(() => parseGeoJSON(JSON.stringify({ type: 'Polygon' }))).toThrow(/FeatureCollection/);
    expect(() =>
      parseGeoJSON(collection([{ type: 'Feature', properties: {}, geometry: null }]))
    ).toThrow(/sin geometría/);
    expect(() =>
      parseGeoJSON(
        collection([
          { type: 'Feature', properties: {}, geometry: { type: 'GeometryCollection' } },
        ])
      )
    ).toThrow(/no soportada/);
  });
});

describe('boundsOf', () => {
  it('covers points', () => {
    const { collection: parsed } = parseGeoJSON(
      collection([point(-70, -33), point(-72, -35), point(-71, -30)])
    );
    expect(boundsOf(parsed)).toEqual([-72, -35, -70, -30]);
  });

  it('walks the nested rings of a polygon', () => {
    const { collection: parsed } = parseGeoJSON(
      collection([
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[[-70, -33], [-69, -33], [-69, -32], [-70, -32], [-70, -33]]],
          },
        },
      ])
    );
    expect(boundsOf(parsed)).toEqual([-70, -33, -69, -32]);
  });

  it('returns null when there is nothing to measure', () => {
    expect(boundsOf({ type: 'FeatureCollection', features: [] })).toBeNull();
  });
});

describe('colorExpression', () => {
  const base: LayerStyle = {
    color: '#6366f1',
    opacity: 0.7,
    rampFrom: '#312e81',
    rampTo: '#a5b4fc',
  };

  it('uses a flat colour when no property drives it', () => {
    expect(colorExpression(base)).toBe('#6366f1');
  });

  it('interpolates across the property range', () => {
    const expression = colorExpression({
      ...base,
      property: 'poblacion',
      range: { min: 100, max: 500 },
    });
    expect(expression).toEqual([
      'interpolate',
      ['linear'],
      ['to-number', ['get', 'poblacion'], 100],
      100,
      '#312e81',
      500,
      '#a5b4fc',
    ]);
  });

  it('falls back to a flat colour when every value is identical', () => {
    const expression = colorExpression({
      ...base,
      property: 'poblacion',
      range: { min: 42, max: 42 },
    });
    expect(expression).toBe('#6366f1');
  });
});
