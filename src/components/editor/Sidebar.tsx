'use client';

import { useState, useEffect } from 'react';
import { useStoryStore, MAP_STYLES, VALIDATION } from '@/store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Sparkles,
  Map,
  AlertCircle,
  X,
  ChevronRight
} from 'lucide-react';
import ChapterList from './ChapterList';
import LocationSearch from './LocationSearch';
import CameraControls from './CameraControls';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    chapters,
    selectedChapterId,
    mapStyle,
    updateChapter,
    setMapStyle,
  } = useStoryStore();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse on mobile
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);
  const selectedChapterIndex = chapters.findIndex(c => c.id === selectedChapterId);

  if (!selectedChapter) return null;

  // Validation
  const titleLength = selectedChapter.title.length;
  const contentLength = selectedChapter.content.length;
  const isTitleEmpty = titleLength === 0;
  const isTitleTooLong = titleLength > VALIDATION.TITLE_MAX_LENGTH;
  const isContentTooLong = contentLength > VALIDATION.CONTENT_MAX_LENGTH;

  const handleTitleChange = (value: string) => {
    // Allow typing but enforce max length
    if (value.length <= VALIDATION.TITLE_MAX_LENGTH) {
      updateChapter(selectedChapterId, { title: value });
    }
  };

  const handleContentChange = (value: string) => {
    // Allow typing but enforce max length
    if (value.length <= VALIDATION.CONTENT_MAX_LENGTH) {
      updateChapter(selectedChapterId, { content: value });
    }
  };

  // Mobile collapsed view - show floating button
  if (isMobile && isCollapsed) {
    return (
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        onClick={() => setIsCollapsed(false)}
        className="fixed left-4 top-24 z-30 bg-indigo-500 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2"
        aria-label="Open editor sidebar"
      >
        <Layers className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm font-medium">Edit</span>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </motion.button>
    );
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}

      <motion.aside
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`
          ${isMobile ? 'fixed left-0 top-16 bottom-0 z-30' : 'fixed left-0 top-16 bottom-0 z-20'}
          w-[320px] sm:w-[380px] md:w-[420px] bg-slate-950/95 backdrop-blur-2xl border-r border-white/5 flex flex-col shadow-2xl shadow-black/50 overflow-hidden
        `}
        role="complementary"
        aria-label="Scene editor"
      >
        {/* Header - Fixed */}
        <div className="p-4 sm:p-6 border-b border-white/5 shrink-0 flex-none">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              Scene Properties
            </h2>
            <div className="flex items-center gap-2">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 sm:px-3 py-1 rounded-full font-medium border border-indigo-500/30"
              >
                {selectedChapterIndex + 1}/{chapters.length}
              </motion.span>
              {/* Close button for mobile */}
              {isMobile && (
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Form */}
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 border-b border-white/5">
            {/* Title Input */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="scene-title"
                  className="text-[10px] text-slate-500 font-bold uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors"
                >
                  Title
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    isTitleEmpty ? 'text-amber-400' :
                    isTitleTooLong ? 'text-red-400' :
                    titleLength > VALIDATION.TITLE_MAX_LENGTH * 0.8 ? 'text-amber-400' :
                    'text-slate-600'
                  }`}
                  aria-live="polite"
                >
                  {titleLength}/{VALIDATION.TITLE_MAX_LENGTH}
                </span>
              </div>
              <div className="relative">
                <input
                  id="scene-title"
                  type="text"
                  value={selectedChapter.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={`w-full bg-white/5 border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:bg-white/10 transition-all ${
                    isTitleEmpty
                      ? 'border-amber-500/50 focus:border-amber-500/50 focus:ring-amber-500/20'
                      : 'border-white/10 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                  }`}
                  placeholder="Scene title..."
                  aria-required="true"
                  aria-invalid={isTitleEmpty}
                  aria-describedby={isTitleEmpty ? 'title-error' : undefined}
                />
                {isTitleEmpty && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400" aria-hidden="true">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
              </div>
              {isTitleEmpty && (
                <p id="title-error" className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  Title is required
                </p>
              )}
            </div>

            {/* Content Textarea */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="scene-narrative"
                  className="text-[10px] text-slate-500 font-bold uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors"
                >
                  Narrative
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    isContentTooLong ? 'text-red-400' :
                    contentLength > VALIDATION.CONTENT_MAX_LENGTH * 0.8 ? 'text-amber-400' :
                    'text-slate-600'
                  }`}
                  aria-live="polite"
                >
                  {contentLength}/{VALIDATION.CONTENT_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="scene-narrative"
                value={selectedChapter.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-slate-300 placeholder-slate-600 h-24 sm:h-28 resize-none focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/10 transition-all leading-relaxed"
                placeholder="Tell the story of this location..."
                aria-describedby={contentLength > VALIDATION.CONTENT_MAX_LENGTH * 0.9 ? 'content-warning' : undefined}
              />
              {contentLength > VALIDATION.CONTENT_MAX_LENGTH * 0.9 && (
                <p id="content-warning" className="text-[10px] text-amber-400 mt-1.5" role="status">
                  {VALIDATION.CONTENT_MAX_LENGTH - contentLength} characters remaining
                </p>
              )}
            </div>

            {/* Location Search */}
            <LocationSearch />

            {/* Camera Controls */}
            <CameraControls />

            {/* Map Style Selector */}
            <div role="group" aria-labelledby="map-style-label">
              <label id="map-style-label" className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Map className="w-3 h-3" aria-hidden="true" />
                Map Style
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {MAP_STYLES.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => setMapStyle(style.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative p-2 rounded-lg text-[10px] font-medium transition-all
                      ${mapStyle === style.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
                        : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    aria-pressed={mapStyle === style.id}
                    aria-label={`${style.name} map style`}
                  >
                    {style.name}
                    {mapStyle === style.id && (
                      <motion.div
                        layoutId="style-indicator"
                        className="absolute inset-0 border-2 border-indigo-500 rounded-lg"
                        initial={false}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Chapter List Section */}
          <div className="flex flex-col">
            <div className="px-4 sm:px-6 pt-4 pb-2 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
              <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-amber-500/70" aria-hidden="true" />
                Timeline
              </h3>
            </div>
            <ChapterList />
          </div>
        </div>

        {/* Custom scrollbar styles */}
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}</style>
      </motion.aside>
    </>
  );
}
