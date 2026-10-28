/**
 * A numbered station, the way an itinerary marks its stops on a printed map.
 * The active scene is filled with the contour colour; the rest stay paper.
 */
export default function SceneMarker({
  number,
  title,
  active,
  hint,
}: {
  number: number;
  title: string;
  active: boolean;
  hint?: string;
}) {
  return (
    <div className={`group relative ${hint ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <span
        className={`flex items-center justify-center rounded-full border-2 font-mono font-semibold leading-none transition-[width,height,background-color] duration-200 ${
          active
            ? 'w-8 h-8 text-[13px] bg-contour border-paper text-paper'
            : 'w-6 h-6 text-[11px] bg-paper border-ink text-ink'
        }`}
        style={{ boxShadow: '0 1px 0 rgba(20,24,29,0.35)' }}
      >
        {number}
      </span>
      <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-paper border border-ink rounded-[2px] px-2 py-1 text-xs text-ink opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {title || 'Sin título'}
        {hint && <span className="text-ink-3"> · {hint}</span>}
      </span>
    </div>
  );
}
