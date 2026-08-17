import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chapter, DataLayer, EditorMode, CameraState, LayerStyle } from '@/types';
import { INITIAL_CHAPTERS } from '@/data/examples';

export type MapStyle = 'dark' | 'satellite' | 'streets' | 'outdoors' | 'light';

export const MAP_STYLES: { id: MapStyle; name: string; url: string }[] = [
  { id: 'dark', name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'outdoors', name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'light', name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
];

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
  mapStyle: 'dark' as MapStyle,
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
});

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      setMode: (mode) => set({ mode }),
      setActiveChapterId: (id) => set({ activeChapterId: id }),
      setSelectedChapterId: (id) => set({ selectedChapterId: id }),
      setIsMapLoaded: (loaded) => set({ isMapLoaded: loaded }),
      setCurrentCamera: (camera) => set({ currentCamera: camera }),
      setMapStyle: (style) => set({ mapStyle: style, hasUnsavedChanges: true }),

      addChapter: () => {
        const { chapters, selectedChapterId } = get();
        const currentChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];
        const newId = `chapter-${Date.now()}`;

        const newChapter: Chapter = {
          id: newId,
          title: 'New Scene',
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
          if (!data.chapters || !Array.isArray(data.chapters) || data.chapters.length === 0) {
            return { success: false, error: 'Invalid project: no chapters found' };
          }

          for (const chapter of data.chapters) {
            if (!chapter.id || !chapter.title ||
                typeof chapter.longitude !== 'number' ||
                typeof chapter.latitude !== 'number') {
              return { success: false, error: 'Invalid project: chapter data is incomplete' };
            }
          }

          set({
            chapters: data.chapters,
            layers: Array.isArray(data.layers) ? data.layers : [],
            mapStyle: data.mapStyle || 'dark',
            projectName: data.projectName || 'Untitled Project',
            selectedChapterId: data.chapters[0].id,
            activeChapterId: data.chapters[0].id,
            hasUnsavedChanges: false,
            lastSaved: new Date().toISOString(),
          });

          return { success: true };
        } catch {
          return { success: false, error: 'Failed to parse project data' };
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
      version: 2,
      partialize: (state) => ({
        chapters: state.chapters,
        layers: state.layers,
        mapStyle: state.mapStyle,
        projectName: state.projectName,
        lastSaved: state.lastSaved,
      }),
      // Sessions stored before layers existed rehydrate without the field,
      // which would leave `layers` undefined and crash every consumer.
      migrate: (persisted) => ({
        ...(persisted as object),
        layers: (persisted as { layers?: DataLayer[] }).layers ?? [],
      }),
    }
  )
);
