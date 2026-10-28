'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { flyDuration, keepTerrain } from '@/lib/map-setup';
import { styleUrl } from '@/lib/map-styles';
import DataLayers from '@/components/map/DataLayers';
import Legend from '@/components/map/Legend';
import { dms } from '@/components/preview/SceneCard';
import type { DataLayer } from '@/types';
import { FERIAS_URL, feriasLayer, LANDING_SCENES } from './scenes';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * The full-bleed landing map. A small readout in the corner prints the live
 * camera (centre, zoom, tilt, rotation) on every frame of a flight, written
 * straight into the DOM so the flight does not re-render React.
 */
export default function LandingMap({ scene }: { scene: number }) {
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [ferias, setFerias] = useState<DataLayer | null>(null);
  const readout = useRef<HTMLParagraphElement>(null);
  const frame = useRef<number | null>(null);

  const target = LANDING_SCENES[scene] ?? LANDING_SCENES[0];

  const writeReadout = useCallback(() => {
    frame.current = null;
    const map = mapRef.current?.getMap();
    if (!map || !readout.current) return;
    const c = map.getCenter();
    const lng = ((c.lng + 540) % 360) - 180;
    readout.current.textContent = `${dms(c.lat, 'N', 'S')} ${dms(lng, 'E', 'O')} · z${map
      .getZoom()
      .toFixed(1)} · ${Math.round(map.getPitch())}° · ${Math.round(map.getBearing())}°`;
  }, []);

  const onMove = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(writeReadout);
  }, [writeReadout]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  // On a wide screen the text takes the left side, so the camera aims at the
  // free half instead of the middle of the window.
  const padding = () =>
    typeof window !== 'undefined' && window.innerWidth >= 1024
      ? { left: Math.round(window.innerWidth * 0.36), right: 0, top: 0, bottom: 0 }
      : { left: 0, right: 0, top: 0, bottom: 0 };

  useEffect(() => {
    if (!loaded) return;
    mapRef.current?.flyTo({
      padding: padding(),
      center: [target.longitude, target.latitude],
      zoom: target.zoom,
      pitch: target.pitch,
      bearing: target.bearing,
      duration: flyDuration(4200),
      essential: true,
    });
  }, [loaded, target]);

  // The data scene is three screens down; the 8 KB file is fetched once the
  // map is up so it stays off the first paint and is ready in time.
  useEffect(() => {
    if (!loaded || ferias) return;
    const controller = new AbortController();
    fetch(FERIAS_URL, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((collection) => setFerias(feriasLayer(collection)))
      .catch(() => {
        // Without the file the scene still flies; it just shows no points.
      });
    return () => controller.abort();
  }, [loaded, ferias]);

  const layers = target.data && ferias ? [ferias] : [];

  if (!MAPBOX_TOKEN) return null;

  return (
    <>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={LANDING_SCENES[0]}
        style={{ width: '100%', height: '100%' }}
        mapStyle={styleUrl('satellite')}
        projection={{ name: 'globe' }}
        language="es"
        interactive={false}
        onLoad={() => {
          const map = mapRef.current?.getMap();
          if (map) {
            keepTerrain(map, 1.5);
            map.jumpTo({ padding: padding(), center: map.getCenter() });
          }
          setLoaded(true);
          writeReadout();
        }}
        onMove={onMove}
      >
        <DataLayers layers={layers} />
      </Map>

      <Legend layers={layers} className="absolute top-20 right-4 z-10" />

      <p
        ref={readout}
        aria-hidden="true"
        className="absolute bottom-9 right-3 z-10 font-mono text-[11px] text-ink/80 tabular pointer-events-none [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]"
      />
    </>
  );
}
