import type { DataLayer } from '@/types';

const compact = (value: number) =>
  new Intl.NumberFormat('es-CL', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

/**
 * Reads the styles rather than describing them: a layer coloured by a property
 * shows its ramp and the two ends of the range, a flat one shows its swatch.
 * Sits above the Mapbox logo, which has to stay visible.
 */
export default function Legend({
  layers,
  className = 'absolute bottom-10 left-3 z-10',
}: {
  layers: DataLayer[];
  className?: string;
}) {
  if (layers.length === 0) return null;

  return (
    <section
      className={`${className} w-[176px] sm:w-[220px] bg-paper border border-ink rounded-[4px] px-2.5 py-2 sm:px-3 sm:py-2.5 space-y-2 sm:space-y-2.5`}
      aria-label="Leyenda"
    >
      <h2 className="font-mono text-[10px] text-ink-3">Leyenda</h2>
      {layers.map((layer) => (
        <div key={layer.id}>
          <p className="text-[13px] font-semibold leading-tight truncate">{layer.name}</p>

          {layer.style.property && layer.style.range ? (
            <>
              <p className="text-[11px] text-ink-2 truncate">según {layer.style.property}</p>
              <div
                className="h-2 mt-1"
                style={{
                  background: `linear-gradient(to right, ${layer.style.rampFrom}, ${layer.style.rampTo})`,
                }}
              />
              <div className="flex justify-between font-mono text-[10px] text-ink-2 mt-0.5">
                <span>{compact(layer.style.range.min)}</span>
                <span>{compact(layer.style.range.max)}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3 h-3 shrink-0 border border-ink/20"
                style={{ backgroundColor: layer.style.color, opacity: Math.max(0.35, layer.style.opacity) }}
              />
              <span className="font-mono text-[10px] text-ink-2">
                {layer.featureCount.toLocaleString('es-CL')} elementos
              </span>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
