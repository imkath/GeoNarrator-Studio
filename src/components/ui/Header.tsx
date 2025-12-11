'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
  AlertTriangle,
  RotateCcw,
  HelpCircle,
  FileJson,
  X,
  Menu,
  Code2,
  Copy
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export default function Header() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMobileMenu(false);
        setShowImportHelp(false);
        setShowResetConfirm(false);
        setShowEmbedModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleSave = () => {
    saveProject();
    showToast('Project saved successfully', 'success');
  };

  const handleExport = () => {
    const data = exportProject();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geonarrator-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Project exported', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        const result = loadProject(data);
        if (result.success) {
          showToast('Project loaded successfully', 'success');
        } else {
          showToast(result.error || 'Failed to load project', 'error');
        }
      } catch {
        showToast('Invalid JSON file. Click the ? icon for format help.', 'error');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetToDefault();
    setShowResetConfirm(false);
    showToast('Project reset to default', 'info');
  };

  const generateEmbedUrl = () => {
    const embedData = {
      chapters,
      mapStyle,
    };
    const encoded = btoa(JSON.stringify(embedData));
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://geonarrator.studio';
    return `${baseUrl}/embed?data=${encoded}`;
  };

  const getEmbedCode = () => {
    const url = generateEmbedUrl();
    return `<iframe
  src="${url}"
  width="100%"
  height="600"
  style="border: none; border-radius: 12px;"
  allowfullscreen
></iframe>`;
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
      showToast('Embed code copied!', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const formatLastSaved = (isoString: string | null) => {
    if (!isoString) return 'Never saved';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-3 sm:px-6 z-50 fixed top-0 w-full"
        role="banner"
      >
        {/* Logo - Premium Awwwards Style */}
        <Link href="/">
        <motion.div
          className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
          whileHover="hover"
          initial="initial"
        >
          {/* Logo Mark - Custom 3D Globe Icon */}
          <div className="relative">
            {/* Animated glow ring */}
            <motion.div
              className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
                filter: 'blur(12px)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            />

            {/* Logo container with gradient border */}
            <motion.div
              className="relative"
              variants={{
                initial: { scale: 1 },
                hover: { scale: 1.08 }
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {/* Gradient border */}
              <div
                className="absolute -inset-[1px] rounded-xl opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                }}
                aria-hidden="true"
              />

              {/* Inner container */}
              <div className="relative bg-slate-950 p-2.5 sm:p-3 rounded-xl">
                {/* Custom Globe SVG with animation */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  variants={{
                    initial: { rotate: 0 },
                    hover: { rotate: 15 }
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  {/* Globe base */}
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="url(#globeGradient)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  {/* Horizontal line */}
                  <motion.ellipse
                    cx="12"
                    cy="12"
                    rx="10"
                    ry="4"
                    stroke="url(#globeGradient)"
                    strokeWidth="1.5"
                    fill="none"
                    variants={{
                      initial: { ry: 4 },
                      hover: { ry: 5 }
                    }}
                  />
                  {/* Vertical arc */}
                  <motion.path
                    d="M12 2C14.5 2 16.5 6.5 16.5 12C16.5 17.5 14.5 22 12 22C9.5 22 7.5 17.5 7.5 12C7.5 6.5 9.5 2 12 2Z"
                    stroke="url(#globeGradient)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  {/* Location pin */}
                  <motion.g
                    variants={{
                      initial: { y: 0, scale: 1 },
                      hover: { y: -1, scale: 1.1 }
                    }}
                  >
                    <circle cx="15" cy="8" r="2" fill="#f472b6" />
                    <circle cx="15" cy="8" r="1" fill="white" />
                  </motion.g>
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="50%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                </motion.svg>
              </div>
            </motion.div>
          </div>

          {/* Text Logo */}
          <div className="flex flex-col">
            <h1 className="flex items-center">
              {/* Mobile: Stylized Compact */}
              <span className="sm:hidden relative">
                <span
                  className="font-black text-lg tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #e2e8f0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  GN
                </span>
              </span>

              {/* Desktop: Full with gradient */}
              <span className="hidden sm:flex items-baseline gap-0.5">
                <motion.span
                  className="font-black text-xl tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, #f8fafc 50%, #cbd5e1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  variants={{
                    initial: { y: 0 },
                    hover: { y: -2 }
                  }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  Geo
                </motion.span>
                <motion.span
                  className="font-light text-xl tracking-tight text-white/90"
                  variants={{
                    initial: { y: 0 },
                    hover: { y: -2 }
                  }}
                  transition={{ type: 'spring', stiffness: 400, delay: 0.02 }}
                >
                  Narrator
                </motion.span>
              </span>
            </h1>

            {/* Tagline with animated underline */}
            <div className="hidden sm:flex items-center gap-2 mt-0.5">
              <motion.div
                className="h-px w-3 bg-gradient-to-r from-indigo-500 to-transparent"
                variants={{
                  initial: { width: 12 },
                  hover: { width: 20 }
                }}
                aria-hidden="true"
              />
              <motion.span
                className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase"
                variants={{
                  initial: { opacity: 0.7, letterSpacing: '0.2em' },
                  hover: { opacity: 1, letterSpacing: '0.25em' }
                }}
              >
                Story Studio
              </motion.span>
            </div>
          </div>
        </motion.div>
        </Link>

        {/* Center - Mode Toggle */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <nav className="flex bg-white/5 rounded-xl p-1 border border-white/5" role="tablist" aria-label="Editor mode">
            <motion.button
              role="tab"
              aria-selected={mode === 'edit'}
              aria-controls="editor-panel"
              onClick={() => setMode('edit')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                mode === 'edit'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'edit' && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 bg-white/10 rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10 hidden sm:inline">EDITOR</span>
              <span className="relative z-10 sm:hidden">EDIT</span>
            </motion.button>

            <motion.button
              role="tab"
              aria-selected={mode === 'preview'}
              aria-controls="preview-panel"
              onClick={() => {
                setMode('preview');
                setActiveChapterId(chapters[0].id);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                mode === 'preview'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'preview' && (
                <motion.div
                  layoutId="mode-bg"
                  className="absolute inset-0 bg-white/10 rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <MonitorPlay className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10" aria-hidden="true" />
              <span className="relative z-10">PREVIEW</span>
            </motion.button>
          </nav>
        </div>

        {/* Right - Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Import project file"
          />
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-2 rounded-l-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              aria-label="Import project"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Import</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowImportHelp(true)}
              className="p-2 rounded-r-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
              aria-label="Show import format help"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            </motion.button>
          </div>

          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            aria-label="Export project"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export</span>
          </motion.button>

          {/* Embed */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmbedModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-linear-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 hover:text-white hover:from-indigo-500/30 hover:to-purple-500/30 transition-all border border-indigo-500/20"
            aria-label="Get embed code"
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Embed</span>
          </motion.button>

          {/* Reset */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            aria-label="Reset to default project"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </motion.button>

          <div className="h-6 w-px bg-white/10 mx-2" aria-hidden="true" />

          {/* Save with status */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                hasUnsavedChanges
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/15'
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

        {/* Mobile - Menu Button & Save */}
        <div className="flex md:hidden items-center gap-2">
          {/* Quick Save for mobile */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`p-2 rounded-lg ${
              hasUnsavedChanges
                ? 'bg-amber-500 text-white'
                : 'bg-white/10 text-white'
            }`}
            aria-label={hasUnsavedChanges ? 'Save unsaved changes' : 'Project saved'}
          >
            <Save className="w-4 h-4" aria-hidden="true" />
          </motion.button>

          {/* Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMobileMenu(true)}
            className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white"
            aria-label="Open menu"
            aria-expanded={showMobileMenu}
            aria-controls="mobile-menu"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
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
            aria-label="Mobile menu"
            id="mobile-menu"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900 border-l border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
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

              {/* Save Status */}
              <div className="p-4 border-b border-white/10">
                {hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    Unsaved changes
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm">
                    {formatLastSaved(lastSaved)}
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    handleFileChange(e);
                    setShowMobileMenu(false);
                  }}
                  className="hidden"
                />

                <button
                  onClick={() => {
                    handleImportClick();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <Upload className="w-5 h-5" aria-hidden="true" />
                  <span>Import Project</span>
                </button>

                <button
                  onClick={() => {
                    handleExport();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <Download className="w-5 h-5" aria-hidden="true" />
                  <span>Export Project</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowEmbedModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-300 hover:bg-indigo-500/10 transition-colors text-left"
                >
                  <Code2 className="w-5 h-5" aria-hidden="true" />
                  <span>Get Embed Code</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowImportHelp(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Import Format Help</span>
                </button>

                <div className="h-px bg-white/10 my-2" />

                <button
                  onClick={() => {
                    handleReset();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <RotateCcw className="w-5 h-5" aria-hidden="true" />
                  <span>Reset to Default</span>
                </button>
              </div>

              {/* Save Button */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-slate-900">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleSave();
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                    hasUnsavedChanges
                      ? 'bg-amber-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <div className="fixed top-20 right-6 z-100 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
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
              {toast.type === 'success' && <Check className="w-4 h-4" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Import Help Modal */}
      <AnimatePresence>
        {showImportHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            onClick={() => setShowImportHelp(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <FileJson className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Import Format</h3>
                    <p className="text-xs text-slate-500">JSON file structure</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportHelp(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-300">
                    <strong>Tip:</strong> The easiest way to get the correct format is to first <strong>Export</strong> an existing project and use it as a template.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Required Structure:</h4>
                  <pre className="bg-black/40 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto border border-white/5">
{`{
  "chapters": [
    {
      "id": "unique-id",
      "title": "Scene Title",
      "content": "Narrative text...",
      "longitude": -70.6693,
      "latitude": -33.4489,
      "zoom": 10,
      "pitch": 45,
      "bearing": 0
    }
  ],
  "mapStyle": "dark",
  "version": "1.0.0"
}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300">Field Descriptions:</h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">id</code>
                      <span className="text-slate-400">Unique identifier for each scene</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">title</code>
                      <span className="text-slate-400">Scene title (max 100 chars)</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">content</code>
                      <span className="text-slate-400">Narrative text (max 1000 chars)</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">longitude</code>
                      <span className="text-slate-400">-180 to 180</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">latitude</code>
                      <span className="text-slate-400">-90 to 90</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">zoom</code>
                      <span className="text-slate-400">1-20 (world to street level)</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">pitch</code>
                      <span className="text-slate-400">0-85 (camera tilt angle)</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">bearing</code>
                      <span className="text-slate-400">-180 to 180 (rotation)</span>
                    </div>
                    <div className="flex gap-2">
                      <code className="text-indigo-400 shrink-0">mapStyle</code>
                      <span className="text-slate-400">dark, satellite, streets, outdoors, light</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    handleExport();
                    setShowImportHelp(false);
                  }}
                  className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Example
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowImportHelp(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            onClick={() => setShowResetConfirm(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="reset-dialog-title" className="text-sm font-semibold text-white">Reset Project</h3>
                  <p className="text-xs text-slate-500">This will restore default content</p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-sm text-slate-300">
                  Are you sure you want to reset to the default project? <span className="font-semibold text-amber-400">All unsaved changes will be lost.</span>
                </p>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-white/10 flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmReset}
                  className="flex-1 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Reset Project
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embed Modal */}
      <AnimatePresence>
        {showEmbedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            onClick={() => setShowEmbedModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="embed-dialog-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-linear-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
                    <Code2 className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 id="embed-dialog-title" className="text-sm font-semibold text-white">Embed Your Story</h3>
                    <p className="text-xs text-slate-500">Copy this code to embed on any website</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmbedModal(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Info */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                  <p className="text-xs text-indigo-300">
                    This embed includes all <strong>{chapters.length} scene{chapters.length !== 1 ? 's' : ''}</strong> with full scrollytelling experience. The map and animations will work on any website.
                  </p>
                </div>

                {/* Code */}
                <div className="relative">
                  <pre className="bg-black/40 rounded-lg p-4 text-[11px] text-slate-300 overflow-x-auto border border-white/5 whitespace-pre-wrap break-all">
                    {getEmbedCode()}
                  </pre>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyEmbed}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
                      embedCopied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label="Copy embed code"
                  >
                    {embedCopied ? (
                      <Check className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    )}
                  </motion.button>
                </div>

                {/* Preview link */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Preview:</span>
                  <a
                    href={generateEmbedUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 truncate max-w-[300px]"
                  >
                    Open in new tab
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopyEmbed}
                  className="flex-1 bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {embedCopied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      Copy Embed Code
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEmbedModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
