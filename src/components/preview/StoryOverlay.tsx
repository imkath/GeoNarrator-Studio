'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SceneCard from './SceneCard';

/** Keys belong to whatever field or dialog has focus, not to the story. */
const typingOrDialog = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
      !!document.querySelector('[aria-modal="true"]'))
  );
};

export default function StoryOverlay() {
  const { chapters, activeChapterId, setActiveChapterId } = useStoryStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLElement | null>>({});

  const activeIndex = Math.max(
    0,
    chapters.findIndex((c) => c.id === activeChapterId)
  );

  const goToChapter = useCallback(
    (index: number) => {
      const chapter = chapters[index];
      if (!chapter) return;
      setActiveChapterId(chapter.id);
      stepRefs.current[chapter.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [chapters, setActiveChapterId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (typingOrDialog(e.target)) return;
      let next: number | null = null;
      if (['ArrowDown', 'ArrowRight', 'j', 'PageDown'].includes(e.key)) next = activeIndex + 1;
      else if (['ArrowUp', 'ArrowLeft', 'k', 'PageUp'].includes(e.key)) next = activeIndex - 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = chapters.length - 1;
      else if (e.key >= '1' && e.key <= '9') next = parseInt(e.key, 10) - 1;
      if (next === null || next < 0 || next >= chapters.length) return;
      e.preventDefault();
      goToChapter(next);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, chapters.length, goToChapter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute('data-id');
          if (id) setActiveChapterId(id);
        }
      },
      { root: containerRef.current, rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    Object.values(stepRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [chapters, setActiveChapterId]);

  const navBtn =
    'w-10 h-10 flex items-center justify-center rounded-[2px] text-ink hover:bg-paper-2 disabled:text-ink-3 disabled:hover:bg-transparent disabled:cursor-not-allowed';

  return (
    <>
      {/* The overlay takes the scroll everywhere, so the wheel advances the
          story instead of zooming the map. Preview reads like the embed. */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-30 overflow-y-auto overscroll-contain snap-y snap-proximity"
        role="region"
        aria-label="Vista previa de la historia"
      >
        <div className="h-[45dvh]" aria-hidden="true" />
        {chapters.map((chapter, index) => (
          <article
            key={chapter.id}
            data-id={chapter.id}
            ref={(el) => {
              stepRefs.current[chapter.id] = el;
            }}
            className="min-h-dvh flex items-end sm:items-center px-3 sm:px-8 lg:px-16 pb-24 sm:pb-0 snap-center"
            aria-label={`Escena ${index + 1} de ${chapters.length}`}
          >
            <SceneCard chapter={chapter} index={index} total={chapters.length} active={index === activeIndex} />
          </article>
        ))}
        <div className="h-[60dvh] flex items-start justify-center pt-10">
          <button
            onClick={() => {
              goToChapter(0);
              containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-paper border border-ink rounded-[2px] px-4 py-2 text-sm font-semibold hover:bg-paper-2"
          >
            Fin. Volver a la escena 1
          </button>
        </div>
      </div>

      <nav
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-1.5"
        aria-label="Escenas"
      >
        {chapters.map((chapter, index) => {
          const on = index === activeIndex;
          return (
            <button
              key={chapter.id}
              onClick={() => goToChapter(index)}
              aria-label={`Ir a la escena ${index + 1}: ${chapter.title || 'Sin título'}`}
              aria-current={on ? 'step' : undefined}
              className={`w-7 h-7 rounded-full border-2 font-mono text-[11px] font-semibold flex items-center justify-center ${
                on ? 'bg-contour border-paper text-paper' : 'bg-paper border-ink text-ink hover:bg-paper-2'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center bg-paper border border-ink rounded-[2px]">
        <button
          onClick={() => goToChapter(activeIndex - 1)}
          disabled={activeIndex === 0}
          className={navBtn}
          aria-label="Escena anterior"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
        <p className="px-3 font-mono text-[13px] tabular" aria-live="polite">
          {activeIndex + 1} de {chapters.length}
        </p>
        <button
          onClick={() => goToChapter(activeIndex + 1)}
          disabled={activeIndex === chapters.length - 1}
          className={navBtn}
          aria-label="Escena siguiente"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
