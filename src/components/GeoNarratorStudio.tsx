'use client';

import dynamic from 'next/dynamic';
import { useStoryStore } from '@/store/useStoryStore';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/ui/Header';
import Sidebar from '@/components/editor/Sidebar';
import StoryOverlay from '@/components/preview/StoryOverlay';

// Dynamic import for MapCanvas to avoid SSR issues with Mapbox
const MapCanvas = dynamic(() => import('@/components/map/MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full"
      />
    </div>
  ),
});

export default function GeoNarratorStudio() {
  const { mode } = useStoryStore();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Noise overlay for premium feel */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main content area */}
      <main className="flex-1 flex relative mt-16 h-[calc(100vh-4rem)]">
        {/* Editor Sidebar */}
        <AnimatePresence mode="wait">
          {mode === 'edit' && <Sidebar />}
        </AnimatePresence>

        {/* Map container - adjusts based on mode */}
        {/* On mobile (< md), sidebar is floating so map takes full width */}
        {/* On desktop (>= md), sidebar pushes map when in edit mode */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-out ${
            mode === 'edit' ? 'md:pl-[420px]' : ''
          }`}
        >
          <MapCanvas />
        </div>

        {/* Preview overlay */}
        <AnimatePresence mode="wait">
          {mode === 'preview' && <StoryOverlay />}
        </AnimatePresence>
      </main>

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
