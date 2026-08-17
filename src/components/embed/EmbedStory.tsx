'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Map, { type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Chapter } from '@/types';
import { MAP_STYLES } from '@/store/useStoryStore';
import { decodeStory } from '@/lib/story-codec';
import DataLayers from '@/components/map/DataLayers';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Rendered with ssr: false by the route, so react-map-gl is imported directly
 * rather than through next/dynamic. A dynamic() wrapper does not forward refs:
 * mapRef stayed null, onLoad never fired, and the story scrolled while the map
 * sat still.
 */
export default function EmbedStory() {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { data, error } = useMemo(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) return { data: null, error: 'This URL does not carry a story' };
    try {
      return { data: decodeStory(dataParam), error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }, [searchParams]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && !map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    }
    setMapLoaded(true);
  }, []);

  const flyToChapter = useCallback((chapter: Chapter) => {
    mapRef.current?.flyTo({
      center: [chapter.longitude, chapter.latitude],
      zoom: chapter.zoom,
      pitch: chapter.pitch,
      bearing: chapter.bearing,
      duration: 3500,
      essential: true,
    });
  }, []);

  useEffect(() => {
    if (!data || !mapLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = chapterRefs.current.indexOf(entry.target as HTMLDivElement);
          const chapter = data.chapters[index];
          if (!chapter) continue;
          setActiveChapterId(chapter.id);
          flyToChapter(chapter);
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    for (const ref of chapterRefs.current) {
      if (ref) observer.observe(ref);
    }
    return () => observer.disconnect();
  }, [data, mapLoaded, flyToChapter]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <p className="text-slate-400 text-center text-sm">
          This embed needs a Mapbox token to draw the map.
        </p>
      </div>
    );
  }

  const currentStyleUrl =
    MAP_STYLES.find((s) => s.id === data.mapStyle)?.url ?? MAP_STYLES[0].url;
  const activeIndex = Math.max(0, data.chapters.findIndex((c) => c.id === activeChapterId));
  const activeChapter = data.chapters[activeIndex];
  const progress = ((activeIndex + 1) / data.chapters.length) * 100;

  const allLayers = data.layers ?? [];
  const visibleLayers = activeChapter.visibleLayerIds
    ? allLayers.filter((l) => activeChapter.visibleLayerIds!.includes(l.id))
    : allLayers;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: data.chapters[0].longitude,
            latitude: data.chapters[0].latitude,
            zoom: data.chapters[0].zoom,
            pitch: data.chapters[0].pitch,
            bearing: data.chapters[0].bearing,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={currentStyleUrl}
          projection={{ name: 'globe' }}
          onLoad={handleMapLoad}
          interactive={false}
          // The editor had this and the embed did not, which is most of why the
          // same scene looked flat once shared: without fog there is no horizon,
          // no sky and no aerial perspective, so a tilted camera reads as a
          // cropped plane rather than a view over terrain.
          fog={{
            range: [0.5, 10],
            color: '#242B4B',
            'horizon-blend': 0.3,
            'high-color': '#add8e6',
            'space-color': '#0b0c21',
            'star-intensity': 0.8,
          }}
        >
          <DataLayers layers={visibleLayers} />
        </Map>
      </div>

      {/* Solo se atenúa la banda del texto: el mapa es lo que se vino a ver. */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none bg-gradient-to-r from-slate-950/85 via-slate-950/25 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32 z-[5] pointer-events-none bg-gradient-to-t from-slate-950/70 to-transparent"
        aria-hidden="true"
      />

      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Sin esto la historia se puede recorrer mientras el mapa aún carga:
          el texto avanza y el mapa se queda en la primera escena. */}
      <AnimatePresence>
        {!mapLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-30 bg-slate-950 flex flex-col items-center justify-center gap-4"
            role="status"
            aria-live="polite"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
              aria-hidden="true"
            />
            <div className="text-center px-8">
              <p className="text-sm text-slate-300">Cargando el mapa</p>
              <p className="text-xs text-slate-500 mt-1">
                {data.chapters.length} escenas · la historia empieza cuando termine
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* An embed is usually a short iframe on someone else's page. Without a
          cue it reads as a dead map: the first card sits below the fold and
          nothing says the story moves. Hidden once the reader scrolls. */}
      <AnimatePresence>
        {mapLoaded && activeIndex === 0 && !hasScrolled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none"
          >
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/70">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-5 h-8 rounded-full border border-white/40 flex items-start justify-center p-1"
              aria-hidden="true"
            >
              <span className="w-1 h-1.5 rounded-full bg-white/70" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onScroll={(e) => {
          if (!hasScrolled && e.currentTarget.scrollTop > 8) setHasScrolled(true);
        }}
        className={`absolute inset-0 z-10 ${mapLoaded ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {/* No spacer before the first scene. An 80vh one opened the embed on a
            screen of nothing, and shrinking it was worse: the card landed on
            screen but outside the -30% band that reveals it, so it rendered
            transparent. Starting at zero puts scene one in the middle of both. */}
        {data.chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            ref={(el) => {
              chapterRefs.current[index] = el;
            }}
            className="min-h-screen flex items-center px-4 sm:px-8"
          >
            {/* Driven by the same observer that flies the map, not by Framer's
                whileInView. That never fired for scene one: the card mounts
                already inside the viewport, so no intersection change followed,
                and it stayed at its initial opacity 0 in plain sight. */}
            <motion.div
              animate={
                activeIndex === index
                  ? { opacity: 1, x: 0, filter: 'blur(0px)' }
                  : { opacity: 0.3, x: -20, filter: 'blur(4px)' }
              }
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md"
            >
              <div
                className={`relative bg-slate-950/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border transition-all duration-500 ${
                  activeChapterId === chapter.id ? 'border-white/20' : 'border-white/5'
                }`}
              >
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

                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
                  {chapter.title}
                </h2>
                <p className="text-slate-300 leading-relaxed">{chapter.content}</p>
              </div>
            </motion.div>
          </div>
        ))}

        <div className="h-[50vh]" />
      </div>
    </div>
  );
}
