// The public URL depends on where this is deployed. Vercel exposes
// VERCEL_PROJECT_PRODUCTION_URL; locally it falls back to localhost.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "GeoNarrator Studio";
export const SITE_TITLE = "GeoNarrator Studio | 3D scrollytelling map editor";
export const SITE_DESCRIPTION =
  "Visual editor for map-driven stories: every scene stores a camera position and the map flies between them as the reader scrolls. Built on Mapbox GL.";
