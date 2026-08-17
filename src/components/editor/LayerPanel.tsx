'use client';

import { useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Layers3, Trash2, Upload } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import { boundsOf, GeoJSONError, layerWeight, parseGeoJSON } from '@/lib/geojson';
import type { DataLayer } from '@/types';

const PALETTE = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e'];
const RAMPS: [string, string][] = [
  ['#312e81', '#a5b4fc'],
  ['#701a75', '#f0abfc'],
  ['#064e3b', '#6ee7b7'],
  ['#7c2d12', '#fdba74'],
];

/** Beyond this the browser starts to feel it; the panel says so up front. */
const HEAVY_FEATURE_COUNT = 5000;

export default function LayerPanel({ onFlyTo }: { onFlyTo?: (bounds: [number, number, number, number]) => void }) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const {
    layers,
    chapters,
    selectedChapterId,
    addLayer,
    removeLayer,
    updateLayerStyle,
    toggleLayerInChapter,
    isLayerVisibleIn,
  } = useStoryStore();

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  const ingest = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const parsed = parseGeoJSON(await file.text());
      const index = layers.length % PALETTE.length;
      const [rampFrom, rampTo] = RAMPS[index % RAMPS.length];

      const layer: DataLayer = {
        id: `layer-${Date.now()}`,
        name: file.name.replace(/\.(geo)?json$/i, ''),
        collection: parsed.collection,
        geometryKinds: [...parsed.geometryKinds],
        numericProperties: parsed.numericProperties,
        featureCount: parsed.featureCount,
        style: { color: PALETTE[index], opacity: 0.7, rampFrom, rampTo },
      };

      addLayer(layer);

      const bounds = boundsOf(parsed.collection);
      if (bounds && onFlyTo) onFlyTo(bounds);
    } catch (err) {
      setError(
        err instanceof GeoJSONError ? err.message : 'No se pudo leer el archivo'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
        <Layers3 className="w-3 h-3" aria-hidden="true" />
        Capas de datos
      </h3>

      <div
        ref={dropRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) ingest(file);
        }}
        className={`rounded-xl border border-dashed p-4 text-center transition-colors ${
          dragging ? 'border-indigo-500/60 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02]'
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept=".json,.geojson,application/geo+json,application/json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) ingest(file);
          }}
        />
        <label
          htmlFor={inputId}
          className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 hover:text-white cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          {busy ? 'Leyendo…' : 'Cargar GeoJSON'}
        </label>
        <p className="text-[10px] text-slate-600 mt-1">o arrastra el archivo aquí</p>
      </div>

      {error && (
        <p className="mt-2 text-[10px] text-red-400 flex items-start gap-1.5" role="alert">
          <AlertCircle className="w-3 h-3 mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="mt-3 space-y-2">
        <AnimatePresence initial={false}>
          {layers.map((layer) => {
            const visible = selectedChapter ? isLayerVisibleIn(selectedChapter, layer.id) : true;
            const numericKeys = Object.keys(layer.numericProperties);

            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2.5"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedChapter && toggleLayerInChapter(selectedChapter.id, layer.id)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${layer.name} en esta escena`}
                    aria-pressed={visible}
                  >
                    {visible ? (
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 opacity-50" aria-hidden="true" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${visible ? 'text-white' : 'text-slate-500'}`}>
                      {layer.name}
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {layer.featureCount.toLocaleString('es-CL')} elementos
                      {layer.featureCount > HEAVY_FEATURE_COUNT && ' · capa pesada'}
                    </p>
                  </div>

                  <button
                    onClick={() => removeLayer(layer.id)}
                    className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={`Eliminar capa ${layer.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateLayerStyle(layer.id, { color, property: undefined, range: undefined })}
                      className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                        layer.style.color === color && !layer.style.property
                          ? 'border-white'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>

                {numericKeys.length > 0 && (
                  <label className="block">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                      Colorear según
                    </span>
                    <select
                      value={layer.style.property ?? ''}
                      onChange={(e) => {
                        const property = e.target.value;
                        updateLayerStyle(layer.id, {
                          property: property || undefined,
                          range: property ? layer.numericProperties[property] : undefined,
                        });
                      }}
                      className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white focus:border-indigo-500/50 focus:outline-none"
                    >
                      <option value="">Color fijo</option>
                      {numericKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                    Opacidad {Math.round(layer.style.opacity * 100)}%
                  </span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={layer.style.opacity}
                    onChange={(e) => updateLayerStyle(layer.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full mt-1 accent-indigo-500"
                    aria-label={`Opacidad de ${layer.name}`}
                  />
                </label>

                {layerWeight(layer) > 400_000 && (
                  <p className="text-[9px] text-amber-400/80">
                    Esta capa no cabe en el enlace del embed. Exporta el JSON para compartirla.
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {layers.length === 0 && (
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Una capa se dibuja sobre el mapa en todas las escenas. Desde cada escena puedes
            ocultarla, para que la historia también revele datos y no solo mueva la cámara.
          </p>
        )}
      </div>
    </div>
  );
}
