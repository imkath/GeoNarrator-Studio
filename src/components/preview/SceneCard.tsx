import type { Chapter } from '@/types';

export const dms = (value: number, pos: string, neg: string) => {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}′${value < 0 ? neg : pos}`;
};

/**
 * One scene as the reader sees it: an opaque card, like the title block of a
 * printed map, so the text reads the same over snow, sea or city lights.
 * Shared by the editor preview and the embed.
 */
export default function SceneCard({
  chapter,
  index,
  total,
  active,
}: {
  chapter: Chapter;
  index: number;
  total: number;
  active: boolean;
}) {
  return (
    <div
      className={`w-full max-w-[420px] bg-paper border rounded-[4px] px-5 py-5 sm:px-6 sm:py-6 transition-[opacity,border-color] duration-300 ${
        active ? 'border-ink opacity-100' : 'border-rule opacity-60'
      }`}
    >
      <p className="font-mono text-[11px] text-ink-3 tabular">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
      <h2 className="mt-2 text-[26px] sm:text-[30px] font-extrabold leading-[1.05] tracking-[-0.02em] text-balance">
        {chapter.title || 'Sin título'}
      </h2>
      {chapter.content && (
        <p className="mt-3 text-[16px] sm:text-[17px] leading-relaxed text-ink-2 whitespace-pre-line">
          {chapter.content}
        </p>
      )}
      <p className="mt-4 pt-3 border-t border-rule font-mono text-[11px] text-ink-3">
        {dms(chapter.latitude, 'N', 'S')} {dms(chapter.longitude, 'E', 'O')}
      </p>
    </div>
  );
}
