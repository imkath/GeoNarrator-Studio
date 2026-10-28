import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

// iOS does not take SVG icons, so the mark is drawn once more at 180 px.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="132" height="132" viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="18.5" r="2.5" fill="#14181d" />
          <path d="M6.6 16.4C8.4 10.6 12.2 7.6 15.6 7.4" stroke="#14181d" strokeWidth="1.9" strokeLinecap="round" />
          <circle cx="18.6" cy="7.4" r="3.1" stroke="#a8561c" strokeWidth="1.9" />
          <circle cx="18.6" cy="7.4" r="0.9" fill="#a8561c" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
