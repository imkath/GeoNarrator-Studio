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

/** Print scale at the centre of the view, as a printed sheet would state it. */
function scaleLabel(zoom: number, latitude: number) {
  // Mapbox uses 512 px tiles; 96 dpi screen.
  const metresPerPixel = (78271.517 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
  const denominator = metresPerPixel * (96 / 0.0254);
  const magnitude = 10 ** Math.floor(Math.log10(denominator) - 1);
  return `1:${(Math.round(denominator / magnitude) * magnitude).toLocaleString('es-CL')}`;
}

/**
 * The landing map, framed like a map sheet. The corner coordinates, the scale
 * and the camera readout are the live values of the camera, written straight
 * into the DOM on each frame so a flight does not re-render React.
 */
export default function LandingMap({ scene }: { scene: number }) {
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ferias, setFerias] = useState<DataLayer | null>(null);
  const nw = useRef<HTMLSpanElement>(null);
  const se = useRef<HTMLSpanElement>(null);
  const scale = useRef<HTMLSpanElement>(null);
  const camera = useRef<HTMLSpanElement>(null);
  const frame = useRef<number | null>(null);

  const target = LANDING_SCENES[scene] ?? LANDING_SCENES[0];

  const writeReadout = useCallback(() => {
    frame.current = null;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const c = map.getCenter();
    const lng = (x: number) => dms(((x + 540) % 360) - 180, 'E', 'O');
    // Corner coordinates only mean something on a flat sheet. Zoomed out to
    // the globe the bounds wrap the planet, so the readout gives the centre.
    const b = map.getZoom() >= 5 ? map.getBounds() : null;
    if (nw.current && se.current) {
      if (b) {
        nw.current.textContent = `${dms(b.getNorth(), 'N', 'S')} ${lng(b.getWest())}`;
        se.current.textContent = `${dms(b.getSouth(), 'N', 'S')} ${lng(b.getEast())}`;
      } else {
        nw.current.textContent = `centro ${dms(c.lat, 'N', 'S')} ${lng(c.lng)}`;
        se.current.textContent = '';
      }
    }
    if (scale.current) scale.current.textContent = `escala ${scaleLabel(map.getZoom(), c.lat)}`;
    if (camera.current) {
      camera.current.textContent = `z${map.getZoom().toFixed(1)} · inclinación ${Math.round(map.getPitch())}° · rotación ${Math.round(map.getBearing())}°`;
    }
  }, []);

  const onMove = useCallback(() => {
    if (frame.current === null) frame.current = requestAnimationFrame(writeReadout);
  }, [writeReadout]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    mapRef.current?.flyTo({
      center: [target.longitude, target.latitude],
      zoom: target.zoom,
      pitch: target.pitch,
      bearing: target.bearing,
      duration: flyDuration(3400),
      essential: true,
    });
  }, [loaded, target]);

  // The data scene is two screens away from the top; fetching the 8 KB file
  // once the map is up keeps it off the first paint and ready in time.
  useEffect(() => {
    if (!loaded || ferias) return;
    const controller = new AbortController();
    fetch(FERIAS_URL, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((collection) => setFerias(feriasLayer(collection)))
      .catch(() => {
        // Without the file scene three still flies; it just shows no points.
      });
    return () => controller.abort();
  }, [loaded, ferias]);

  const layers = target.data && ferias ? [ferias] : [];

  return (
    <figure className="h-full flex flex-col">
      <div className="flex justify-between gap-4 font-mono text-[10px] sm:text-[11px] text-ink-2 pb-1 tabular" aria-hidden="true">
        <span ref={nw}>&nbsp;</span>
        <span ref={scale} className="hidden sm:inline" />
      </div>

      <div className="relative flex-1 min-h-0 border-[1.5px] border-ink bg-paper-2">
        {MAPBOX_TOKEN ? (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={LANDING_SCENES[0]}
            style={{ width: '100%', height: '100%' }}
            mapStyle={styleUrl('outdoors')}
            projection={{ name: 'globe' }}
            interactive={false}
            language="es"
            onLoad={() => {
              const map = mapRef.current?.getMap();
              if (map) keepTerrain(map, 1.5);
              setLoaded(true);
              writeReadout();
            }}
            onMove={onMove}
            onError={() => !loaded && setFailed(true)}
          >
            <DataLayers layers={layers} />
          </Map>
        ) : null}

        {!loaded && (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-sm text-ink-2 text-center">
            {failed || !MAPBOX_TOKEN ? 'El mapa no cargó. El resto de la página se puede leer igual.' : 'Cargando el mapa…'}
          </p>
        )}

        <Legend layers={layers} className="absolute top-2 left-2 z-10" />
      </div>

      <figcaption className="flex justify-between gap-4 font-mono text-[10px] sm:text-[11px] text-ink-2 pt-1 tabular">
        <span ref={camera} aria-hidden="true" />
        <span ref={se} aria-hidden="true" className="hidden sm:inline" />
        <span className="sr-only">Mapa de demostración que acompaña el texto de cada escena.</span>
      </figcaption>
    </figure>
  );
}
