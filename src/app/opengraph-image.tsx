import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'GeoNarrator Studio - 3D Scrollytelling Map Editor';
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
            width="120"
            height="120"
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
              fontSize: 72,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Geo
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.02em',
            }}
          >
            Narrator
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              background: 'linear-gradient(90deg, #6366f1, transparent)',
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#94a3b8',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Story Studio
          </span>
          <div
            style={{
              width: 40,
              height: 2,
              background: 'linear-gradient(90deg, transparent, #6366f1)',
            }}
          />
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 28,
            color: '#64748b',
            marginTop: 40,
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Create stunning 3D map-based stories without writing code
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            marginTop: 40,
          }}
        >
          {['3D Maps', 'No-Code', 'Scrollytelling', 'Cinematic'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontSize: 18, color: '#e2e8f0' }}>{feature}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <p
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 18,
            color: '#475569',
          }}
        >
          geonarrator.studio
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
