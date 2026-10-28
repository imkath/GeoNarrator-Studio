'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl/mapbox';
import { useStoryStore } from '@/store/useStoryStore';
import { styleUrl } from '@/lib/map-styles';
import { flyDuration, keepTerrain } from '@/lib/map-setup';
import DataLayers from './DataLayers';
import Legend from './Legend';
import SceneMarker from './SceneMarker';
import type { CameraState } from '@/types';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapCanvas() {
  const mapRef = useRef<MapRef>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    layersVisibleIn,
    pendingBounds,
    setPendingBounds,
  } = useStoryStore();

  // A freshly loaded layer is framed once, so it is visible before anyone
  // decides which scene should show it.
  useEffect(() => {
    if (!pendingBounds || !isMapLoaded || !mapRef.current) return;
    const [w, s, e, n] = pendingBounds;
    mapRef.current.fitBounds(
      [
        [w, s],
        [e, n],
      ],
      { padding: 48, pitch: 0, bearing: 0, duration: flyDuration(1500), maxZoom: 15 }
    );
    setPendingBounds(null);
  }, [pendingBounds, isMapLoaded, setPendingBounds]);

  // Leaving edit mode removes the sidebar and the container grows, but the
  // WebGL canvas keeps its old size and leaves a blank band on the right.
  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.resize(), 350);
    return () => clearTimeout(timer);
  }, [mode]);

  // The store is not reset when the editor unmounts, so a second visit would
  // otherwise start with isMapLoaded already true and fly before the map exists.
  useEffect(() => () => setIsMapLoaded(false), [setIsMapLoaded]);

  const targetChapterId = mode === 'edit' ? selectedChapterId : activeChapterId;
  const targetChapter = chapters.find((c) => c.id === targetChapterId);
  const visibleLayers = layersVisibleIn(targetChapter);

  // Depends on the camera numbers, not on the chapter object: typing in the
  // title creates a new object on every key, and that used to restart a
  // 3.5 s flight with each character, cancelling any manual panning.
  const lng = targetChapter?.longitude;
  const lat = targetChapter?.latitude;
  const zoom = targetChapter?.zoom;
  const pitch = targetChapter?.pitch;
  const bearing = targetChapter?.bearing;
  const lastFlownId = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || lng === undefined || lat === undefined) return;

    // A new scene earns the full flight; nudging a slider on the same scene
    // should answer right away.
    const switching = lastFlownId.current !== targetChapterId;
    lastFlownId.current = targetChapterId;

    map.flyTo({
      center: [lng, lat],
      zoom,
      pitch,
      bearing,
      duration: flyDuration(switching ? 3200 : 700),
      essential: true,
    });
  }, [targetChapterId, isMapLoaded, lng, lat, zoom, pitch, bearing]);

  // onMove fires every frame; the camera only matters once it settles, which
  // is what "Capturar la vista" reads.
  const handleMoveEnd = useCallback(
    (evt: { viewState: CameraState }) => {
      const { longitude, latitude, zoom, pitch, bearing } = evt.viewState;
      setCurrentCamera({ longitude, latitude, zoom, pitch, bearing });
    },
    [setCurrentCamera]
  );

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) keepTerrain(map);
    setIsMapLoaded(true);
    setIsReady(true);
  }, [setIsMapLoaded]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-paper-2 p-8">
        <p className="text-sm text-ink-2 max-w-sm text-center">
          Falta el token de Mapbox (<code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code>), así que el mapa no
          puede cargar.
        </p>
      </div>
    );
  }

  const first = chapters[0];

  return (
    <div className="relative w-full h-full bg-paper-2">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: first?.longitude ?? -70.6693,
          latitude: first?.latitude ?? -33.4489,
          zoom: first?.zoom ?? 4,
          pitch: first?.pitch ?? 0,
          bearing: first?.bearing ?? 0,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={styleUrl(mapStyle)}
        projection={{ name: 'globe' }}
        language="es"
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        onError={(e) => {
          // Tile hiccups also land here; only a map that never loaded is a
          // failure worth interrupting the editor for.
          if (!isReady) {
            const status = (e.error as { status?: number } | undefined)?.status;
            setLoadError(
              status === 401 || status === 403
                ? 'Mapbox rechazó el token de este sitio, así que el mapa no puede cargar.'
                : 'No se pudo cargar el mapa. Revisa la conexión y recarga la página.'
            );
          }
        }}
        reuseMaps
      >
        <NavigationControl position="top-right" visualizePitch />

        <DataLayers layers={visibleLayers} />

        {chapters.map((chapter, index) => {
          const isActive = targetChapterId === chapter.id;
          const editable = mode === 'edit';
          return (
            <Marker
              key={chapter.id}
              longitude={chapter.longitude}
              latitude={chapter.latitude}
              anchor="center"
              draggable={editable}
              style={{ zIndex: isActive ? 2 : 1 }}
              onDragStart={() => editable && setSelectedChapterId(chapter.id)}
              onDragEnd={(e) => {
                if (editable) {
                  updateChapter(chapter.id, { longitude: e.lngLat.lng, latitude: e.lngLat.lat });
                }
              }}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (editable) setSelectedChapterId(chapter.id);
              }}
            >
              <SceneMarker
                number={index + 1}
                title={chapter.title}
                active={isActive}
                hint={editable ? 'arrastra para moverla' : undefined}
              />
            </Marker>
          );
        })}
      </Map>

      <Legend layers={visibleLayers} />

      {!isReady && (
        <div
          className="absolute inset-0 z-40 bg-paper flex items-center justify-center p-8"
          role="status"
          aria-live="polite"
        >
          <p className={`text-sm text-center max-w-xs ${loadError ? 'text-danger' : 'text-ink-2'}`}>
            {loadError ?? 'Cargando el mapa…'}
          </p>
        </div>
      )}

      {mode === 'edit' && isReady && (
        <p className="absolute top-3 left-3 z-10 hidden lg:[@media(pointer:fine)]:block bg-paper border border-rule rounded-[2px] px-2.5 py-1.5 text-[11px] text-ink-2 pointer-events-none">
          Arrastra para moverte · <span className="font-semibold text-ink">clic derecho</span> y arrastra para
          girar o inclinar
        </p>
      )}
    </div>
  );
}
