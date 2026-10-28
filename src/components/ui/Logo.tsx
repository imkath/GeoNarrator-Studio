import Link from 'next/link';

/**
 * The mark draws what the product does: the camera leaves one scene (the dot)
 * and flies along an arc to the next one (the target ring).
 */
export function Mark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="5" cy="18.5" r="2.5" fill="var(--ink)" />
      <path
        d="M6.6 16.4C8.4 10.6 12.2 7.6 15.6 7.4"
        stroke="var(--ink)"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <circle cx="18.6" cy="7.4" r="3.1" stroke="var(--contour)" strokeWidth="1.9" />
      <circle cx="18.6" cy="7.4" r="0.9" fill="var(--contour)" />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="GeoNarrator Studio, volver a la portada"
      className="flex items-center gap-2 shrink-0 text-ink hover:text-water transition-colors"
    >
      <Mark className="w-6 h-6" />
      <span className={`items-baseline gap-1.5 ${compact ? 'hidden sm:flex' : 'flex'}`}>
        <span className="text-[17px] font-extrabold tracking-[-0.02em] leading-none">GeoNarrator</span>
        <span className="font-mono text-[11px] text-ink-3 leading-none">studio</span>
      </span>
    </Link>
  );
}
