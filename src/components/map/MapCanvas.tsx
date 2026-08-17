'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/mapbox';
import { useStoryStore, MAP_STYLES } from '@/store/useStoryStore';
import DataLayers from './DataLayers';
import Legend from './Legend';
import type { CameraState } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapCanvas() {
  const mapRef = useRef<MapRef>(null);
  const [isGlobeReady, setIsGlobeReady] = useState(false);

  const {
    chapters,
    mode,
    selectedChapterId,
    activeChapterId,
    isMapLoaded,
    mapStyle,
    setIsMapLoaded,
    setCurrentCamera,
    setSelectedChapterId,
    updateChapter,
    layersVisibleIn
  } = useStoryStore();

  const currentStyleUrl = MAP_STYLES.find(s => s.id === mapStyle)?.url || MAP_STYLES[0].url;

  const targetChapterId = mode === 'edit' ? selectedChapterId : activeChapterId;
  const targetChapter = chapters.find(c => c.id === targetChapterId);
  const visibleLayers = layersVisibleIn(targetChapter);

  useEffect(() => {
    if (!mapRef.current || !targetChapter || !isMapLoaded) return;

    mapRef.current.flyTo({
      center: [targetChapter.longitude, targetChapter.latitude],
      zoom: targetChapter.zoom,
      pitch: targetChapter.pitch,
      bearing: targetChapter.bearing,
      duration: 3500,
      essential: true
    });
  }, [targetChapter, isMapLoaded, targetChapterId]);

  // onMove fires every frame: writing the store there re-rendered the whole
  // editor around 60 times per second for the 3.5s of each flyTo. The camera
  // only matters once the movement settles, which is what Quick Capture reads.
  const handleMoveEnd = useCallback((evt: { viewState: CameraState }) => {
    const { longitude, latitude, zoom, pitch, bearing } = evt.viewState;
    setCurrentCamera({ longitude, latitude, zoom, pitch, bearing });
  }, [setCurrentCamera]);

  const handleLoad = useCallback(() => {
    setIsMapLoaded(true);

    // Terrain and fog are declared as <Map> props; this only registers the DEM
    // source those props point at.
    const map = mapRef.current?.getMap();
    if (map && !map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
    }

    setIsGlobeReady(true);
  }, [setIsMapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <p className="text-red-400">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: chapters[0]?.longitude ?? -70.6693,
          latitude: chapters[0]?.latitude ?? -33.4489,
          zoom: chapters[0]?.zoom ?? 4,
          pitch: chapters[0]?.pitch ?? 0,
          bearing: chapters[0]?.bearing ?? 0,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={currentStyleUrl}
        projection={{ name: 'globe' }}
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        fog={{
          range: [0.5, 10],
          color: '#242B4B',
          'horizon-blend': 0.3,
          'high-color': '#add8e6',
          'space-color': '#0b0c21',
          'star-intensity': 0.8
        }}
        reuseMaps
      >
        <NavigationControl position="top-right" />

        <DataLayers layers={visibleLayers} />

        <AnimatePresence>
          {chapters.map((chapter) => {
            const isActive = targetChapterId === chapter.id;
            const isDraggable = mode === 'edit';
            return (
              <Marker
                key={chapter.id}
                longitude={chapter.longitude}
                latitude={chapter.latitude}
                anchor="bottom"
                draggable={isDraggable}
                onDragStart={() => {
                  if (mode === 'edit') {
                    setSelectedChapterId(chapter.id);
                  }
                }}
                onDragEnd={(e) => {
                  if (mode === 'edit') {
                    updateChapter(chapter.id, {
                      longitude: e.lngLat.lng,
                      latitude: e.lngLat.lat
                    });
                  }
                }}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  if (mode === 'edit') {
                    setSelectedChapterId(chapter.id);
                  }
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    opacity: 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.4 }}
                  className={`relative group ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                >
                  <div
                    className={`
                      transition-all duration-300
                      ${isActive
                        ? 'text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]'
                        : 'text-slate-400 hover:text-slate-200'
                      }
                    `}
                  >
                    <MapPin className="w-8 h-8" strokeWidth={2} />
                  </div>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10">
                      {chapter.title}
                      {isDraggable && <span className="text-slate-500 ml-1">· Drag to move</span>}
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      className="absolute inset-0 -z-10"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500/30" />
                    </motion.div>
                  )}
                </motion.div>
              </Marker>
            );
          })}
        </AnimatePresence>
      </Map>

      <Legend layers={visibleLayers} />

      <AnimatePresence>
        {!isGlobeReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
            />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-sm text-slate-400 font-mono tracking-wider"
            >
              Loading map
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'edit' && isGlobeReady && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-6 right-6 flex flex-col gap-2 pointer-events-none z-10"
        >
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center gap-3">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-medium">Right Click + Drag</kbd>
            <span className="text-slate-400">Rotate</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center gap-3">
            <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-medium">Ctrl + Drag</kbd>
            <span className="text-slate-400">Pitch</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
