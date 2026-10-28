import { GeoJSONError, parseGeoJSON } from './geojson';

// Parsing a large file is one long synchronous JSON.parse plus a walk over
// every feature. Off the main thread, the editor keeps responding meanwhile.
self.onmessage = (event: MessageEvent<string>) => {
  try {
    self.postMessage({ ok: true, parsed: parseGeoJSON(event.data) });
  } catch (err) {
    self.postMessage({
      ok: false,
      error: err instanceof GeoJSONError ? err.message : 'No se pudo leer el archivo.',
    });
  }
};
