'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, X, Navigation } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type: string[];
}

interface GeocodingResponse {
  features: SearchResult[];
}

export default function LocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { selectedChapterId, updateChapter } = useStoryStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse coordinates from string (supports various formats)
  const parseCoordinates = (input: string): [number, number] | null => {
    // Remove extra spaces and common separators
    const cleaned = input.trim().replace(/\s+/g, ' ');

    // Try matching common coordinate formats
    // Format: "lat, lng" or "lat lng" or "lat,lng"
    const patterns = [
      /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/, // Simple: -33.4489, -70.6693
      /^(-?\d+\.?\d*)°?\s*([NS])?[,\s]+(-?\d+\.?\d*)°?\s*([EW])?$/i, // With directions
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let lat = parseFloat(match[1]);
        let lng = parseFloat(match[2] || match[3]);

        // Handle N/S/E/W suffixes
        if (match[2]?.toUpperCase() === 'S') lat = -Math.abs(lat);
        if (match[4]?.toUpperCase() === 'W') lng = -Math.abs(lng);

        // Validate ranges
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return [lng, lat]; // Return as [lng, lat] for Mapbox
        }
      }
    }
    return null;
  };

  const searchLocation = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !MAPBOX_TOKEN) {
      setResults([]);
      return;
    }

    // First, check if it's coordinates
    const coords = parseCoordinates(searchQuery);
    if (coords) {
      setResults([{
        id: 'coordinates',
        place_name: `Coordinates: ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`,
        center: coords,
        place_type: ['coordinate']
      }]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,locality,neighborhood,address,poi`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: GeocodingResponse = await response.json();
      setResults(data.features || []);
    } catch (err) {
      setError('Failed to search locations');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    if (!selectedChapterId) return;

    const [lng, lat] = result.center;
    updateChapter(selectedChapterId, {
      longitude: lng,
      latitude: lat
    });

    setQuery(result.place_name);
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getPlaceTypeIcon = (placeTypes: string[]) => {
    if (placeTypes.includes('coordinate')) {
      return <Navigation className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <MapPin className="w-3.5 h-3.5 text-indigo-400" />;
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">
        Search Location
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
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
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {isOpen && (results.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {error ? (
              <div className="px-4 py-3 text-sm text-red-400">{error}</div>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {results.map((result) => (
                  <motion.li
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/5 last:border-0"
                  >
                    <button
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3 group"
                    >
                      <span className="mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {getPlaceTypeIcon(result.place_type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate group-hover:text-indigo-300 transition-colors">
                          {result.place_name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {result.center[1].toFixed(4)}, {result.center[0].toFixed(4)}
                        </p>
                      </div>
                    </button>
                  </motion.li>
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
