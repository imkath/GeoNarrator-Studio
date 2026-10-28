'use client';

import dynamic from 'next/dynamic';
import { useStoryStore } from '@/store/useStoryStore';
import Header from '@/components/ui/Header';
import Sidebar from '@/components/editor/Sidebar';
import StoryOverlay from '@/components/preview/StoryOverlay';

const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-paper flex items-center justify-center">
      <p className="text-sm text-ink-2">Cargando el mapa…</p>
    </div>
  ),
});

export default function GeoNarratorStudio() {
  const mode = useStoryStore((s) => s.mode);
  const editing = mode === 'edit';

  return (
    <div className="h-dvh bg-paper text-ink overflow-hidden">
      <Header />

      {/* Below md the map sits on top and the panel scrolls underneath; from
          md up the panel is a column on the left. In preview the map takes it
          all and the story scrolls over it. */}
      <main
        className={`absolute inset-x-0 bottom-0 top-14 ${
          editing ? 'flex flex-col md:grid md:grid-cols-[400px_1fr]' : ''
        }`}
      >
        {/* Keys keep the map mounted across modes: without them React matched
            the map wrapper against the sidebar slot and rebuilt the map. */}
        {editing && <Sidebar key="sidebar" />}

        <div key="map" className={editing ? 'relative h-[42dvh] shrink-0 order-first md:order-none md:h-auto' : 'absolute inset-0'}>
          <MapCanvas />
        </div>

        {!editing && <StoryOverlay key="story" />}
      </main>
    </div>
  );
}
