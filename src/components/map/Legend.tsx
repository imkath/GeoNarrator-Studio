'use client';

import { motion } from 'framer-motion';
import type { DataLayer } from '@/types';

const compact = (value: number) =>
  new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);

/**
 * Reads the styles rather than describing them: a layer coloured by a property
 * shows its ramp and the two ends of the range, a flat one shows its swatch.
 */
export default function Legend({ layers }: { layers: DataLayer[] }) {
  if (layers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-6 left-6 z-10 max-w-[240px] bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3 space-y-3"
      aria-label="Layer legend"
    >
      {layers.map((layer) => (
        <div key={layer.id}>
          <p className="text-[11px] font-semibold text-white truncate">{layer.name}</p>

          {layer.style.property && layer.style.range ? (
            <>
              <p className="text-[9px] text-slate-400 mb-1 truncate">{layer.style.property}</p>
              <div
                className="h-2 rounded-full"
                style={{
                  background: `linear-gradient(to right, ${layer.style.rampFrom}, ${layer.style.rampTo})`,
                }}
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
                <span>{compact(layer.style.range.min)}</span>
                <span>{compact(layer.style.range.max)}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: layer.style.color, opacity: layer.style.opacity }}
              />
              <span className="text-[9px] text-slate-400">
                {layer.featureCount.toLocaleString()} features
              </span>
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
