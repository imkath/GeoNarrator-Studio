'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Map, { type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Chapter } from '@/types';
import { styleUrl } from '@/lib/map-styles';
import { flyDuration, keepTerrain } from '@/lib/map-setup';
import { decodeStory } from '@/lib/story-codec';
import DataLayers from '@/components/map/DataLayers';
import Legend from '@/components/map/Legend';
import SceneCard from '@/components/preview/SceneCard';
import { Mark } from '@/components/ui/Logo';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-paper flex items-center justify-center p-6">
      <div className="max-w-sm">
        <Mark className="w-7 h-7 mb-4" />
        <h1 className="text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">{children}</p>
      </div>
    </main>
  );
}

/**
 * Rendered with ssr: false by the route, so react-map-gl is imported directly
 * rather than through next/dynamic. A dynamic() wrapper does not forward refs:
 * mapRef stayed null, onLoad never fired, and the story scrolled while the map
 * sat still.
 */
export default function EmbedStory() {
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { data, error } = useMemo(() => {
    const dataParam = searchParams.get('data');
    if (!dataParam) return { data: null, error: 'Este enlace no trae ninguna historia.' };
    try {
      return { data: decodeStory(dataParam), error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }, [searchParams]);

  useEffect(() => {
    if (data?.name) document.title = `${data.name} | GeoNarrator`;
  }, [data]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) keepTerrain(map);
    setMapLoaded(true);
  }, []);

  const flyToChapter = useCallback((chapter: Chapter) => {
    mapRef.current?.flyTo({
      center: [chapter.longitude, chapter.latitude],
      zoom: chapter.zoom,
      pitch: chapter.pitch,
      bearing: chapter.bearing,
      duration: flyDuration(3200),
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
          setActiveIndex(index);
          flyToChapter(chapter);
        }
      },
      { root: scrollRef.current, rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );
    for (const ref of chapterRefs.current) if (ref) observer.observe(ref);
    return () => observer.disconnect();
  }, [data, mapLoaded, flyToChapter]);

  if (error) {
    return (
      <Notice title="No se pudo abrir la historia">
        {error} Pide a quien la compartió que copie de nuevo el código desde el editor.
      </Notice>
    );
  }
  if (!data) return <div className="min-h-dvh bg-paper" />;
  if (!MAPBOX_TOKEN) {
    return <Notice title="Falta el mapa">Esta copia del sitio no tiene un token de Mapbox configurado.</Notice>;
  }

  const first = data.chapters[0];
  const activeChapter = data.chapters[activeIndex] ?? first;
  const allLayers = data.layers ?? [];
  const visibleLayers = activeChapter.visibleLayerIds
    ? allLayers.filter((l) => activeChapter.visibleLayerIds!.includes(l.id))
    : allLayers;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-paper-2">
      <div className="absolute inset-0">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: first.longitude,
            latitude: first.latitude,
            zoom: first.zoom,
            pitch: first.pitch,
            bearing: first.bearing,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={styleUrl(data.mapStyle)}
          projection={{ name: 'globe' }}
        language="es"
          onLoad={handleMapLoad}
          onError={() => !mapLoaded && setMapFailed(true)}
          interactive={false}
        >
          <DataLayers layers={visibleLayers} />
        </Map>
      </div>

      <Legend layers={visibleLayers} className="absolute top-3 right-3 z-20 hidden sm:block" />

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-paper border border-ink rounded-[2px] px-2 py-1 text-[11px] font-semibold hover:bg-paper-2"
      >
        <Mark className="w-4 h-4" />
        GeoNarrator<span className="sr-only"> (se abre en una pestaña nueva)</span>
      </a>

      {/* Without this the story could be scrolled while the map was still
          loading: the text moved on and the map stayed on scene one. */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-30 bg-paper flex items-center justify-center p-8" role="status" aria-live="polite">
          <p className={`text-sm text-center ${mapFailed ? 'text-danger' : 'text-ink-2'}`}>
            {mapFailed
              ? 'El mapa no cargó. Recarga la página para intentarlo de nuevo.'
              : `Cargando el mapa · ${data.chapters.length} escenas`}
          </p>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={(e) => {
          if (!hasScrolled && e.currentTarget.scrollTop > 8) setHasScrolled(true);
        }}
        className={`absolute inset-0 z-10 ${mapLoaded ? 'overflow-y-auto' : 'overflow-hidden'}`}
        aria-label={data.name ?? 'Historia'}
      >
        {/* No spacer before scene one: it has to land in the middle band that
            reveals it, or it mounts in plain sight and never activates. */}
        {data.chapters.map((chapter, index) => (
          <div
            key={chapter.id}
            ref={(el) => {
              chapterRefs.current[index] = el;
            }}
            className="min-h-dvh flex items-end sm:items-center px-3 sm:px-8 pb-14 sm:pb-0"
          >
            <SceneCard chapter={chapter} index={index} total={data.chapters.length} active={activeIndex === index} />
          </div>
        ))}
        <div className="h-[50dvh]" />
      </div>

      {/* An embed is usually a short iframe in someone else's page. Without a
          cue it reads as a still map. Gone once the reader scrolls. */}
      {mapLoaded && !hasScrolled && data.chapters.length > 1 && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-ink text-paper rounded-[2px] px-3 py-1.5 text-[12px] font-semibold pointer-events-none animate-[fade_300ms_ease-out]">
          Desliza para seguir la historia
        </p>
      )}
    </div>
  );
}
