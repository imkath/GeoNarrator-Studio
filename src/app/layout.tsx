import type { Metadata, Viewport } from 'next';
import { Overpass, Overpass_Mono } from 'next/font/google';
import './globals.css';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';

// Overpass is an open take on Highway Gothic, the lettering of road signs and
// of many printed maps. The reasoning lives in DESIGN.md.
const overpass = Overpass({
  variable: '--font-overpass',
  subsets: ['latin'],
  weight: ['300', '400', '600', '800'],
  display: 'swap',
});

const overpassMono = Overpass_Mono({
  variable: '--font-overpass-mono',
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <head>
        <link rel="preconnect" href="https://api.mapbox.com" crossOrigin="anonymous" />
      </head>
      <body className={`${overpass.variable} ${overpassMono.variable} bg-paper text-ink`}>
        {children}
      </body>
    </html>
  );
}
