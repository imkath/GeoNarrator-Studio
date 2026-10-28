'use client';

import { useStoryStore } from '@/store/useStoryStore';
import { Crosshair, Minus, Plus } from 'lucide-react';

interface RulerProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  format?: (v: number) => string;
  ticks: { value: number; label: string }[];
  onChange: (value: number) => void;
}

/** A slider drawn as a map scale bar: ticks with names, not percentages. */
function Ruler({ id, label, value, min, max, step, unit, format, ticks, onChange }: RulerProps) {
  const shown = format ? format(value) : `${Math.round(value)}${unit}`;
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-[13px] font-semibold text-ink-2">
          {label}
        </label>
        <div className="flex items-center">
          <button
            onClick={() => set(value - step)}
            className="w-7 h-7 flex items-center justify-center rounded-[2px] text-ink-2 hover:bg-paper-2 hover:text-ink"
            aria-label={`Menos ${label.toLowerCase()}`}
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <output htmlFor={id} className="min-w-[52px] text-center font-mono text-[13px]">
            {shown}
          </output>
          <button
            onClick={() => set(value + step)}
            className="w-7 h-7 flex items-center justify-center rounded-[2px] text-ink-2 hover:bg-paper-2 hover:text-ink"
            aria-label={`Más ${label.toLowerCase()}`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="ruler-range"
      />
      <div className="relative h-4 mx-[7px]" aria-hidden="true">
        {ticks.map((tick) => {
          const left = ((tick.value - min) / (max - min)) * 100;
          return (
            <span
              key={tick.value}
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center font-mono text-[10px] text-ink-3"
              style={{ left: `${left}%` }}
            >
              <span className="w-px h-1 bg-ink-3" />
              {tick.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const fmt = (camera: { zoom: number; pitch: number; bearing: number }) =>
  `z${camera.zoom.toFixed(1)} · ${Math.round(camera.pitch)}° · ${Math.round(camera.bearing)}°`;

export default function CameraControls() {
  const { selectedChapterId, chapters, currentCamera, isMapLoaded, updateChapter, captureCurrentView } =
    useStoryStore();

  const chapter = chapters.find((c) => c.id === selectedChapterId);
  if (!chapter) return null;

  const update = (patch: Partial<typeof chapter>) => updateChapter(chapter.id, patch);
  const differs =
    Math.abs(currentCamera.zoom - chapter.zoom) > 0.05 ||
    Math.abs(currentCamera.pitch - chapter.pitch) > 0.5 ||
    Math.abs(((currentCamera.bearing - chapter.bearing + 540) % 360) - 180) > 0.5 ||
    Math.abs(currentCamera.longitude - chapter.longitude) > 1e-4 ||
    Math.abs(currentCamera.latitude - chapter.latitude) > 1e-4;

  return (
    <div className="space-y-5">
      <div className="border border-rule rounded-[4px] p-3">
        <p className="text-[13px] text-ink-2 leading-snug">
          Mueve el mapa hasta que se vea como quieres y guarda ese encuadre en la escena.
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 font-mono text-[11px]">
          <dt className="text-ink-3">escena</dt>
          <dd>{fmt(chapter)}</dd>
          <dt className="text-ink-3">mapa</dt>
          <dd className={differs ? 'text-water' : ''}>{fmt(currentCamera)}</dd>
        </dl>
        <button
          onClick={captureCurrentView}
          disabled={!isMapLoaded || !differs}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] bg-water text-paper text-sm font-semibold hover:bg-water-strong disabled:bg-paper-2 disabled:text-ink-3 disabled:cursor-not-allowed"
        >
          <Crosshair className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          {differs ? 'Guardar la vista del mapa' : 'La escena ya tiene esta vista'}
        </button>
      </div>

      <Ruler
        id="camera-zoom"
        label="Acercamiento"
        value={chapter.zoom}
        min={1}
        max={20}
        step={0.5}
        unit=""
        format={(v) => v.toFixed(1)}
        ticks={[
          { value: 2, label: 'mundo' },
          { value: 6, label: 'país' },
          { value: 11, label: 'ciudad' },
          { value: 16, label: 'calle' },
        ]}
        onChange={(zoom) => update({ zoom })}
      />

      <Ruler
        id="camera-pitch"
        label="Inclinación"
        value={chapter.pitch}
        min={0}
        max={85}
        step={5}
        unit="°"
        ticks={[
          { value: 0, label: 'plano' },
          { value: 45, label: '45°' },
          { value: 85, label: 'horizonte' },
        ]}
        onChange={(pitch) => update({ pitch })}
      />

      <Ruler
        id="camera-bearing"
        label="Rotación"
        value={chapter.bearing}
        min={-180}
        max={180}
        step={15}
        unit="°"
        ticks={[
          { value: -180, label: 'S' },
          { value: -90, label: 'O' },
          { value: 0, label: 'N' },
          { value: 90, label: 'E' },
          { value: 180, label: 'S' },
        ]}
        onChange={(bearing) => update({ bearing })}
      />
    </div>
  );
}
