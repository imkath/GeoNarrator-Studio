'use client';

import { useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Mountain,
  Compass,
  Crosshair,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

// Tailwind scans source as plain text, so a class built as `bg-${color}-400`
// never reaches the stylesheet. Every variant is spelled out.
type Accent = 'blue' | 'emerald' | 'amber';

const ACCENTS: Record<Accent, {
  text: string;
  iconBg: string;
  fill: string;
  mark: string;
  border: string;
  dot: string;
  presetOn: string;
}> = {
  blue: {
    text: 'text-blue-400',
    iconBg: 'bg-blue-400/20',
    fill: 'bg-gradient-to-r from-blue-400/40 to-blue-400/60',
    mark: 'bg-blue-400',
    border: 'border-blue-400',
    dot: 'bg-blue-400',
    presetOn: 'bg-blue-400/20 text-blue-400 border border-blue-400/50',
  },
  emerald: {
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-400/20',
    fill: 'bg-gradient-to-r from-emerald-400/40 to-emerald-400/60',
    mark: 'bg-emerald-400',
    border: 'border-emerald-400',
    dot: 'bg-emerald-400',
    presetOn: 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/50',
  },
  amber: {
    text: 'text-amber-400',
    iconBg: 'bg-amber-400/20',
    fill: 'bg-gradient-to-r from-amber-400/40 to-amber-400/60',
    mark: 'bg-amber-400',
    border: 'border-amber-400',
    dot: 'bg-amber-400',
    presetOn: 'bg-amber-400/20 text-amber-400 border border-amber-400/50',
  },
};

interface SliderProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  accent: Accent;
  marks?: { value: number; label: string }[];
  presets?: { value: number; label: string; icon?: React.ReactNode }[];
  helpText?: string;
}

function CameraSlider({
  label,
  description,
  icon,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
  accent,
  marks = [],
  presets = [],
  helpText
}: SliderProps) {
  const [showHelp, setShowHelp] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;
  const styles = ACCENTS[accent];
  const sliderId = `camera-${label.toLowerCase()}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${styles.iconBg}`}>
            <span className={styles.text}>{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <label htmlFor={sliderId} className="text-xs font-semibold text-white">{label}</label>
              {helpText && (
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(Math.max(min, value - step))}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <span className="text-sm font-bold">-</span>
          </motion.button>
          <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 min-w-[60px] text-center">
            <span className="text-sm font-mono text-white">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(Math.min(max, value + step))}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <span className="text-sm font-bold">+</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && helpText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-lg px-3 py-2 text-[10px] text-slate-400 border border-white/5"
          >
            {helpText}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <div className="relative h-3 bg-white/5 rounded-full overflow-visible">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded-full ${styles.fill}`}
            style={{ width: `${percentage}%` }}
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          />

          {marks.map((mark) => {
            const markPercentage = ((mark.value - min) / (max - min)) * 100;
            return (
              <div
                key={mark.value}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${markPercentage}%` }}
              >
                <div className={`w-0.5 h-3 ${mark.value <= value ? styles.mark : 'bg-white/20'} rounded-full`} />
              </div>
            );
          })}

          <motion.div
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg shadow-black/30 border-2 ${styles.border} cursor-grab active:cursor-grabbing flex items-center justify-center pointer-events-none`}
            style={{ left: `calc(${percentage}% - 10px)` }}
            initial={false}
            animate={{ left: `calc(${percentage}% - 10px)` }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            whileHover={{ scale: 1.2 }}
          >
            <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
          </motion.div>

          <input
            id={sliderId}
            type="range"
            aria-label={`${label}: ${description}`}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {marks.length > 0 && (
          <div className="relative h-4 mt-1">
            {marks.map((mark) => {
              const markPercentage = ((mark.value - min) / (max - min)) * 100;
              return (
                <span
                  key={mark.value}
                  className="absolute text-[9px] text-slate-500 -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${markPercentage}%` }}
                >
                  {mark.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {presets.map((preset) => (
            <motion.button
              key={preset.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(preset.value)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all
                ${Math.abs(value - preset.value) < step
                  ? styles.presetOn
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {preset.icon}
              {preset.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CameraControls() {
  const {
    selectedChapterId,
    chapters,
    currentCamera,
    isMapLoaded,
    updateChapter,
    captureCurrentView,
  } = useStoryStore();

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  if (!selectedChapter) return null;

  const handleZoomChange = (zoom: number) => {
    updateChapter(selectedChapterId, { zoom });
  };

  const handlePitchChange = (pitch: number) => {
    updateChapter(selectedChapterId, { pitch });
  };

  const handleBearingChange = (bearing: number) => {
    updateChapter(selectedChapterId, { bearing });
  };

  const handleResetCamera = () => {
    updateChapter(selectedChapterId, {
      zoom: 4,
      pitch: 0,
      bearing: 0
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="p-5 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Camera className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">Camera Settings</span>
              <p className="text-[10px] text-slate-500">Control how this scene looks</p>
            </div>
          </div>
          <motion.button
            onClick={handleResetCamera}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all border border-white/5"
          >
            <RotateCcw className="w-3 h-3" />
            Reset All
          </motion.button>
        </div>

        <CameraSlider
          label="Zoom"
          description="Distance from the ground"
          icon={<ZoomIn className="w-4 h-4" />}
          value={selectedChapter.zoom}
          min={1}
          max={20}
          step={0.5}
          unit="x"
          onChange={handleZoomChange}
          accent="blue"
          marks={[
            { value: 1, label: 'World' },
            { value: 5, label: 'Country' },
            { value: 10, label: 'City' },
            { value: 15, label: 'Street' },
            { value: 20, label: 'Building' },
          ]}
          presets={[
            { value: 3, label: 'Far', icon: <ZoomOut className="w-3 h-3" /> },
            { value: 8, label: 'Medium' },
            { value: 14, label: 'Close', icon: <ZoomIn className="w-3 h-3" /> },
          ]}
          helpText="Lower values show more area (zoomed out), higher values show more detail (zoomed in). Use 1-5 for continents, 5-10 for regions, 10-15 for cities, 15+ for streets."
        />

        <CameraSlider
          label="Tilt"
          description="Camera angle from above"
          icon={<Mountain className="w-4 h-4" />}
          value={selectedChapter.pitch}
          min={0}
          max={85}
          step={5}
          unit="°"
          onChange={handlePitchChange}
          accent="emerald"
          marks={[
            { value: 0, label: 'Flat' },
            { value: 30, label: '30°' },
            { value: 60, label: '60°' },
            { value: 85, label: 'Horizon' },
          ]}
          presets={[
            { value: 0, label: '2D Map', icon: <Eye className="w-3 h-3" /> },
            { value: 45, label: '3D View' },
            { value: 75, label: 'Cinematic', icon: <Mountain className="w-3 h-3" /> },
          ]}
          helpText="0° looks straight down (like Google Maps). Higher angles tilt the camera toward the horizon, showing terrain and buildings in 3D. Use 45-75° for dramatic cinematic views."
        />

        <CameraSlider
          label="Rotation"
          description="Compass orientation"
          icon={<Compass className="w-4 h-4" />}
          value={selectedChapter.bearing}
          min={-180}
          max={180}
          step={15}
          unit="°"
          onChange={handleBearingChange}
          accent="amber"
          marks={[
            { value: -180, label: 'S' },
            { value: -90, label: 'W' },
            { value: 0, label: 'N' },
            { value: 90, label: 'E' },
            { value: 180, label: 'S' },
          ]}
          presets={[
            { value: 0, label: 'North', icon: <Compass className="w-3 h-3" /> },
            { value: 90, label: 'East' },
            { value: -90, label: 'West' },
            { value: 180, label: 'South' },
          ]}
          helpText="Rotates the map around its center. 0° points North (up), 90° points East (right), -90° points West (left), ±180° points South (down)."
        />

        <div className="border-t border-white/10 pt-5">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                <Crosshair className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Quick Capture</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                  Move around the map with your mouse, then click the button to save your exact camera position.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <EyeOff className="w-2.5 h-2.5" />
                  Saved
                </div>
                <div className="text-[11px] font-mono text-slate-300">
                  {selectedChapter.zoom.toFixed(1)}x · {Math.round(selectedChapter.pitch)}° · {Math.round(selectedChapter.bearing)}°
                </div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
                <div className="text-[9px] text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </div>
                <div className="text-[11px] font-mono text-emerald-300">
                  {currentCamera.zoom.toFixed(1)}x · {Math.round(currentCamera.pitch)}° · {Math.round(currentCamera.bearing)}°
                </div>
              </div>
            </div>

            <motion.button
              onClick={captureCurrentView}
              disabled={!isMapLoaded}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
              <span>CAPTURE CURRENT VIEW</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
