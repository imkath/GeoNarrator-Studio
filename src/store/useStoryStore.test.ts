import { beforeEach, describe, expect, it } from 'vitest';
import { useStoryStore, type ProjectData } from './useStoryStore';

const store = () => useStoryStore.getState();

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
