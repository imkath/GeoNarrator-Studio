import { Chapter, DataLayer } from '@/types';
import { isMapStyle, type MapStyle } from '@/lib/map-styles';
import { ProjectError, validateChapters, validateLayers } from '@/lib/validate';

export interface EmbedPayload {
  chapters: Chapter[];
  mapStyle: MapStyle;
  layers?: DataLayer[];
  /** Story name, shown as the embed page title. Optional for older links. */
  name?: string;
}

// btoa only accepts Latin-1, so an emoji or a curly quote in a scene threw
// InvalidCharacterError. Encode to UTF-8 first and use the base64url alphabet
// so the result survives a query string untouched.
export function encodeStory(payload: EmbedPayload): string {
  const utf8 = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of utf8) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeStory(encoded: string): EmbedPayload {
  let parsed: { chapters?: unknown; layers?: unknown; mapStyle?: unknown; name?: unknown };
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ProjectError('El enlace está cortado o no contiene una historia.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ProjectError('El enlace no contiene una historia.');
  }

  return {
    chapters: validateChapters(parsed.chapters),
    ...(parsed.layers !== undefined ? { layers: validateLayers(parsed.layers) } : {}),
    mapStyle: isMapStyle(parsed.mapStyle) ? parsed.mapStyle : 'satellite',
    ...(typeof parsed.name === 'string' && parsed.name.trim() ? { name: parsed.name.slice(0, 100) } : {}),
  };
}

// Browsers start truncating URLs past roughly this length.
export const MAX_EMBED_URL_LENGTH = 2000;

export interface EmbedResult {
  encoded: string;
  /** Layers left out because the URL would have been unusable. */
  droppedLayers: DataLayer[];
  length: number;
}

/**
 * Builds the embed payload, dropping data layers when they do not fit. A story
 * that loses its layers still works; a URL the browser truncates does not, and
 * silently producing a broken link is the worse failure.
 */
export function buildEmbed(payload: EmbedPayload, baseUrlLength: number): EmbedResult {
  const withLayers = encodeStory(payload);
  if (baseUrlLength + withLayers.length <= MAX_EMBED_URL_LENGTH || !payload.layers?.length) {
    return { encoded: withLayers, droppedLayers: [], length: baseUrlLength + withLayers.length };
  }

  const withoutLayers = encodeStory({ ...payload, layers: [] });
  return {
    encoded: withoutLayers,
    droppedLayers: payload.layers,
    length: baseUrlLength + withoutLayers.length,
  };
}
