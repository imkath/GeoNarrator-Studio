'use client';

import { useStoryStore, MAP_STYLES, VALIDATION } from '@/store/useStoryStore';
import ChapterList from './ChapterList';
import LocationSearch from './LocationSearch';
import CameraControls from './CameraControls';
import LayerPanel from './LayerPanel';
import { Section, fieldClass } from './fields';

export default function Sidebar() {
  const { chapters, selectedChapterId, mapStyle, projectName, updateChapter, setMapStyle, setProjectName } =
    useStoryStore();

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId) ?? chapters[0];
  const selectedIndex = chapters.indexOf(selectedChapter);
  if (!selectedChapter) return null;

  const titleLength = selectedChapter.title.length;
  const contentLength = selectedChapter.content.length;
  const isTitleEmpty = selectedChapter.title.trim().length === 0;
  const contentNearLimit = contentLength > VALIDATION.CONTENT_MAX_LENGTH * 0.9;

  return (
    <aside
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-paper md:border-r md:border-ink"
      aria-label="Editor de la historia"
    >
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-rule">
        <label htmlFor="project-name" className="block font-mono text-[11px] text-ink-3 mb-1">
          Nombre de la historia
        </label>
        {/* The story needs a name of its own: without this the export kept
            the name of whatever example it started from. */}
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value.slice(0, VALIDATION.TITLE_MAX_LENGTH))}
          placeholder="Historia sin título"
          className="w-full bg-transparent text-xl font-extrabold leading-tight tracking-[-0.01em] placeholder:text-ink-3 rounded-[2px] -mx-1 px-1 py-0.5 border border-transparent hover:border-rule focus:border-water focus:outline-none"
        />
      </div>

      <Section
        title="Escenas"
        aside={<span className="font-mono text-[11px] text-ink-3">{chapters.length} en total</span>}
      >
        <ChapterList />
      </Section>

      <Section
        title={`Escena ${selectedIndex + 1}`}
        aside={<span className="text-[12px] text-ink-3">lo que se lee y dónde mira</span>}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor="scene-title" className="text-[13px] font-semibold text-ink-2">
                Título
              </label>
              <span className="font-mono text-[11px] text-ink-3">
                {titleLength}/{VALIDATION.TITLE_MAX_LENGTH}
              </span>
            </div>
            <input
              id="scene-title"
              type="text"
              value={selectedChapter.title}
              maxLength={VALIDATION.TITLE_MAX_LENGTH}
              onChange={(e) => updateChapter(selectedChapter.id, { title: e.target.value })}
              className={`${fieldClass} ${isTitleEmpty ? '!border-caution' : ''}`}
              placeholder="Por ejemplo, El Desierto de Atacama"
              aria-invalid={isTitleEmpty}
              aria-describedby={isTitleEmpty ? 'title-error' : undefined}
            />
            {isTitleEmpty && (
              <p id="title-error" className="text-[12px] text-caution mt-1">
                Sin título, la escena aparece como “Sin título” en la historia.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label htmlFor="scene-narrative" className="text-[13px] font-semibold text-ink-2">
                Texto
              </label>
              <span className={`font-mono text-[11px] ${contentNearLimit ? 'text-caution' : 'text-ink-3'}`}>
                {contentLength}/{VALIDATION.CONTENT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="scene-narrative"
              value={selectedChapter.content}
              maxLength={VALIDATION.CONTENT_MAX_LENGTH}
              onChange={(e) => updateChapter(selectedChapter.id, { content: e.target.value })}
              className={`${fieldClass} h-32 resize-y leading-relaxed`}
              placeholder="Lo que se lee mientras el mapa muestra este lugar."
            />
          </div>

          {/* Keyed by scene: the box holds what was searched for this scene,
              and switching scenes starts it empty. */}
          <LocationSearch key={selectedChapter.id} />
        </div>
      </Section>

      <Section title="Cámara" aside={<span className="text-[12px] text-ink-3">de esta escena</span>}>
        <CameraControls />
      </Section>

      <Section title="Capas de datos" aside={<span className="text-[12px] text-ink-3">GeoJSON propio</span>}>
        <LayerPanel />
      </Section>

      <Section title="Estilo del mapa" aside={<span className="text-[12px] text-ink-3">para toda la historia</span>}>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-3 gap-1.5" role="radiogroup" aria-label="Estilo del mapa">
          {MAP_STYLES.map((style) => {
            const on = mapStyle === style.id;
            return (
              <button
                key={style.id}
                role="radio"
                aria-checked={on}
                onClick={() => setMapStyle(style.id)}
                className={`px-2 py-2 rounded-[2px] border text-[13px] font-semibold transition-colors ${
                  on ? 'border-water bg-water-tint text-water' : 'border-rule text-ink-2 hover:border-ink-3 hover:text-ink'
                }`}
              >
                {style.name}
              </button>
            );
          })}
        </div>
      </Section>

      <p className="px-4 sm:px-5 py-5 text-[12px] text-ink-3 leading-relaxed">
        Todo se guarda solo en este navegador. Para llevar la historia a otro equipo, expórtala como JSON desde
        el menú de arriba.
      </p>
    </aside>
  );
}
