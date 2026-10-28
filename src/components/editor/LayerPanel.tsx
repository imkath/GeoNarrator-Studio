'use client';

import { useId, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import { boundsOf, GeoJSONError, layerWeight, parseGeoJSON, type ParsedGeoJSON } from '@/lib/geojson';
import type { DataLayer } from '@/types';

/**
 * Flat colours and ramps taken from topographic map conventions: water,
 * contour, vegetation, road, lettering, lifted to read over satellite and
 * dark styles. Ramps run dim to bright, so a high value is what stands out.
 */
const PALETTE = [
  { color: '#7fb2e0', name: 'azul' },
  { color: '#d98a45', name: 'siena' },
  { color: '#6fcf8e', name: 'verde' },
  { color: '#ff7a6b', name: 'rojo' },
  { color: '#eef0f2', name: 'blanco' },
];
const RAMPS: [string, string][] = [
  ['#24527d', '#d6eaf9'],
  ['#7a3a0c', '#ffd8a8'],
  ['#1d5a35', '#cdf0d8'],
  ['#7d1d12', '#ffcbc2'],
];

/** Beyond this the browser starts to feel it; the panel says so up front. */
const HEAVY_FEATURE_COUNT = 5000;
/** localStorage holds about 5 MB, and URLs far less. */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function parseOffThread(text: string): Promise<ParsedGeoJSON> {
  if (typeof Worker === 'undefined') return Promise.resolve(parseGeoJSON(text));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../lib/geojson.worker.ts', import.meta.url));
    worker.onmessage = (e: MessageEvent<{ ok: boolean; parsed?: ParsedGeoJSON; error?: string }>) => {
      worker.terminate();
      if (e.data.ok && e.data.parsed) resolve(e.data.parsed);
      else reject(new GeoJSONError(e.data.error ?? 'No se pudo leer el archivo.'));
    };
    worker.onerror = () => {
      worker.terminate();
      // A worker that cannot start is not the file's fault: parse here.
      try {
        resolve(parseGeoJSON(text));
      } catch (err) {
        reject(err);
      }
    };
    worker.postMessage(text);
  });
}

export default function LayerPanel() {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [justFramed, setJustFramed] = useState<string | null>(null);

  const {
    layers,
    chapters,
    selectedChapterId,
    addLayer,
    removeLayer,
    renameLayer,
    updateLayerStyle,
    toggleLayerInChapter,
    isLayerVisibleIn,
    setPendingBounds,
  } = useStoryStore();

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const sceneNumber = selectedChapter ? chapters.indexOf(selectedChapter) + 1 : 0;

  const ingest = async (file: File) => {
    setError(null);
    setJustFramed(null);
    if (file.size > MAX_FILE_BYTES) {
      setError('El archivo pesa más de 25 MB. Simplifícalo (por ejemplo, en mapshaper.org) y vuelve a cargarlo.');
      return;
    }
    setBusy(true);
    try {
      const parsed = await parseOffThread(await file.text());
      const index = layers.length;
      const [rampFrom, rampTo] = RAMPS[index % RAMPS.length];
      const name = file.name.replace(/\.(geo)?json$/i, '');

      const layer: DataLayer = {
        id: `layer-${Date.now()}`,
        name,
        collection: parsed.collection,
        geometryKinds: [...parsed.geometryKinds],
        numericProperties: parsed.numericProperties,
        featureCount: parsed.featureCount,
        style: { color: PALETTE[index % PALETTE.length].color, opacity: 0.75, rampFrom, rampTo },
      };

      addLayer(layer);
      const bounds = boundsOf(parsed.collection);
      if (bounds) {
        setPendingBounds(bounds);
        setJustFramed(name);
      }
    } catch (err) {
      setError(err instanceof GeoJSONError ? err.message : 'No se pudo leer el archivo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div
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
        className={`rounded-[2px] border border-dashed px-3 py-4 text-center transition-colors ${
          dragging ? 'border-water bg-water-tint' : 'border-ink-3'
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-water hover:text-water-strong"
        >
          <Upload className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          {busy ? 'Leyendo el archivo…' : 'Cargar un GeoJSON'}
        </label>
        <p className="text-[12px] text-ink-3 mt-0.5">o suéltalo aquí. Puntos, líneas o polígonos.</p>
      </div>

      {error && (
        <p className="mt-2 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
      {justFramed && !error && (
        <p className="mt-2 text-[13px] text-ink-2" role="status">
          El mapa muestra «{justFramed}». Si esta escena debe verse así, guarda la vista en Cámara.
        </p>
      )}

      {layers.length === 0 ? (
        <p className="mt-3 text-[13px] text-ink-2 leading-relaxed">
          Una capa se dibuja en todas las escenas, y cada escena puede ocultarla. Así la historia revela
          datos en vez de solo mover la cámara. Si el archivo trae números (población, puestos, votos), el
          color puede seguirlos.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {layers.map((layer) => {
            const visible = selectedChapter ? isLayerVisibleIn(selectedChapter, layer.id) : true;
            const numericKeys = Object.keys(layer.numericProperties);
            const tooHeavyForLink = layerWeight(layer) > 400_000;

            return (
              <li key={layer.id} className="border border-rule rounded-[4px] p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="sr-only" htmlFor={`${layer.id}-name`}>
                      Nombre de la capa
                    </label>
                    <input
                      id={`${layer.id}-name`}
                      value={layer.name}
                      onChange={(e) => renameLayer(layer.id, e.target.value.slice(0, 100))}
                      className="w-full text-[14px] font-semibold bg-transparent rounded-[2px] -mx-1 px-1 border border-transparent hover:border-rule focus:border-water focus:outline-none"
                    />
                    <p className="font-mono text-[11px] text-ink-3">
                      {layer.featureCount.toLocaleString('es-CL')} elementos
                      {layer.featureCount > HEAVY_FEATURE_COUNT && ' · pesada, puede ir lenta'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeLayer(layer.id)}
                    className="p-1.5 -mr-1.5 rounded-[2px] text-ink-3 hover:text-danger"
                    aria-label={`Borrar la capa ${layer.name}`}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>

                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={visible}
                    disabled={!selectedChapter}
                    onChange={() => selectedChapter && toggleLayerInChapter(selectedChapter.id, layer.id)}
                    className="w-4 h-4 accent-[var(--water)]"
                  />
                  Visible en la escena {sceneNumber}
                </label>

                {numericKeys.length > 0 && (
                  <label className="block">
                    <span className="text-[13px] font-semibold text-ink-2">Color</span>
                    <select
                      value={layer.style.property ?? ''}
                      onChange={(e) => {
                        const property = e.target.value;
                        updateLayerStyle(layer.id, {
                          property: property || undefined,
                          range: property ? layer.numericProperties[property] : undefined,
                        });
                      }}
                      className="mt-1 w-full bg-paper border border-rule rounded-[2px] px-2 py-1.5 text-[14px] focus:border-water focus:outline-none"
                    >
                      <option value="">Un solo color</option>
                      {numericKeys.map((key) => (
                        <option key={key} value={key}>
                          Según {key}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {!layer.style.property && (
                  <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Color de ${layer.name}`}>
                    {PALETTE.map(({ color, name }) => {
                      const on = layer.style.color === color;
                      return (
                        <button
                          key={color}
                          role="radio"
                          aria-checked={on}
                          aria-label={name}
                          onClick={() => updateLayerStyle(layer.id, { color })}
                          className={`w-6 h-6 rounded-full border-2 ${on ? 'border-ink' : 'border-paper'}`}
                          style={{ backgroundColor: color, boxShadow: on ? '0 0 0 1px var(--paper) inset' : undefined }}
                        />
                      );
                    })}
                  </div>
                )}

                <label className="block">
                  <span className="flex justify-between text-[13px] font-semibold text-ink-2">
                    Opacidad
                    <span className="font-mono font-normal text-ink-3">{Math.round(layer.style.opacity * 100)}%</span>
                  </span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={layer.style.opacity}
                    onChange={(e) => updateLayerStyle(layer.id, { opacity: parseFloat(e.target.value) })}
                    className="ruler-range"
                  />
                </label>

                {tooHeavyForLink && (
                  <p className="text-[12px] text-caution">
                    No cabe en el enlace para incrustar. Para compartirla, exporta el JSON.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
