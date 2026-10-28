'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStoryStore, ProjectData } from '@/store/useStoryStore';
import { Download, Upload, RotateCcw, CircleHelp, X, Menu, Code2, BookOpen } from 'lucide-react';
import Logo from './Logo';
import { EmbedModal, ImportHelpModal, ResetConfirmModal } from './HeaderModals';
import ExamplesModal from './ExamplesModal';
import { buildEmbed } from '@/lib/story-codec';

type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Dialog = 'import-help' | 'reset' | 'embed' | 'examples' | null;

const IMPORT_INPUT_ID = 'import-project-file';
let toastSeq = 0;

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

export default function Header() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const {
    mode,
    setMode,
    chapters,
    mapStyle,
    layers,
    projectName,
    storageError,
    setActiveChapterId,
    loadProject,
    exportProject,
    resetToDefault,
    loadExample,
  } = useStoryStore();

  useEffect(() => {
    if (!showMobileMenu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowMobileMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showMobileMenu]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3000);
  }, []);

  useEffect(() => {
    if (storageError) showToast(storageError, 'error');
  }, [storageError, showToast]);

  const handleExport = () => {
    const data = exportProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Named after the story, so a folder of exports is readable.
    a.download = `${slugify(data.projectName ?? '') || 'geonarrator'}-${data.exportedAt.slice(0, 10)}.json`;
    a.click();
    // Revoking in the same tick cancelled the download in Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Proyecto exportado');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => showToast('No se pudo leer el archivo.', 'error');
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        const result = loadProject(data);
        showToast(
          result.success ? 'Proyecto cargado' : result.error ?? 'No se pudo cargar el proyecto.',
          result.success ? 'success' : 'error'
        );
      } catch {
        showToast('El archivo no es un JSON válido. El formato está en la ayuda de importar.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedBase = `${origin}/embed?data=`;
  const embed =
    dialog === 'embed' ? buildEmbed({ chapters, mapStyle, layers, name: projectName }, embedBase.length) : null;
  const embedUrl = embed ? `${embedBase}${embed.encoded}` : '';
  const embedCode = `<iframe
  src="${embedUrl}"
  title="${(projectName || 'Historia sobre un mapa').replace(/"/g, '&quot;')}"
  width="100%"
  height="600"
  style="border: 0"
  loading="lazy"
  allowfullscreen
></iframe>`;

  const actions = [
    { label: 'Ejemplos', icon: BookOpen, run: () => setDialog('examples') },
    { label: 'Exportar', icon: Download, run: handleExport },
    { label: 'Incrustar', icon: Code2, run: () => setDialog('embed') },
  ];

  const ghost =
    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] text-[13px] font-semibold text-ink-2 hover:text-ink hover:bg-paper-2';

  return (
    <>
      {/* One input for desktop and mobile, opened through a label. */}
      <input
        id={IMPORT_INPUT_ID}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
      />

      <header className="h-14 bg-paper border-b border-ink grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-5 z-50 fixed top-0 w-full">
        <Logo compact />

        <div className="flex justify-center min-w-0">
          <div className="flex border border-ink rounded-[2px] overflow-hidden" role="tablist" aria-label="Modo">
            {(
              [
                { value: 'edit', label: 'Editar' },
                { value: 'preview', label: 'Vista previa' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  if (value === 'preview') setActiveChapterId(chapters[0].id);
                  setMode(value);
                }}
                className={`px-3 sm:px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                  mode === value ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-2'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Acciones del proyecto">
          <span className="hidden xl:inline text-[12px] text-ink-3 mr-2">Se guarda en este navegador</span>
          {actions.map(({ label, icon: Icon, run }) => (
            <button key={label} onClick={run} className={ghost} title={label}>
              <Icon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden lg:inline">{label}</span>
              <span className="sr-only lg:hidden">{label}</span>
            </button>
          ))}
          <label htmlFor={IMPORT_INPUT_ID} className={ghost} title="Importar un proyecto JSON">
            <Upload className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden lg:inline">Importar</span>
            <span className="sr-only lg:hidden">Importar</span>
          </label>
          <button onClick={() => setDialog('import-help')} className={ghost} aria-label="Formato para importar">
            <CircleHelp className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <span className="w-px h-5 bg-rule mx-1" aria-hidden="true" />
          <button onClick={() => setDialog('reset')} className={ghost} title="Volver al ejemplo">
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="sr-only">Volver al ejemplo</span>
          </button>
        </nav>

        <button
          onClick={() => setShowMobileMenu(true)}
          className="md:hidden p-2 -mr-1 rounded-[2px] text-ink hover:bg-paper-2"
          aria-label="Abrir el menú"
          aria-expanded={showMobileMenu}
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>

      {showMobileMenu && (
        <div className="fixed inset-0 bg-ink/40 z-100 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-paper border-l border-ink flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-rule">
              <span className="font-extrabold">Proyecto</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 -mr-2 rounded-[2px] text-ink-2 hover:text-ink"
                aria-label="Cerrar el menú"
                autoFocus
              >
                <X className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <div className="p-2 flex flex-col">
              {actions.map(({ label, icon: Icon, run }) => (
                <button
                  key={label}
                  onClick={() => {
                    setShowMobileMenu(false);
                    run();
                  }}
                  className="flex items-center gap-3 px-3 py-3 rounded-[2px] text-left hover:bg-paper-2"
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </button>
              ))}
              <label
                htmlFor={IMPORT_INPUT_ID}
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-[2px] hover:bg-paper-2"
              >
                <Upload className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                Importar
              </label>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setDialog('import-help');
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-[2px] text-left hover:bg-paper-2"
              >
                <CircleHelp className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                Formato para importar
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setDialog('reset');
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-[2px] text-left text-danger hover:bg-danger-tint"
              >
                <RotateCcw className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                Volver al ejemplo
              </button>
            </div>
            <p className="mt-auto p-4 text-[12px] text-ink-3 border-t border-rule">
              El proyecto se guarda solo en este navegador. Exporta el JSON para llevarlo a otro lado.
            </p>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-110 flex flex-col items-center gap-2 w-[min(92vw,420px)] pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className={`w-full text-center px-4 py-2.5 rounded-[2px] text-sm font-semibold animate-[fade_150ms_ease-out] ${
              toast.type === 'error' ? 'bg-danger text-paper' : 'bg-ink text-paper'
            }`}
          >
            {toast.message}
          </p>
        ))}
      </div>

      {dialog === 'import-help' && (
        <ImportHelpModal onClose={() => setDialog(null)} onDownloadExample={handleExport} />
      )}
      {dialog === 'reset' && (
        <ResetConfirmModal
          onClose={() => setDialog(null)}
          onConfirm={() => {
            resetToDefault();
            setDialog(null);
            showToast('Volviste al proyecto de ejemplo');
          }}
        />
      )}
      {dialog === 'examples' && (
        <ExamplesModal
          onClose={() => setDialog(null)}
          onPick={(example) => {
            loadExample(example.chapters, example.mapStyle, example.name);
            showToast(`Cargado: ${example.name}`);
          }}
        />
      )}
      {dialog === 'embed' && embed && (
        <EmbedModal
          onClose={() => setDialog(null)}
          sceneCount={chapters.length}
          embedUrl={embedUrl}
          embedCode={embedCode}
          droppedLayers={embed.droppedLayers.map((l) => l.name)}
        />
      )}
    </>
  );
}
