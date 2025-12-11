import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
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
    ),
    {
      ...size,
    }
  );
}
