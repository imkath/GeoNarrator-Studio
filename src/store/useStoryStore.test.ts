import { beforeEach, describe, expect, it } from 'vitest';
import { migrateStoredState, useStoryStore, type ProjectData } from './useStoryStore';
import { EXAMPLES } from '@/data/examples';
import type { DataLayer } from '@/types';

const store = () => useStoryStore.getState();

const layerFixture = (id: string): DataLayer => ({
  id,
  name: id,
  collection: { type: 'FeatureCollection', features: [] },
  style: { color: '#6366f1', opacity: 0.7, rampFrom: '#312e81', rampTo: '#a5b4fc' },
  geometryKinds: ['Point'],
  numericProperties: {},
  featureCount: 0,
});

beforeEach(() => {
  store().resetToDefault();
});

describe('chapters', () => {
  it('adds a scene near the selected one and selects it', () => {
    const before = store().chapters.length;
    const reference = store().getSelectedChapter()!;

    store().addChapter();

    const created = store().getSelectedChapter()!;
    expect(store().chapters).toHaveLength(before + 1);
    expect(created.id).not.toBe(reference.id);
    expect(created.zoom).toBe(reference.zoom);
    expect(Math.abs(created.latitude - reference.latitude)).toBeLessThan(1);
  });

  it('never deletes the last scene, since the editor needs one to show', () => {
    while (store().chapters.length > 1) {
      store().deleteChapter(store().chapters[0].id);
    }
    const last = store().chapters[0];

    store().deleteChapter(last.id);

    expect(store().chapters).toEqual([last]);
  });

  it('moves the selection to the first scene when the selected one is deleted', () => {
    const [first, second] = store().chapters;
    store().setSelectedChapterId(second.id);

    store().deleteChapter(second.id);

    expect(store().selectedChapterId).toBe(first.id);
  });

  it('copies the live camera onto the selected scene', () => {
    const camera = { longitude: -71.5, latitude: -33.1, zoom: 14, pitch: 60, bearing: -20 };
    store().setCurrentCamera(camera);

    store().captureCurrentView();

    expect(store().getSelectedChapter()).toMatchObject(camera);
  });

  it('flags unsaved changes and clears them on save', () => {
    expect(store().hasUnsavedChanges).toBe(false);
    store().updateChapter(store().selectedChapterId, { title: 'Another title' });
    expect(store().hasUnsavedChanges).toBe(true);

    store().saveProject();

    expect(store().hasUnsavedChanges).toBe(false);
    expect(store().lastSaved).not.toBeNull();
  });
});

describe('loadProject', () => {
  const valid: ProjectData = {
    chapters: [
      {
        id: 'one',
        title: 'Valparaiso',
        content: 'Hills and funiculars.',
        longitude: -71.6127,
        latitude: -33.0472,
        zoom: 12,
        pitch: 45,
        bearing: 0,
      },
    ],
    mapStyle: 'satellite',
    version: '1.0.0',
    exportedAt: '2026-01-01T00:00:00.000Z',
  };

  it('loads a valid project and selects its first scene', () => {
    expect(store().loadProject(valid)).toEqual({ success: true });
    expect(store().chapters).toEqual(valid.chapters);
    expect(store().mapStyle).toBe('satellite');
    expect(store().selectedChapterId).toBe('one');
  });

  it('rejects a file with no scenes without touching the open project', () => {
    const original = store().chapters;

    const result = store().loadProject({ ...valid, chapters: [] });

    expect(result.success).toBe(false);
    expect(store().chapters).toEqual(original);
  });

  it('rejects scenes whose coordinates are not numbers', () => {
    const result = store().loadProject({
      ...valid,
      chapters: [{ ...valid.chapters[0], longitude: '-71.6' as unknown as number }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/incomplete/i);
  });

  it('falls back to the dark style when the file carries none', () => {
    store().loadProject({ ...valid, mapStyle: undefined as unknown as 'dark' });
    expect(store().mapStyle).toBe('dark');
  });
});

describe('exportProject', () => {
  it('exports the open project with an ISO timestamp', () => {
    const data = store().exportProject();

    expect(data.chapters).toEqual(store().chapters);
    expect(data.mapStyle).toBe(store().mapStyle);
    expect(() => new Date(data.exportedAt).toISOString()).not.toThrow();
  });
});

describe('capas de datos', () => {
  const layer = layerFixture;

  beforeEach(() => {
    store().resetToDefault();
  });

  it('starts with no layers and every scene showing all of them', () => {
    expect(store().layers).toEqual([]);
    store().addLayer(layer('a'));
    expect(store().layersVisibleIn(store().getSelectedChapter())).toHaveLength(1);
  });

  it('hides a layer in one scene without touching the others', () => {
    store().addLayer(layer('a'));
    store().addLayer(layer('b'));
    const [first, second] = store().chapters;

    store().toggleLayerInChapter(first.id, 'a');

    expect(store().layersVisibleIn(store().chapters[0]).map(l => l.id)).toEqual(['b']);
    expect(store().layersVisibleIn(store().chapters[1]).map(l => l.id)).toEqual(['a', 'b']);
    expect(second.id).toBeDefined();
  });

  it('brings a hidden layer back', () => {
    store().addLayer(layer('a'));
    const [first] = store().chapters;

    store().toggleLayerInChapter(first.id, 'a');
    store().toggleLayerInChapter(first.id, 'a');

    expect(store().isLayerVisibleIn(store().chapters[0], 'a')).toBe(true);
  });

  it('forgets a deleted layer in every scene that had singled it out', () => {
    store().addLayer(layer('a'));
    store().addLayer(layer('b'));
    store().toggleLayerInChapter(store().chapters[0].id, 'a');

    store().removeLayer('a');

    expect(store().layers.map(l => l.id)).toEqual(['b']);
    expect(store().chapters[0].visibleLayerIds).toEqual(['b']);
  });

  it('updates a style without replacing the rest of it', () => {
    store().addLayer(layer('a'));

    store().updateLayerStyle('a', { property: 'poblacion', range: { min: 0, max: 10 } });

    expect(store().layers[0].style).toMatchObject({
      color: '#6366f1',
      opacity: 0.7,
      property: 'poblacion',
    });
  });

  it('carries layers through export and import', () => {
    store().addLayer(layer('a'));
    const exported = store().exportProject();

    store().resetToDefault();
    expect(store().layers).toEqual([]);
    store().loadProject(exported);

    expect(store().layers.map(l => l.id)).toEqual(['a']);
  });

  it('accepts a project exported before layers existed', () => {
    const legacy = { ...store().exportProject() };
    delete (legacy as { layers?: unknown }).layers;

    expect(store().loadProject(legacy).success).toBe(true);
    expect(store().layers).toEqual([]);
  });
});

describe('migrateStoredState', () => {
  // What version 2 actually wrote: the demo, with a flat opening camera.
  const legacyDemo = () =>
    store().chapters.map(ch =>
      ch.id === 'intro' ? { ...ch, zoom: 4, pitch: 0, bearing: 0 } : ch
    );

  it('gives the untouched demo back its 3D camera and satellite style', () => {
    const migrated = migrateStoredState({ chapters: legacyDemo(), mapStyle: 'dark' });

    expect(migrated.mapStyle).toBe('satellite');
    expect(migrated.chapters[0]).toMatchObject({ zoom: 4.4, pitch: 45, bearing: -12 });
  });

  it('keeps a map style the user chose, while still fixing the camera', () => {
    const migrated = migrateStoredState({ chapters: legacyDemo(), mapStyle: 'streets' });

    expect(migrated.mapStyle).toBe('streets');
    expect(migrated.chapters[0].pitch).toBe(45);
  });

  it('leaves the demo alone once a single scene has been edited', () => {
    const edited = legacyDemo();
    edited[0] = { ...edited[0], title: 'Mi propia escena' };

    const migrated = migrateStoredState({ chapters: edited, mapStyle: 'dark' });

    expect(migrated.chapters).toEqual(edited);
    expect(migrated.mapStyle).toBe('dark');
  });

  it('leaves the demo alone once the camera has been moved', () => {
    const moved = legacyDemo();
    moved[1] = { ...moved[1], zoom: 12.5 };

    expect(migrateStoredState({ chapters: moved }).chapters).toEqual(moved);
  });

  it('treats a project with a loaded layer as the user\'s, scenes aside', () => {
    const layers = [layerFixture('ferias')];

    const migrated = migrateStoredState({ chapters: legacyDemo(), mapStyle: 'dark', layers });

    expect(migrated.chapters[0].pitch).toBe(0);
    expect(migrated.mapStyle).toBe('dark');
    expect(migrated.layers).toEqual(layers);
  });

  it('leaves scenes the user created alone', () => {
    store().addChapter();
    const mine = store().chapters;

    expect(migrateStoredState({ chapters: mine, mapStyle: 'streets' }).chapters).toEqual(mine);
  });

  it('leaves a loaded example alone', () => {
    const santiago = EXAMPLES.find(e => e.id === 'santiago')!;

    const migrated = migrateStoredState({
      chapters: santiago.chapters,
      mapStyle: santiago.mapStyle,
    });

    expect(migrated.chapters).toEqual(santiago.chapters);
    expect(migrated.mapStyle).toBe('streets');
  });

  it('backfills layers for sessions stored before they existed', () => {
    expect(migrateStoredState({ chapters: legacyDemo() }).layers).toEqual([]);
  });

  it('runs twice without changing its own result', () => {
    const once = migrateStoredState({ chapters: legacyDemo(), mapStyle: 'dark' });
    expect(migrateStoredState(once)).toEqual(once);
  });

  it('falls back to the demo when there is nothing stored', () => {
    expect(migrateStoredState(undefined).chapters).toEqual(store().chapters);
  });
});
