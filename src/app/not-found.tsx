import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist. Return to GeoNarrator Studio to create stunning 3D map stories.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1
            className="text-[150px] sm:text-[200px] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </h1>
          {/* Globe icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              viewBox="0 0 24 24"
              className="w-20 h-20 sm:w-28 sm:h-28 opacity-20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            >
              <circle cx="12" cy="12" r="10" className="text-indigo-500" />
              <ellipse cx="12" cy="12" rx="10" ry="4" className="text-indigo-500" />
              <path d="M12 2C14.5 2 16.5 6.5 16.5 12C16.5 17.5 14.5 22 12 22C9.5 22 7.5 17.5 7.5 12C7.5 6.5 9.5 2 12 2Z" className="text-indigo-500" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Lost in the Map
        </h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          The coordinates you&apos;re looking for don&apos;t exist on our globe.
          Let&apos;s navigate you back to familiar territory.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Studio
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Story
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-12 text-sm text-slate-600">
          Error 404 - Page not found
        </p>
      </div>
    </main>
  );
}
