'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { Search, X } from 'lucide-react';
import { parseCoordinates } from '@/lib/coordinates';
import { searchPlaces, type Place } from '@/lib/geocoding';
import { fieldClass } from './fields';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const LIST_ID = 'location-results';

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function LocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const { selectedChapterId, updateChapter, currentCamera } = useStoryStore();

  // Kept in a ref so panning the map does not rebuild the search callback.
  const near = useRef(currentCamera);
  useEffect(() => {
    near.current = currentCamera;
  }, [currentCamera]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Both the timer and any request in flight are cancelled on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestRef.current?.abort();
    },
    []
  );

  const runSearch = useCallback(async (searchQuery: string) => {
    requestRef.current?.abort();
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const coords = parseCoordinates(searchQuery);
    if (coords) {
      setResults([
        {
          id: 'coordinates',
          label: `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`,
          context: 'Coordenadas escritas a mano',
          center: coords,
          zoom: 14,
          isCoordinate: true,
        },
      ]);
      setStatus('done');
      setHighlight(0);
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('loading');

    try {
      const found = await searchPlaces(searchQuery, MAPBOX_TOKEN, {
        near: [near.current.longitude, near.current.latitude],
        signal: controller.signal,
      });
      setResults(found);
      setHighlight(found.length ? 0 : -1);
      setStatus('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setResults([]);
      setStatus('error');
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const pick = (result: Place) => {
    if (!selectedChapterId) return;
    const [lng, lat] = result.center;
    // Moving the marker without the camera left the reader looking at the
    // whole country after picking a specific market.
    updateChapter(selectedChapterId, { longitude: lng, latitude: lat, zoom: result.zoom });
    setQuery(result.label);
    setIsOpen(false);
    setResults([]);
    setStatus('idle');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Escape' && query) {
        e.stopPropagation();
        setQuery('');
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? results.length - 1 : h - 1));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  const showPanel = isOpen && query.trim() !== '' && status !== 'idle';

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="location-search" className="block text-[13px] font-semibold text-ink-2 mb-1">
        Lugar
      </label>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id="location-search"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={LIST_ID}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && highlight >= 0 ? `place-${highlight}` : undefined}
          aria-describedby="location-hint"
          autoComplete="off"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Busca un lugar o pega coordenadas"
          className={`${fieldClass} pl-9 pr-9`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setStatus('idle');
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-ink-3 hover:text-ink"
            aria-label="Borrar la búsqueda"
          >
            <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute z-50 w-full mt-1 bg-paper border border-ink rounded-[2px] overflow-hidden">
          {status === 'loading' && <p className="px-3 py-2.5 text-[13px] text-ink-2">Buscando…</p>}
          {status === 'error' && (
            <p className="px-3 py-2.5 text-[13px] text-danger">
              La búsqueda no respondió. Revisa la conexión, o pega las coordenadas del lugar.
            </p>
          )}
          {status === 'done' && results.length === 0 && (
            <p className="px-3 py-2.5 text-[13px] text-ink-2">
              No hay lugares con ese nombre. Prueba con la comuna o la ciudad, o pega coordenadas.
            </p>
          )}
          {status === 'done' && results.length > 0 && (
            <ul id={LIST_ID} role="listbox" aria-label="Lugares encontrados" className="max-h-64 overflow-y-auto">
              {results.map((result, i) => (
                <li
                  key={result.id}
                  id={`place-${i}`}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(result)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`px-3 py-2 cursor-pointer border-b border-rule last:border-0 ${
                    i === highlight ? 'bg-water-tint' : ''
                  }`}
                >
                  <span className="block text-[14px] truncate">{result.label}</span>
                  <span className="flex gap-2 text-[11px] text-ink-3">
                    {result.context && <span className="truncate">{result.context}</span>}
                    <span className="font-mono shrink-0 ml-auto">
                      {result.center[1].toFixed(3)}, {result.center[0].toFixed(3)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p id="location-hint" className="text-[12px] text-ink-3 mt-1">
        También puedes arrastrar el número de la escena sobre el mapa.
      </p>
    </div>
  );
}
