import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="12" cy="12" r="9" stroke="#818cf8" strokeWidth="2" fill="none" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" stroke="#a78bfa" strokeWidth="2" fill="none" />
          <circle cx="14" cy="9" r="2" fill="#f472b6" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
