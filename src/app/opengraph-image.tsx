import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'GeoNarrator Studio: historias que se leen sobre un mapa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#14181d';
const INK2 = '#47505a';
const CONTOUR = '#a8561c';

// Rendered once at build time, so the fonts come straight from the repo.
const font = (file: string) => readFile(join(process.cwd(), 'src/assets', file));

function Station({ x, y, n, active = false }: { x: number; y: number; n: number; active?: boolean }) {
  const r = active ? 26 : 20;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: r,
        border: `4px solid ${active ? '#ffffff' : INK}`,
        background: active ? CONTOUR : '#ffffff',
        color: active ? '#ffffff' : INK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Overpass Mono',
        fontSize: active ? 24 : 20,
      }}
    >
      {n}
    </div>
  );
}

export default async function Image() {
  const [extraBold, regular, mono] = await Promise.all([
    font('overpass-800.ttf'),
    font('overpass-400.ttf'),
    font('overpass-mono-400.ttf'),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ffffff', padding: 36 }}>
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            border: `3px solid ${INK}`,
            padding: '56px 60px',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="18.5" r="2.5" fill={INK} />
              <path d="M6.6 16.4C8.4 10.6 12.2 7.6 15.6 7.4" stroke={INK} strokeWidth="1.9" strokeLinecap="round" />
              <circle cx="18.6" cy="7.4" r="3.1" stroke={CONTOUR} strokeWidth="1.9" />
              <circle cx="18.6" cy="7.4" r="0.9" fill={CONTOUR} />
            </svg>
            <span style={{ fontFamily: 'Overpass', fontWeight: 800, fontSize: 34, color: INK, letterSpacing: -0.5 }}>
              GeoNarrator
            </span>
            <span style={{ fontFamily: 'Overpass Mono', fontSize: 22, color: INK2, marginTop: 6 }}>studio</span>
          </div>

          <div
            style={{
              marginTop: 70,
              width: 640,
              fontFamily: 'Overpass',
              fontWeight: 800,
              fontSize: 76,
              lineHeight: 1,
              letterSpacing: -2.5,
              color: INK,
            }}
          >
            Historias que se leen sobre un mapa
          </div>
          <div style={{ marginTop: 28, width: 600, fontFamily: 'Overpass', fontSize: 28, lineHeight: 1.35, color: INK2 }}>
            Cada escena guarda un texto y un encuadre. Al hacer scroll, el mapa vuela de una a otra.
          </div>

          {/* Three stations and the flight between them. */}
          <svg
            width="400"
            height="420"
            viewBox="0 0 400 420"
            style={{ position: 'absolute', right: 40, top: 70 }}
            fill="none"
          >
            <path d="M70 360 C 90 250, 150 200, 210 190" stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <path
              d="M210 190 C 270 180, 320 120, 330 60"
              stroke={INK}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="2 12"
            />
          </svg>
          <Station x={682 + 70} y={70 + 360} n={1} />
          <Station x={682 + 210} y={70 + 190} n={2} active />
          <Station x={682 + 330} y={70 + 60} n={3} />

          <div
            style={{
              position: 'absolute',
              left: 60,
              bottom: 26,
              right: 60,
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'Overpass Mono',
              fontSize: 20,
              color: INK2,
            }}
          >
            <span>33°26′S 70°39′O</span>
            <span>geonarrator.nvrkth.com</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Overpass', data: extraBold, weight: 800, style: 'normal' },
        { name: 'Overpass', data: regular, weight: 400, style: 'normal' },
        { name: 'Overpass Mono', data: mono, weight: 400, style: 'normal' },
      ],
    }
  );
}
