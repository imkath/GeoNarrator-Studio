import { describe, expect, it } from 'vitest';
import { Chapter } from '@/types';
import { decodeStory, encodeStory, type EmbedPayload } from './story-codec';

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
