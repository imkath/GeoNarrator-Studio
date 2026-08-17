'use client';

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import type { MapRef } from 'react-map-gl/mapbox';
import { Chapter } from '@/types';
import { MAP_STYLES } from '@/store/useStoryStore';
import { decodeStory } from '@/lib/story-codec';
import DataLayers from '@/components/map/DataLayers';

const Map = dynamic(() => import('react-map-gl/mapbox').then((mod) => mod.default), {
  ssr: false,
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const Spinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
  />
);

function EmbedContent() {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Derived rather than state: decoding inside an effect forced a synchronous
  // setState and an extra blank render.
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
    if (!map) return;

    if (!map.getSource('mapbox-dem')) {
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

  const flyToChapter = useCallback(
    (chapter: Chapter) => {
      if (!mapRef.current || !mapLoaded) return;
      mapRef.current.flyTo({
        center: [chapter.longitude, chapter.latitude],
        zoom: chapter.zoom,
        pitch: chapter.pitch,
        bearing: chapter.bearing,
        duration: 3500,
        essential: true,
      });
    },
    [mapLoaded]
  );

  // One observer for every scene instead of one observer per scene.
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

  if (!data || !MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const currentStyleUrl =
    MAP_STYLES.find((s) => s.id === data.mapStyle)?.url ?? MAP_STYLES[0].url;
  const activeIndex = Math.max(
    0,
    data.chapters.findIndex((c) => c.id === activeChapterId)
  );
  const activeChapter = data.chapters[activeIndex];
  const allLayers = data.layers ?? [];
  const visibleLayers = activeChapter.visibleLayerIds
    ? allLayers.filter((l) => activeChapter.visibleLayerIds!.includes(l.id))
    : allLayers;
  const progress = ((activeIndex + 1) / data.chapters.length) * 100;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
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
        >
          <DataLayers layers={visibleLayers} />
        </Map>
      </div>

      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20 z-20">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="absolute inset-0 overflow-y-auto z-10">
        <div className="h-[80vh]" />

        {data.chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            ref={(el) => {
              chapterRefs.current[index] = el;
            }}
            className="min-h-screen flex items-center px-4 sm:px-8"
          >
            <motion.div
              initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              viewport={{ once: false, margin: '-30%' }}
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

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <EmbedContent />
    </Suspense>
  );
}
