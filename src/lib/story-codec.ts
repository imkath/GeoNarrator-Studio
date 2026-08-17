import { Chapter } from '@/types';
import type { MapStyle } from '@/store/useStoryStore';

export interface EmbedPayload {
  chapters: Chapter[];
  mapStyle: MapStyle;
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
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const parsed = JSON.parse(new TextDecoder().decode(bytes));

  if (!Array.isArray(parsed?.chapters) || parsed.chapters.length === 0) {
    throw new Error('Story has no scenes');
  }
  for (const chapter of parsed.chapters) {
    if (
      typeof chapter?.id !== 'string' ||
      typeof chapter?.title !== 'string' ||
      typeof chapter?.longitude !== 'number' ||
      typeof chapter?.latitude !== 'number'
    ) {
      throw new Error('A scene has incomplete data');
    }
  }

  return parsed as EmbedPayload;
}

// Browsers start truncating URLs past roughly this length.
export const MAX_EMBED_URL_LENGTH = 2000;
