'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Map, { MapRef } from 'react-map-gl/mapbox';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Newspaper, GraduationCap, Plane, FlaskConical } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Demo scenes for the scrollytelling experience
const DEMO_SCENES = [
  {
    id: 'alps',
    title: 'The Swiss Alps',
    description: 'Where ancient glaciers carved valleys into cathedral-like formations.',
    longitude: 7.6586,
    latitude: 46.0207,
    zoom: 12,
    pitch: 75,
    bearing: -20,
  },
  {
    id: 'amalfi',
    title: 'Amalfi Coast',
    description: 'Cliffside villages tumbling toward the Mediterranean.',
    longitude: 14.6027,
    latitude: 40.6333,
    zoom: 13,
    pitch: 70,
    bearing: 45,
  },
  {
    id: 'tokyo',
    title: 'Tokyo at Night',
    description: 'Where neon dreams meet ancient tradition.',
    longitude: 139.7671,
    latitude: 35.6812,
    zoom: 14,
    pitch: 60,
    bearing: -30,
  },
  {
    id: 'grand-canyon',
    title: 'Grand Canyon',
    description: 'Two billion years of Earth\'s history exposed in stone.',
    longitude: -112.1129,
    latitude: 36.0544,
    zoom: 13,
    pitch: 80,
    bearing: 60,
  },
];

// Use cases data
const USE_CASES = [
  { icon: Newspaper, label: 'Journalists', desc: 'Tell stories that span continents' },
  { icon: GraduationCap, label: 'Educators', desc: 'Make geography come alive' },
  { icon: Plane, label: 'Travel writers', desc: 'Share journeys visually' },
  { icon: FlaskConical, label: 'Researchers', desc: 'Present spatial data beautifully' },
];

// Logo Component
function Logo({ size = 'default' }: { size?: 'default' | 'large' | 'hero' }) {
  const sizes = {
    default: { container: 'p-2.5', icon: 'w-5 h-5' },
    large: { container: 'p-3', icon: 'w-6 h-6' },
    hero: { container: 'p-4 sm:p-5', icon: 'w-8 h-8 sm:w-10 sm:h-10' },
  };

  const { container, icon } = sizes[size];

  return (
    <div className="relative">
      <motion.div
        className="absolute -inset-1 rounded-xl opacity-60"
        style={{
          background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
          filter: 'blur(8px)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative">
        <div
          className="absolute -inset-px rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          }}
        />
        <div className={`relative bg-slate-950 ${container} rounded-xl`}>
          <svg viewBox="0 0 24 24" className={icon} fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
            <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
            <path d="M12 2C14.5 2 16.5 6.5 16.5 12C16.5 17.5 14.5 22 12 22C9.5 22 7.5 17.5 7.5 12C7.5 6.5 9.5 2 12 2Z" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
            <circle cx="15" cy="8" r="2" fill="#f472b6" />
            <circle cx="15" cy="8" r="1" fill="white" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Scene Card for Demo
function SceneCard({
  scene,
  isActive,
  index
}: {
  scene: typeof DEMO_SCENES[0];
  isActive: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -60, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: false, margin: '-40%' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      {/* Glow effect when active */}
      {isActive && (
        <motion.div
          layoutId="activeGlow"
          className="absolute -inset-1 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4))',
            filter: 'blur(20px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}

      <div className={`
        relative bg-slate-950/80 backdrop-blur-xl border rounded-2xl p-6 sm:p-8
        transition-all duration-500
        ${isActive ? 'border-white/20' : 'border-white/5'}
      `}>
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          Scene {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 mb-3">
          {scene.title}
        </h3>
        <p className="text-slate-400 leading-relaxed">
          {scene.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const mapRef = useRef<MapRef>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [activeSceneId, setActiveSceneId] = useState(DEMO_SCENES[0].id);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [inDemoSection, setInDemoSection] = useState(false);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rotationRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroOpacity = useTransform(heroProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 0.8], [1, 0.95]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14,
    });

    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    map.setFog({
      range: [0.5, 10],
      color: '#242B4B',
      'horizon-blend': 0.3,
      'high-color': '#add8e6',
      'space-color': '#0b0c21',
      'star-intensity': 0.8,
    });

    setMapLoaded(true);
  }, []);

  // Hero map rotation animation - only when NOT in demo section
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || inDemoSection) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const map = mapRef.current.getMap();

    const animate = () => {
      rotationRef.current += 0.015;
      map.setBearing(rotationRef.current % 360);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mapLoaded, inDemoSection]);

  // Detect when entering demo section and fly to first scene
  useEffect(() => {
    if (!demoRef.current || !mapLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const wasInDemo = inDemoSection;
          setInDemoSection(entry.isIntersecting);

          // When first entering demo section, fly to first scene
          if (entry.isIntersecting && !wasInDemo && mapRef.current) {
            const firstScene = DEMO_SCENES[0];
            mapRef.current.flyTo({
              center: [firstScene.longitude, firstScene.latitude],
              zoom: firstScene.zoom,
              pitch: firstScene.pitch,
              bearing: firstScene.bearing,
              duration: 2500,
              essential: true,
            });
          }
        });
      },
      { rootMargin: '-20% 0px -20% 0px', threshold: 0 }
    );

    observer.observe(demoRef.current);
    return () => observer.disconnect();
  }, [mapLoaded, inDemoSection]);

  const flyToScene = useCallback((scene: typeof DEMO_SCENES[0]) => {
    if (!mapRef.current || !mapLoaded) return;

    mapRef.current.flyTo({
      center: [scene.longitude, scene.latitude],
      zoom: scene.zoom,
      pitch: scene.pitch,
      bearing: scene.bearing,
      duration: 3000,
      essential: true,
    });
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;

    const observers: IntersectionObserver[] = [];

    sceneRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const scene = DEMO_SCENES[index];
              setActiveSceneId(scene.id);
              flyToScene(scene);
            }
          });
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [mapLoaded, flyToScene]);

  return (
    <div className="relative bg-slate-950">
      <div className="fixed inset-0 z-0">
        {/* Bailing out of the whole component here would leave the useScroll
            target ref unmounted and throw; only the map is swapped. */}
        {!MAPBOX_TOKEN ? (
          <div className="w-full h-full flex items-center justify-center bg-slate-950">
            <p className="text-sm text-slate-400 max-w-md text-center px-8">
              Set <code className="text-indigo-400">NEXT_PUBLIC_MAPBOX_TOKEN</code> in
              <code className="text-indigo-400"> .env.local</code> to load the map.
            </p>
          </div>
        ) : (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: 7.6586,
            latitude: 46.0207,
            zoom: 3,
            pitch: 50,
            bearing: 0,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          projection={{ name: 'globe' }}
          onLoad={handleMapLoad}
          interactive={false}
        />
        )}
        {/* Gradient overlay - stronger for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-slate-950" />
        {/* Center vignette for hero text */}
        <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-slate-950/60 via-transparent to-transparent" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Logo />
              <span className="font-black text-lg tracking-tight">
                <span className="text-white">Geo</span>
                <span className="text-white/70 font-light">Narrator</span>
              </span>
            </Link>
            <Link
              href="/editor"
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-950 font-semibold rounded-xl hover:bg-white/90 transition-all text-sm"
            >
              <span>Open Editor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="text-center px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <Logo size="hero" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white mb-6"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.9)' }}
            >
              Tell stories.
              <br />
              <span className="text-white/50">On maps.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg sm:text-xl text-slate-200 max-w-md mx-auto mb-12"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}
            >
              Create immersive geographic narratives with cinematic 3D maps.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <Link
                href="/editor"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl hover:bg-white/90 transition-all text-lg"
              >
                <span>Start Creating</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1], y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-2 bg-white/40 rounded-full"
              />
            </motion.div>
          </motion.div>
        </section>

        <section ref={demoRef} className="relative">
          {/* Intro text - separate section that scrolls away */}
          <div className="min-h-[60vh] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-xl"
            >
              <p className="text-sm font-mono text-indigo-400 uppercase tracking-widest mb-4">
                Experience it
              </p>
              <h2
                className="text-4xl sm:text-5xl font-black text-white mb-4"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              >
                Scroll down.
              </h2>
              <p
                className="text-slate-300 text-lg"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}
              >
                Watch the map fly to each location as you scroll. This is what your stories will feel like.
              </p>
            </motion.div>
          </div>

          <div className="max-w-xl mx-auto px-4 sm:px-6">
            {DEMO_SCENES.map((scene, index) => (
              <div
                key={scene.id}
                ref={(el) => { sceneRefs.current[index] = el; }}
                data-id={scene.id}
                className="min-h-[80vh] flex items-center"
              >
                <SceneCard
                  scene={scene}
                  isActive={activeSceneId === scene.id}
                  index={index}
                />
              </div>
            ))}
          </div>

          <div className="min-h-[60vh] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p
                className="text-2xl sm:text-3xl font-black text-white mb-4"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              >
                You just experienced GeoNarrator.
              </p>
              <p
                className="text-slate-300 mb-8"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}
              >
                Now create your own story.
              </p>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/25"
              >
                <span>Open Editor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="relative py-32 bg-slate-950/90 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-mono text-indigo-400 uppercase tracking-widest mb-4 text-center"
            >
              Who uses it
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-black text-white text-center mb-16"
            >
              Built for storytellers
            </motion.h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {USE_CASES.map((useCase, index) => (
                <motion.div
                  key={useCase.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group text-center p-6"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <useCase.icon className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{useCase.label}</h3>
                  <p className="text-sm text-slate-500">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-32 sm:py-48">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-8"
            >
              Ready?
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link
                href="/editor"
                className="group inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:opacity-90 transition-all text-xl shadow-2xl shadow-purple-500/25"
              >
                <span>Open Editor</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        <footer className="relative py-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="font-semibold text-white/60">GeoNarrator</span>
            </div>
            <p className="text-sm text-slate-600">
              Built with Mapbox GL
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
