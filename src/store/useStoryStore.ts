import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { Chapter, DataLayer, EditorMode, CameraState, LayerStyle } from '@/types';
import { INITIAL_CHAPTERS, PREVIOUS_DEMO_CHAPTERS } from '@/data/examples';
import { isMapStyle, MAP_STYLES, type MapStyle } from '@/lib/map-styles';
import { ProjectError, validateChapters, validateLayers } from '@/lib/validate';

export { MAP_STYLES };
export type { MapStyle };

export const VALIDATION = {
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 1000,
  TITLE_MIN_LENGTH: 1,
};

export const PROJECT_VERSION = '1.1.0';

export interface ProjectData {
  chapters: Chapter[];
  mapStyle: MapStyle;
  version: string;
  exportedAt: string;
  /** Optional: projects exported before layers existed do not carry them. */
  layers?: DataLayer[];
  projectName?: string;
}

interface StoryState {
  chapters: Chapter[];
  layers: DataLayer[];
  activeChapterId: string;
  selectedChapterId: string;
  mode: EditorMode;

  isMapLoaded: boolean;
  currentCamera: CameraState;
  mapStyle: MapStyle;

  projectName: string;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;
  /** Set when the browser refused to store the project (usually a full quota). */
  storageError: string | null;
  /** Area the map should frame next, e.g. a layer that was just loaded. */
  pendingBounds: [number, number, number, number] | null;
  setPendingBounds: (bounds: [number, number, number, number] | null) => void;

  setMode: (mode: EditorMode) => void;
  setActiveChapterId: (id: string) => void;
  setSelectedChapterId: (id: string) => void;
  setIsMapLoaded: (loaded: boolean) => void;
  setCurrentCamera: (camera: CameraState) => void;
  setMapStyle: (style: MapStyle) => void;

  addChapter: () => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  captureCurrentView: () => void;

  addLayer: (layer: DataLayer) => void;
  removeLayer: (id: string) => void;
  updateLayerStyle: (id: string, style: Partial<LayerStyle>) => void;
  renameLayer: (id: string, name: string) => void;
  toggleLayerInChapter: (chapterId: string, layerId: string) => void;
  isLayerVisibleIn: (chapter: Chapter, layerId: string) => boolean;
  layersVisibleIn: (chapter: Chapter | undefined) => DataLayer[];

  saveProject: () => void;
  loadProject: (data: ProjectData) => { success: boolean; error?: string };
  exportProject: () => ProjectData;
  resetToDefault: () => void;
  loadExample: (chapters: Chapter[], mapStyle: MapStyle, name: string) => void;
  setProjectName: (name: string) => void;

  getActiveChapter: () => Chapter | undefined;
  getSelectedChapter: () => Chapter | undefined;
}

const getInitialState = () => ({
  chapters: INITIAL_CHAPTERS,
  layers: [] as DataLayer[],
  activeChapterId: INITIAL_CHAPTERS[0].id,
  selectedChapterId: INITIAL_CHAPTERS[0].id,
  mode: 'edit' as EditorMode,
  isMapLoaded: false,
  mapStyle: 'satellite' as MapStyle,
  currentCamera: {
    longitude: INITIAL_CHAPTERS[0].longitude,
    latitude: INITIAL_CHAPTERS[0].latitude,
    zoom: INITIAL_CHAPTERS[0].zoom,
    pitch: INITIAL_CHAPTERS[0].pitch,
    bearing: INITIAL_CHAPTERS[0].bearing,
  },
  projectName: 'La geografía de los extremos',
  lastSaved: null,
  hasUnsavedChanges: false,
  storageError: null as string | null,
  pendingBounds: null as [number, number, number, number] | null,
});

type PersistedSlice = Pick<
  StoryState,
  'chapters' | 'layers' | 'mapStyle' | 'projectName' | 'lastSaved'
>;

/**
 * The demo project exactly as older sessions stored it. Only the opening scene
 * ever changed camera (4/0/0 became 4.4/45/-12), so the rest is still current.
 * This has to stay a literal snapshot of the old shape, not a description of
 * the new one: it is only ever compared against, never rendered.
 */
export const LEGACY_DEMO_CHAPTERS: Chapter[] = PREVIOUS_DEMO_CHAPTERS.map(ch =>
  ch.id === 'intro' ? { ...ch, zoom: 4, pitch: 0, bearing: 0 } : ch
);

/** Style the app opened with before satellite became the default. */
const LEGACY_DEFAULT_STYLE: MapStyle = 'dark';

const sameChapters = (a: Chapter[] | undefined, b: Chapter[]) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Persisted state wins over the defaults in the code, so a session stored
 * before the demo gained satellite and a tilted camera keeps showing the old
 * flat map. Refresh it, but per field and only on an exact match with what the
 * previous version wrote: an id in common is not evidence that a scene is
 * untouched, and someone who picked a map style picked it on purpose.
 */
export function migrateStoredState(persisted: unknown): PersistedSlice {
  const state = (persisted ?? {}) as Partial<PersistedSlice>;
  const fresh = getInitialState();

  // Layers only exist because the user loaded a file, which makes the project
  // theirs no matter what the scenes still look like.
  const noLayers = (state.layers ?? []).length === 0;
  const isLegacyDemo = noLayers && sameChapters(state.chapters, LEGACY_DEMO_CHAPTERS);
  // Version 4 sessions hold the demo with its 3D camera and the old copy.
  const isPreviousDemo = noLayers && sameChapters(state.chapters, PREVIOUS_DEMO_CHAPTERS);

  return {
    ...fresh,
    ...state,
    chapters: isLegacyDemo || isPreviousDemo ? fresh.chapters : state.chapters ?? fresh.chapters,
    projectName:
      (isLegacyDemo || isPreviousDemo) && state.projectName === 'La geografía de los extremos'
        ? fresh.projectName
        : state.projectName ?? fresh.projectName,
    // Only on the untouched demo, and only if the style is the one it shipped
    // with. Picking dark on your own project has to survive.
    mapStyle:
      isLegacyDemo && state.mapStyle === LEGACY_DEFAULT_STYLE
        ? fresh.mapStyle
        : state.mapStyle ?? fresh.mapStyle,
    // Sessions stored before layers existed rehydrate without the field, which
    // would leave `layers` undefined and crash every consumer.
    layers: state.layers ?? [],
  };
}

/**
 * localStorage holds about 5 MB. A large GeoJSON layer can pass that, and the
 * browser then throws on every write, which zustand does not catch: the
 * project silently stopped being kept. The failure is surfaced instead.
 */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
      if (useStoryStore.getState().storageError) useStoryStore.setState({ storageError: null });
    } catch {
      if (!useStoryStore.getState().storageError) {
        useStoryStore.setState({
          storageError:
            'El navegador no tiene espacio para guardar este proyecto. Exporta el JSON para no perderlo.',
        });
      }
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Nothing to recover: the item was already unreachable.
    }
  },
};

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setMode: (mode) => set({ mode }),
      setActiveChapterId: (id) => set({ activeChapterId: id }),
      setSelectedChapterId: (id) => set({ selectedChapterId: id }),
      setIsMapLoaded: (loaded) => set({ isMapLoaded: loaded }),
      setPendingBounds: (bounds) => set({ pendingBounds: bounds }),
      setCurrentCamera: (camera) => set({ currentCamera: camera }),
      setMapStyle: (style) => set({ mapStyle: style, hasUnsavedChanges: true }),

      addChapter: () => {
        const { chapters, selectedChapterId } = get();
        const currentChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];
        const newId = `chapter-${Date.now()}`;

        // Offset a little from the selected scene so the new marker does not
        // sit exactly on top of the old one, and keep its framing and layers.
        const newChapter: Chapter = {
          id: newId,
          title: `Escena ${chapters.length + 1}`,
          content: '',
          longitude: currentChapter.longitude + 0.5,
          latitude: currentChapter.latitude + 0.5,
          zoom: currentChapter.zoom,
          pitch: currentChapter.pitch,
          bearing: currentChapter.bearing,
          visibleLayerIds: currentChapter.visibleLayerIds,
        };

        set({
          chapters: [...chapters, newChapter],
          selectedChapterId: newId,
          hasUnsavedChanges: true
        });
      },

      updateChapter: (id, updates) => {
        set(state => ({
          chapters: state.chapters.map(ch =>
            ch.id === id ? { ...ch, ...updates } : ch
          ),
          hasUnsavedChanges: true
        }));
      },

      deleteChapter: (id) => {
        const { chapters, selectedChapterId } = get();
        if (chapters.length <= 1) return;

        const filtered = chapters.filter(ch => ch.id !== id);
        set({
          chapters: filtered,
          selectedChapterId: selectedChapterId === id ? filtered[0].id : selectedChapterId,
          hasUnsavedChanges: true
        });
      },

      reorderChapters: (chapters) => set({ chapters, hasUnsavedChanges: true }),

      captureCurrentView: () => {
        const { currentCamera, selectedChapterId } = get();
        set(state => ({
          chapters: state.chapters.map(ch =>
            ch.id === selectedChapterId
              ? { ...ch, ...currentCamera }
              : ch
          ),
          hasUnsavedChanges: true
        }));
      },

      addLayer: (layer) => {
        set(state => ({ layers: [...state.layers, layer], hasUnsavedChanges: true }));
      },

      removeLayer: (id) => {
        set(state => ({
          layers: state.layers.filter(l => l.id !== id),
          // Drop the id from every scene, otherwise a deleted layer keeps
          // narrowing which layers a scene shows.
          chapters: state.chapters.map(ch =>
            ch.visibleLayerIds
              ? { ...ch, visibleLayerIds: ch.visibleLayerIds.filter(l => l !== id) }
              : ch
          ),
          hasUnsavedChanges: true,
        }));
      },

      updateLayerStyle: (id, style) => {
        set(state => ({
          layers: state.layers.map(l =>
            l.id === id ? { ...l, style: { ...l.style, ...style } } : l
          ),
          hasUnsavedChanges: true,
        }));
      },

      renameLayer: (id, name) => {
        set(state => ({
          layers: state.layers.map(l => (l.id === id ? { ...l, name } : l)),
          hasUnsavedChanges: true,
        }));
      },

      toggleLayerInChapter: (chapterId, layerId) => {
        const { layers } = get();
        set(state => ({
          chapters: state.chapters.map(ch => {
            if (ch.id !== chapterId) return ch;
            // Undefined means "all visible", so the first toggle has to start
            // from the full list and remove one, not from an empty list.
            const current = ch.visibleLayerIds ?? layers.map(l => l.id);
            const next = current.includes(layerId)
              ? current.filter(id => id !== layerId)
              : [...current, layerId];
            return { ...ch, visibleLayerIds: next };
          }),
          hasUnsavedChanges: true,
        }));
      },

      isLayerVisibleIn: (chapter, layerId) =>
        chapter.visibleLayerIds === undefined || chapter.visibleLayerIds.includes(layerId),

      layersVisibleIn: (chapter) => {
        const { layers } = get();
        if (!chapter) return [];
        if (chapter.visibleLayerIds === undefined) return layers;
        return layers.filter(l => chapter.visibleLayerIds!.includes(l.id));
      },

      saveProject: () => {
        const timestamp = new Date().toISOString();
        set({ lastSaved: timestamp, hasUnsavedChanges: false });
      },

      loadProject: (data: ProjectData) => {
        try {
          const chapters = validateChapters(data?.chapters);
          const layers = validateLayers(data?.layers);
          set({
            chapters,
            layers,
            mapStyle: isMapStyle(data.mapStyle) ? data.mapStyle : 'dark',
            projectName:
              typeof data.projectName === 'string' && data.projectName.trim()
                ? data.projectName.slice(0, VALIDATION.TITLE_MAX_LENGTH)
                : 'Historia sin título',
            selectedChapterId: chapters[0].id,
            activeChapterId: chapters[0].id,
            mode: 'edit',
            hasUnsavedChanges: false,
            lastSaved: new Date().toISOString(),
          });

          return { success: true };
        } catch (err) {
          return {
            success: false,
            error: err instanceof ProjectError ? err.message : 'No se pudo leer el proyecto.',
          };
        }
      },

      exportProject: () => {
        const { chapters, mapStyle, layers, projectName } = get();
        return {
          chapters,
          layers,
          projectName,
          mapStyle,
          version: PROJECT_VERSION,
          exportedAt: new Date().toISOString(),
        };
      },

      resetToDefault: () => {
        set({
          ...getInitialState(),
          isMapLoaded: get().isMapLoaded,
        });
      },

      loadExample: (chapters, mapStyle, name) => {
        set({
          chapters,
          layers: [],
          mapStyle,
          projectName: name,
          selectedChapterId: chapters[0].id,
          activeChapterId: chapters[0].id,
          mode: 'edit',
          hasUnsavedChanges: false,
          lastSaved: null,
        });
      },

      setProjectName: (name) => set({ projectName: name, hasUnsavedChanges: true }),

      getActiveChapter: () => {
        const { chapters, activeChapterId } = get();
        return chapters.find(c => c.id === activeChapterId);
      },

      getSelectedChapter: () => {
        const { chapters, selectedChapterId } = get();
        return chapters.find(c => c.id === selectedChapterId);
      },
    }),
    {
      name: 'geonarrator-storage',
      storage: createJSONStorage(() => safeStorage),
      // 4 rather than 3: version 3 shipped with a migration that matched on
      // scene ids and wiped edits made to the demo. Comparing whole scenes is
      // idempotent, so re-running it over an already migrated session is safe.
      // 5: the demo copy was rewritten; untouched demos pick up the new text.
      version: 5,
      partialize: (state) => ({
        chapters: state.chapters,
        layers: state.layers,
        mapStyle: state.mapStyle,
        projectName: state.projectName,
        lastSaved: state.lastSaved,
      }),
      migrate: migrateStoredState,
    }
  )
);
