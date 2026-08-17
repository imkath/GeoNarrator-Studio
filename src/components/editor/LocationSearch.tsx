'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X, Navigation } from 'lucide-react';
import { parseCoordinates } from '@/lib/coordinates';
import { searchPlaces, type Place } from '@/lib/geocoding';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function LocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Both the timer and any in-flight request have to be cancelled on unmount,
  // otherwise the fetch resolves against a component that is already gone.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestRef.current?.abort();
    };
  }, []);

  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setResults([]);
      return;
    }

    const coords = parseCoordinates(searchQuery);
    if (coords) {
      setResults([{
        id: 'coordinates',
        label: `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`,
        context: 'Coordinates',
        center: coords,
        zoom: 14,
        isCoordinate: true,
      }]);
      setIsLoading(false);
      setError(null);
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      setResults(
        await searchPlaces(searchQuery, MAPBOX_TOKEN, {
          near: [near.current.longitude, near.current.latitude],
          signal: controller.signal,
        })
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError('Failed to search locations');
      setResults([]);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  const handleSelectResult = (result: Place) => {
    if (!selectedChapterId) return;

    const [lng, lat] = result.center;
    // Moving the marker without moving the camera left the reader looking at
    // the whole country after picking a specific market.
    updateChapter(selectedChapterId, { longitude: lng, latitude: lat, zoom: result.zoom });

    setQuery(result.label);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="location-search"
        className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block"
      >
        Search Location
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
        </div>

        <input
          id="location-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search place or enter coordinates..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/10 transition-all"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (results.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/15 rounded-xl shadow-2xl shadow-black/70 overflow-hidden"
          >
            {error ? (
              <div className="px-4 py-3 text-sm text-red-400">{error}</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {results.map((result) => (
                  <li key={result.id} className="border-b border-white/5 last:border-0">
                    <button
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3 group"
                    >
                      <span className="mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {result.isCoordinate ? (
                          <Navigation className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                          {result.label}
                        </p>
                        {result.context && (
                          <p className="text-[10px] text-slate-400 truncate">{result.context}</p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-0.5 font-mono">
                          {result.center[1].toFixed(4)}, {result.center[0].toFixed(4)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[10px] text-slate-600 mt-2">
        Enter a place name or coordinates (e.g., -33.4489, -70.6693)
      </p>
    </div>
  );
}
