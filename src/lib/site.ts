// The public URL comes from the build environment; locally it falls back to
// localhost so metadata still resolves.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const SITE_NAME = 'GeoNarrator Studio';
export const SITE_TITLE = 'GeoNarrator Studio: historias sobre mapas 3D';
export const SITE_DESCRIPTION =
  'Un editor para contar una historia sobre un mapa 3D. Cada escena guarda un texto y un encuadre de cámara, y al hacer scroll el mapa vuela de una a otra. Sin cuentas ni servidor.';
export const REPO_URL = 'https://github.com/imkath/GeoNarrator-Studio';
export const AUTHOR_URL = 'https://nvrkth.com';
