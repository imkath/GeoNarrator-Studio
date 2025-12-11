import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'GeoNarrator Studio - Create 3D map stories without code';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #1e1b4b 0%, transparent 50%), radial-gradient(circle at 75% 75%, #312e81 0%, transparent 50%)',
        }}
      >
        {/* Globe Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
          >
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#grad)" strokeWidth="1.5" fill="none" />
            <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#grad)" strokeWidth="1.5" fill="none" />
            <path d="M12 2C14.5 2 16.5 6.5 16.5 12C16.5 17.5 14.5 22 12 22C9.5 22 7.5 17.5 7.5 12C7.5 6.5 9.5 2 12 2Z" stroke="url(#grad)" strokeWidth="1.5" fill="none" />
            <circle cx="15" cy="8" r="2" fill="#f472b6" />
            <circle cx="15" cy="8" r="1" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Geo
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.02em',
            }}
          >
            Narrator
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 24,
            color: '#94a3b8',
            marginTop: 20,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          3D Scrollytelling Map Editor
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 32,
            color: '#64748b',
            marginTop: 32,
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Create stunning map stories without code
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
