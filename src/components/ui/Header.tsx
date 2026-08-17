'use client';

import { useEffect, useState } from 'react';
import { useStoryStore, ProjectData } from '@/store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  MonitorPlay,
  Save,
  Download,
  Upload,
  Check,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  X,
  Menu,
  Code2,
} from 'lucide-react';
import Logo from './Logo';
import { EmbedModal, ImportHelpModal, ResetConfirmModal } from './HeaderModals';
import { encodeStory } from '@/lib/story-codec';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Dialog = 'import-help' | 'reset' | 'embed' | null;

const IMPORT_INPUT_ID = 'import-project-file';

export default function Header() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const {
    mode,
    setMode,
    chapters,
    mapStyle,
    setActiveChapterId,
    hasUnsavedChanges,
    lastSaved,
    saveProject,
    loadProject,
    exportProject,
    resetToDefault,
  } = useStoryStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMobileMenu(false);
        setDialog(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const handleSave = () => {
    saveProject();
    showToast('Project saved', 'success');
  };

  const handleExport = () => {
    const data = exportProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geonarrator-${data.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Project exported', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        const result = loadProject(data);
        showToast(
          result.success ? 'Project loaded' : result.error ?? 'Could not load project',
          result.success ? 'success' : 'error'
        );
      } catch {
        showToast('Invalid JSON file. Check the format with the ? icon.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `${origin}/embed?data=${encodeStory({ chapters, mapStyle })}`;
  const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px;"
  allowfullscreen
></iframe>`;

  // A fixed time rather than "5m ago": relative labels read the clock during
  // render and then sit frozen until something else triggers a re-render.
  const formatLastSaved = (isoString: string | null) => {
    if (!isoString) return 'Never saved';
    const date = new Date(isoString);
    return `Saved ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const actions = [
    { label: 'Export', icon: Download, run: handleExport },
    { label: 'Embed', icon: Code2, run: () => setDialog('embed') },
    { label: 'Reset', icon: RotateCcw, run: () => setDialog('reset') },
  ];

  return (
    <>
      {/* One input for desktop and mobile, opened through a label. Two inputs
          sharing a single ref meant the desktop button opened the mobile one. */}
      <input
        id={IMPORT_INPUT_ID}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="sr-only"
      />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 sm:px-6 z-50 fixed top-0 w-full"
        role="banner"
      >
        <Logo />

        <div className="absolute left-1/2 -translate-x-1/2">
          <nav className="flex bg-white/5 rounded-xl p-1 border border-white/5" role="tablist" aria-label="Editor mode">
            {(
              [
                { value: 'edit', label: 'EDITOR', short: 'EDIT', icon: Edit3 },
                { value: 'preview', label: 'PREVIEW', short: 'PREVIEW', icon: MonitorPlay },
              ] as const
            ).map(({ value, label, short, icon: Icon }) => (
              <motion.button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => {
                  setMode(value);
                  if (value === 'preview') setActiveChapterId(chapters[0].id);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  mode === value ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === value && (
                  <motion.div
                    layoutId="mode-bg"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    initial={false}
                    transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                  />
                )}
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10" aria-hidden="true" />
                <span className="relative z-10 hidden sm:inline">{label}</span>
                <span className="relative z-10 sm:hidden">{short}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center">
            <label
              htmlFor={IMPORT_INPUT_ID}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Import</span>
            </label>
            <button
              onClick={() => setDialog('import-help')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
              aria-label="Show import format help"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {actions.map(({ label, icon: Icon, run }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={run}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              aria-label={label}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {label !== 'Reset' && <span>{label}</span>}
            </motion.button>
          ))}

          <div className="h-6 w-px bg-white/10 mx-2" aria-hidden="true" />

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                hasUnsavedChanges ? 'bg-amber-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'
              }`}
              aria-label={hasUnsavedChanges ? 'Save unsaved changes' : 'Project saved'}
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{hasUnsavedChanges ? 'Save' : 'Saved'}</span>
            </motion.button>
            {!hasUnsavedChanges && lastSaved && (
              <span className="text-[10px] text-slate-500">{formatLastSaved(lastSaved)}</span>
            )}
          </div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`p-2 rounded-lg ${hasUnsavedChanges ? 'bg-amber-500 text-white' : 'bg-white/10 text-white'}`}
            aria-label={hasUnsavedChanges ? 'Save unsaved changes' : 'Project saved'}
          >
            <Save className="w-4 h-4" aria-hidden="true" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white"
            aria-label="Open menu"
            aria-expanded={showMobileMenu}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 md:hidden"
            onClick={() => setShowMobileMenu(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900 border-l border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="p-4 border-b border-white/10">
                {hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    Unsaved changes
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm">{formatLastSaved(lastSaved)}</div>
                )}
              </div>

              <div className="p-2 space-y-1">
                <label
                  htmlFor={IMPORT_INPUT_ID}
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left cursor-pointer"
                >
                  <Upload className="w-5 h-5" aria-hidden="true" />
                  <span>Import</span>
                </label>

                {actions.map(({ label, icon: Icon, run }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setShowMobileMenu(false);
                      run();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setDialog('import-help');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Import format help</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-20 right-6 z-100 flex flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : toast.type === 'error'
                    ? 'bg-red-500/20 border-red-500/30 text-red-300'
                    : 'bg-slate-800/80 border-white/10 text-slate-300'
              }`}
            >
              {toast.type === 'success' && <Check className="w-4 h-4" aria-hidden="true" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" aria-hidden="true" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {dialog === 'import-help' && (
          <ImportHelpModal onClose={() => setDialog(null)} onDownloadExample={handleExport} />
        )}
        {dialog === 'reset' && (
          <ResetConfirmModal
            onClose={() => setDialog(null)}
            onConfirm={() => {
              resetToDefault();
              setDialog(null);
              showToast('Project reset to default', 'info');
            }}
          />
        )}
        {dialog === 'embed' && (
          <EmbedModal
            onClose={() => setDialog(null)}
            sceneCount={chapters.length}
            embedUrl={embedUrl}
            embedCode={embedCode}
          />
        )}
      </AnimatePresence>
    </>
  );
}
