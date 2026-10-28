import { describe, expect, it } from 'vitest';
import { ProjectError, validateChapters, validateLayers } from './validate';

const scene = {
  id: 'a',
  title: 'Plaza de Armas',
  content: 'El punto cero.',
  longitude: -70.65,
  latitude: -33.44,
  zoom: 16,
  pitch: 55,
  bearing: 20,
};

const layer = {
  id: 'l1',
  name: 'Ferias',
  collection: { type: 'FeatureCollection', features: [] },
  geometryKinds: ['Point'],
  numericProperties: { puestos: { min: 0, max: 911 } },
  featureCount: 0,
  style: { color: '#1a5c96', opacity: 0.7, rampFrom: '#d3e4f2', rampTo: '#0d3d66' },
};

describe('validateChapters', () => {
  it('keeps a well formed scene as it is', () => {
    expect(validateChapters([scene])).toEqual([scene]);
  });

  it('rejects a scene without camera values, which used to crash the editor', () => {
    const withoutZoom: Partial<typeof scene> = { ...scene };
    delete withoutZoom.zoom;
    expect(() => validateChapters([withoutZoom])).toThrow(ProjectError);
    expect(() => validateChapters([{ ...scene, pitch: 'alto' }])).toThrow(/escena 1/);
  });

  it('fills in missing text and clamps values the map cannot show', () => {
    const [fixed] = validateChapters([{ ...scene, content: undefined, pitch: 120, latitude: -95 }]);
    expect(fixed.content).toBe('');
    expect(fixed.pitch).toBe(85);
    expect(fixed.latitude).toBe(-85);
  });

  it('renames repeated ids so selection and reordering keep working', () => {
    const ids = validateChapters([scene, scene]).map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('validateLayers', () => {
  it('treats a missing field as no layers', () => {
    expect(validateLayers(undefined)).toEqual([]);
  });

  it('accepts a layer this app wrote', () => {
    expect(validateLayers([layer])[0].name).toBe('Ferias');
  });

  it('rejects a layer without a style, which used to take the embed down', () => {
    const withoutStyle: Partial<typeof layer> = { ...layer };
    delete withoutStyle.style;
    expect(() => validateLayers([withoutStyle])).toThrow(/capa 1/);
  });

  it('rejects colours that are not hex, since they go into paint expressions', () => {
    expect(() => validateLayers([{ ...layer, style: { ...layer.style, color: 'url(x)' } }])).toThrow(ProjectError);
  });
});
