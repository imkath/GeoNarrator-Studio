'use client';

import dynamic from 'next/dynamic';

// The editor reads its project from localStorage and draws through WebGL, so
// there is nothing useful to render on the server: any state restored on the
// client differs from the server HTML and React reports a hydration mismatch.
const GeoNarratorStudio = dynamic(() => import('@/components/GeoNarratorStudio'), {
  ssr: false,
  loading: () => <div className="h-screen bg-slate-950" />,
});

export default function EditorClient() {
  return <GeoNarratorStudio />;
}
