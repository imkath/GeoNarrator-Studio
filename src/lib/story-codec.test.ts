import { describe, expect, it } from 'vitest';
import { Chapter } from '@/types';
import { buildEmbed, decodeStory, encodeStory, MAX_EMBED_URL_LENGTH, type EmbedPayload } from './story-codec';

const chapter = (overrides: Partial<Chapter> = {}): Chapter => ({
  id: 'intro',
  title: 'La Geografia de los Extremos',
  content: 'Chile es una larga y angosta faja de tierra.',
  longitude: -70.6693,
  latitude: -33.4489,
  zoom: 4,
  pitch: 0,
  bearing: 0,
  ...overrides,
});

const payload = (chapters: Chapter[]): EmbedPayload => ({ chapters, mapStyle: 'dark' });

describe('story-codec', () => {
  it('survives a round trip', () => {
    const original = payload([chapter(), chapter({ id: 'sur', pitch: 75, bearing: 45 })]);
    expect(decodeStory(encodeStory(original))).toEqual(original);
  });

  it('handles text outside Latin-1, which used to break the embed', () => {
    const original = payload([
      chapter({ title: 'Ruta del Inca 🏔', content: 'Curly “quotes”, an em dash — and 富士山' }),
    ]);
    expect(decodeStory(encodeStory(original))).toEqual(original);
  });

  it('emits nothing a query string would reinterpret', () => {
    const encoded = encodeStory(payload(Array.from({ length: 12 }, (_, i) => chapter({ id: `c${i}` }))));
    expect(encoded).not.toMatch(/[+/=]/);
    expect(new URL(`https://x.test/embed?data=${encoded}`).searchParams.get('data')).toBe(encoded);
  });

  it('rejects a story with no scenes', () => {
    expect(() => decodeStory(encodeStory(payload([])))).toThrow(/no scenes/i);
  });

  it('rejects scenes whose coordinates are not numbers', () => {
    const broken = encodeStory({
      chapters: [{ ...chapter(), longitude: '-70.6' as unknown as number }],
      mapStyle: 'dark',
    });
    expect(() => decodeStory(broken)).toThrow(/incomplete/i);
  });

  it('rejects input that is not an encoded story', () => {
    expect(() => decodeStory('not-a-story')).toThrow();
  });
});

describe('buildEmbed', () => {
  const heavyLayer = (id: string) => ({
    id,
    name: id,
    collection: {
      type: 'FeatureCollection' as const,
      features: Array.from({ length: 400 }, (_, i) => ({
        type: 'Feature' as const,
        properties: { n: i },
        geometry: { type: 'Point' as const, coordinates: [-70 + i / 1000, -33] },
      })),
    },
    style: { color: '#6366f1', opacity: 0.7, rampFrom: '#312e81', rampTo: '#a5b4fc' },
    geometryKinds: ['Point'],
    numericProperties: { n: { min: 0, max: 399 } },
    featureCount: 400,
  });

  it('keeps light layers inside the URL', () => {
    const tiny = { ...heavyLayer('a'), collection: { type: 'FeatureCollection' as const, features: [] } };
    const result = buildEmbed({ chapters: [chapter()], mapStyle: 'dark', layers: [tiny] }, 40);

    expect(result.droppedLayers).toEqual([]);
    expect(decodeStory(result.encoded).layers).toHaveLength(1);
  });

  it('drops layers that would make the URL unusable, and says which', () => {
    const layer = heavyLayer('pesada');
    const result = buildEmbed({ chapters: [chapter()], mapStyle: 'dark', layers: [layer] }, 40);

    expect(result.droppedLayers.map((l) => l.id)).toEqual(['pesada']);
    expect(result.length).toBeLessThanOrEqual(MAX_EMBED_URL_LENGTH);
    expect(decodeStory(result.encoded).layers).toEqual([]);
    expect(decodeStory(result.encoded).chapters).toHaveLength(1);
  });

  it('rejects a payload whose layers field is not a list', () => {
    const broken = encodeStory({
      chapters: [chapter()],
      mapStyle: 'dark',
      layers: 'nope' as never,
    });
    expect(() => decodeStory(broken)).toThrow(/not a list/);
  });
});
