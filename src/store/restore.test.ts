import { describe, expect, it } from 'vitest';
import { restoreStoredState } from './useStoryStore';
import { INITIAL_CHAPTERS } from '@/data/examples';

const scene = { id: 'mine', title: 'Mía', content: '', longitude: -70, latitude: -33, zoom: 10, pitch: 0, bearing: 0 };

describe('restoreStoredState', () => {
  it('keeps a healthy stored project as it is', () => {
    const restored = restoreStoredState({ chapters: [scene], layers: [], mapStyle: 'streets', projectName: 'X' });
    expect(restored.chapters).toEqual([scene]);
    expect(restored.mapStyle).toBe('streets');
  });

  it('falls back to the demo when stored scenes are corrupt, instead of crashing on every load', () => {
    const broken: Partial<typeof scene> = { ...scene };
    delete broken.zoom;
    const restored = restoreStoredState({ chapters: [broken], layers: [] });
    expect(restored.chapters).toEqual(INITIAL_CHAPTERS);
  });

  it('drops corrupt layers but keeps the scenes', () => {
    const restored = restoreStoredState({ chapters: [scene], layers: [{ id: 'bad' }] });
    expect(restored.chapters).toEqual([scene]);
    expect(restored.layers).toEqual([]);
  });

  it('ignores an unknown map style', () => {
    expect(restoreStoredState({ chapters: [scene], mapStyle: 'neon' }).mapStyle).toBe('satellite');
  });
});
