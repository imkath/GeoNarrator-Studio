'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// The story is client-only: it reads the query string and draws WebGL.
const EmbedStory = dynamic(() => import('@/components/embed/EmbedStory'), {
  ssr: false,
  loading: () => <div className="h-screen bg-slate-950" />,
});

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950" />}>
      <EmbedStory />
    </Suspense>
  );
}
