import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chapter, EditorMode, CameraState } from '@/types';

export type MapStyle = 'dark' | 'satellite' | 'streets' | 'outdoors' | 'light';

export const MAP_STYLES: { id: MapStyle; name: string; url: string }[] = [
  { id: 'dark', name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'outdoors', name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { id: 'light', name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
];

// Validation constants
export const VALIDATION = {
  TITLE_MAX_LENGTH: 100,
  CONTENT_MAX_LENGTH: 1000,
  TITLE_MIN_LENGTH: 1,
};

export interface ProjectData {
  chapters: Chapter[];
  mapStyle: MapStyle;
  version: string;
  exportedAt: string;
}

interface StoryState {
  // Data
  chapters: Chapter[];
  activeChapterId: string;
  selectedChapterId: string;
  mode: EditorMode;

  // Map state
  isMapLoaded: boolean;
  currentCamera: CameraState;
  mapStyle: MapStyle;

  // Project metadata
  projectName: string;
  lastSaved: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  setMode: (mode: EditorMode) => void;
  setActiveChapterId: (id: string) => void;
  setSelectedChapterId: (id: string) => void;
  setIsMapLoaded: (loaded: boolean) => void;
  setCurrentCamera: (camera: CameraState) => void;
  setMapStyle: (style: MapStyle) => void;

  // Chapter CRUD
  addChapter: () => void;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  reorderChapters: (chapters: Chapter[]) => void;
  captureCurrentView: () => void;

  // Project management
  saveProject: () => void;
  loadProject: (data: ProjectData) => { success: boolean; error?: string };
  exportProject: () => ProjectData;
  resetToDefault: () => void;
  setProjectName: (name: string) => void;

  // Computed
  getActiveChapter: () => Chapter | undefined;
  getSelectedChapter: () => Chapter | undefined;
}

const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    title: 'La Geografía de los Extremos',
    content: 'Chile es una larga y angosta faja de tierra. Vista desde el espacio, parece un borde delgado entre la cordillera y el mar. Esta herramienta permite narrar su geografía sin escribir una sola línea de código.',
    longitude: -70.6693,
    latitude: -33.4489,
    zoom: 4,
    pitch: 0,
    bearing: 0
  },
  {
    id: 'atacama',
    title: 'El Desierto de Atacama',
    content: 'Al norte, el desierto más árido del mundo. Aquí usamos una inclinación de cámara (pitch) para apreciar la vastedad de la planicie desértica y la ausencia total de vegetación.',
    longitude: -68.5,
    latitude: -23.5,
    zoom: 8.5,
    pitch: 60,
    bearing: -20
  },
  {
    id: 'torres',
    title: 'Torres del Paine',
    content: 'En el sur profundo, el granito se eleva verticalmente. La rotación de la cámara nos permite enfrentar las torres directamente, simulando un vuelo de dron sobre el parque nacional.',
    longitude: -72.9,
    latitude: -50.9423,
    zoom: 10,
    pitch: 75,
    bearing: 45
  }
];

const getInitialState = () => ({
  chapters: INITIAL_CHAPTERS,
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
  projectName: 'Untitled Project',
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
          bearing: currentChapter.bearing
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

      saveProject: () => {
        const timestamp = new Date().toISOString();
        set({ lastSaved: timestamp, hasUnsavedChanges: false });
      },

      loadProject: (data: ProjectData) => {
        try {
          // Validate data structure
          if (!data.chapters || !Array.isArray(data.chapters) || data.chapters.length === 0) {
            return { success: false, error: 'Invalid project: no chapters found' };
          }

          // Validate each chapter has required fields
          for (const chapter of data.chapters) {
            if (!chapter.id || !chapter.title ||
                typeof chapter.longitude !== 'number' ||
                typeof chapter.latitude !== 'number') {
              return { success: false, error: 'Invalid project: chapter data is incomplete' };
            }
          }

          set({
            chapters: data.chapters,
            mapStyle: data.mapStyle || 'dark',
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
        const { chapters, mapStyle } = get();
        return {
          chapters,
          mapStyle,
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
        };
      },

      resetToDefault: () => {
        set({
          ...getInitialState(),
          isMapLoaded: get().isMapLoaded, // Keep map loaded state
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
      partialize: (state) => ({
        chapters: state.chapters,
        mapStyle: state.mapStyle,
        projectName: state.projectName,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
