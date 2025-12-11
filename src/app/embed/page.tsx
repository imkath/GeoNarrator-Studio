'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Chapter } from '@/types';
import { MapStyle, MAP_STYLES } from '@/store/useStoryStore';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.default),
  { ssr: false }
);

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface EmbedData {
  chapters: Chapter[];
  mapStyle: MapStyle;
}

function EmbedContent() {
  const searchParams = useSearchParams();
  const mapRef = useRef<any>(null);
  const [data, setData] = useState<EmbedData | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Parse data from URL
  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) {
      setError('No story data provided');
      return;
    }

    try {
      const decoded = atob(dataParam);
      const parsed = JSON.parse(decoded) as EmbedData;

      if (!parsed.chapters || parsed.chapters.length === 0) {
        setError('Invalid story data');
        return;
      }

      setData(parsed);
      setActiveChapterId(parsed.chapters[0].id);
    } catch {
      setError('Failed to load story data');
    }
  }, [searchParams]);

  // Setup map
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    try {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      map.setFog({
        range: [0.5, 10],
        color: '#242B4B',
        'horizon-blend': 0.3,
        'high-color': '#add8e6',
        'space-color': '#0b0c21',
        'star-intensity': 0.8,
      });
    } catch {
      // Source might already exist
    }

    setMapLoaded(true);
  }, []);

  // Fly to chapter
  const flyToChapter = useCallback((chapter: Chapter) => {
    if (!mapRef.current || !mapLoaded) return;

    mapRef.current.flyTo({
      center: [chapter.longitude, chapter.latitude],
      zoom: chapter.zoom,
      pitch: chapter.pitch,
      bearing: chapter.bearing,
      duration: 3500,
      essential: true,
    });
  }, [mapLoaded]);

  // Intersection Observer for chapters
  useEffect(() => {
    if (!data || !mapLoaded) return;

    const observers: IntersectionObserver[] = [];

    chapterRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const chapter = data.chapters[index];
              setActiveChapterId(chapter.id);
              flyToChapter(chapter);
            }
          });
        },
        { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [data, mapLoaded, flyToChapter]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data || !MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  const currentStyleUrl = MAP_STYLES.find(s => s.id === data.mapStyle)?.url || MAP_STYLES[0].url;
  const activeChapter = data.chapters.find(c => c.id === activeChapterId) || data.chapters[0];
  const progress = ((data.chapters.findIndex(c => c.id === activeChapterId) + 1) / data.chapters.length) * 100;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* Map */}
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: activeChapter.longitude,
            latitude: activeChapter.latitude,
            zoom: activeChapter.zoom,
            pitch: activeChapter.pitch,
            bearing: activeChapter.bearing,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={currentStyleUrl}
          projection={{ name: 'globe' }}
          onLoad={handleMapLoad}
          interactive={false}
        />
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Story overlay */}
      <div className="absolute inset-0 overflow-y-auto z-10">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="h-[30vh]" />
        </div>

        {data.chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            ref={(el) => { chapterRefs.current[index] = el; }}
            className="min-h-screen flex items-center px-4 sm:px-8"
          >
            <motion.div
              initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, margin: '-30%' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md"
            >
              {/* Glow effect */}
              {activeChapterId === chapter.id && (
                <motion.div
                  layoutId="chapterGlow"
                  className="absolute -inset-2 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3))',
                    filter: 'blur(20px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}

              <div className={`
                relative bg-slate-950/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8
                border transition-all duration-500
                ${activeChapterId === chapter.id ? 'border-white/20' : 'border-white/5'}
              `}>
                {/* Chapter number */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  {chapter.pitch > 10 && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                      3D View
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
                  {chapter.title}
                </h2>

                {/* Content */}
                <p className="text-slate-300 leading-relaxed">
                  {chapter.content}
                </p>
              </div>
            </motion.div>
          </div>
        ))}

        {/* End spacer */}
        <div className="h-[50vh]" />
      </div>

      {/* Branding */}
      <div className="absolute bottom-4 right-4 z-20">
        <a
          href="https://geonarrator.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-xl rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2C14.5 2 16.5 6.5 16.5 12C16.5 17.5 14.5 22 12 22" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>Made with GeoNarrator</span>
        </a>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
        />
      </div>
    }>
      <EmbedContent />
    </Suspense>
  );
}
