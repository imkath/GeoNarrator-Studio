'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MapPin, Home } from 'lucide-react';

export default function StoryOverlay() {
  const { chapters, activeChapterId, setActiveChapterId } = useStoryStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLElement | null>>({});

  const activeIndex = chapters.findIndex(c => c.id === activeChapterId);
  const progress = chapters.length > 1 ? (activeIndex / (chapters.length - 1)) * 100 : 100;

  const goToChapter = useCallback((index: number) => {
    if (index >= 0 && index < chapters.length) {
      const chapter = chapters[index];
      setActiveChapterId(chapter.id);
      const el = stepRefs.current[chapter.id];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [chapters, setActiveChapterId]);

  const goToPrev = useCallback(() => {
    if (activeIndex > 0) {
      goToChapter(activeIndex - 1);
    }
  }, [activeIndex, goToChapter]);

  const goToNext = useCallback(() => {
    if (activeIndex < chapters.length - 1) {
      goToChapter(activeIndex + 1);
    }
  }, [activeIndex, chapters.length, goToChapter]);

  const goToStart = useCallback(() => {
    goToChapter(0);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [goToChapter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        goToChapter(chapters.length - 1);
      } else if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < chapters.length) {
          e.preventDefault();
          goToChapter(index);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, goToStart, goToChapter, chapters.length]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          if (id) setActiveChapterId(id);
        }
      });
    }, options);

    Object.values(stepRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [chapters, setActiveChapterId]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 pointer-events-none overflow-y-auto scroll-smooth snap-y snap-mandatory"
      style={{ scrollBehavior: 'smooth' }}
      role="region"
      aria-label="Story presentation"
    >
      <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none">
        <div className="h-1 bg-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          />
        </div>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 bg-black/70 backdrop-blur-xl rounded-2xl p-2 border border-white/10 shadow-2xl"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToStart}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Go to beginning"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </motion.button>

          <div className="h-6 w-px bg-white/10" aria-hidden="true" />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPrev}
            disabled={activeIndex === 0}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous scene"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </motion.button>

          <div className="px-4 py-2 min-w-[100px] text-center">
            <div className="text-sm font-bold text-white">
              {activeIndex + 1} <span className="text-slate-500 font-normal">of</span> {chapters.length}
            </div>
            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
              {chapters[activeIndex]?.title}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNext}
            disabled={activeIndex === chapters.length - 1}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next scene"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-center mt-2"
        >
          <span className="text-[10px] text-slate-600">
            Use <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-400">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-400">→</kbd> or scroll
          </span>
        </motion.div>
      </div>

      <div className="h-[50vh] flex items-end justify-center pb-16 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-sm text-slate-400 font-light tracking-wider">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-slate-500" aria-hidden="true" />
          </motion.div>
        </motion.div>
      </div>

      {chapters.map((chapter, index) => {
        const isActive = activeChapterId === chapter.id;

        return (
          <article
            key={chapter.id}
            data-id={chapter.id}
            ref={el => { stepRefs.current[chapter.id] = el; }}
            className="min-h-screen flex items-center justify-start px-4 sm:px-8 md:px-16 lg:px-24 snap-center"
            aria-label={`Scene ${index + 1}: ${chapter.title}`}
          >
            <motion.div
              initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, margin: '-30%' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto max-w-xl w-full"
            >
              <div className="relative">
                <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />

                <div className="relative bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" aria-hidden="true" />

                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600" aria-hidden="true" />

                  <div className="p-6 sm:p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                        <span className="text-xs font-bold text-indigo-400" aria-hidden="true">{index + 1}</span>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" aria-hidden="true" />
                      {chapter.pitch > 10 && (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                          3D View
                        </span>
                      )}
                    </div>

                    <h2
                      className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white tracking-tight"
                      style={{
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {chapter.title}
                    </h2>

                    <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light">
                      {chapter.content}
                    </p>

                    <div className="mt-4 sm:mt-6 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="font-mono">
                        {chapter.latitude.toFixed(4)}°, {chapter.longitude.toFixed(4)}°
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </article>
        );
      })}

      <div className="h-[50vh] flex items-center justify-center pointer-events-auto pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-sm text-slate-500 mb-2">End of story</p>
          <button
            onClick={goToStart}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-1 mx-auto"
            aria-label="Return to beginning of story"
          >
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
            Back to start
          </button>
        </motion.div>
      </div>

      <nav
        className="fixed right-4 sm:right-8 top-1/2 -translate-y-1/2 z-40 pointer-events-auto hidden sm:block"
        aria-label="Scene navigation"
      >
        <div className="flex flex-col gap-2 sm:gap-3">
          {chapters.map((chapter, index) => {
            const isActive = activeChapterId === chapter.id;
            return (
              <motion.button
                key={chapter.id}
                onClick={() => goToChapter(index)}
                className="group relative"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to scene ${index + 1}: ${chapter.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <motion.div
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-500 shadow-lg shadow-indigo-500/50'
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                  animate={{ scale: isActive ? 1.3 : 1 }}
                />

                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10">
                    {chapter.title}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
