'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { AUTHOR_URL, REPO_URL } from '@/lib/site';

// Mapbox GL is most of the weight of this page. Loading it apart lets the
// text paint first; the frame keeps its size meanwhile, so nothing jumps.
const LandingMap = dynamic(() => import('./LandingMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col">
      <div className="h-[18px]" />
      <div className="flex-1 border-[1.5px] border-ink bg-paper-2" />
      <div className="h-[18px]" />
    </div>
  ),
});

const SCENES = [
  {
    title: 'Una escena es un texto y un encuadre',
    body: (
      <>
        Este es Santiago visto desde el poniente, con la cordillera como pared del fondo. Para armar la escena
        bastó escribir este párrafo, buscar «Santiago» y mover la cámara. Bajo el mapa están los números que la
        escena guarda: acercamiento, inclinación y rotación.
      </>
    ),
  },
  {
    title: 'Inclinar la cámara convierte el mapa en paisaje',
    body: (
      <>
        Mirado desde arriba, el volcán Osorno es apenas un nudo de curvas de nivel. Con la cámara a 72° aparece
        como se ve desde la orilla del lago Llanquihue. El relieve sale del modelo de terreno de Mapbox y se nota
        en cuanto la escena se inclina.
      </>
    ),
  },
  {
    title: 'Tus datos, coloreados según un número',
    body: (
      <>
        Cada punto es una de las 370 ferias libres de la Región Metropolitana, y el color sigue su número de
        puestos, de 0 a 911. Es un GeoJSON público del{' '}
        <a
          href="https://geoportal.cl/geoportal/catalog/35097/Ferias%20Libres"
          target="_blank"
          rel="noopener noreferrer"
          className="text-water underline underline-offset-4 hover:text-water-strong"
        >
          Geoportal de Chile<span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
        : se arrastra al editor y la leyenda se arma sola. En la escena anterior la capa estaba oculta, porque
        cada escena decide qué datos se ven.
      </>
    ),
  },
  {
    title: 'Se comparte con un enlace',
    body: (
      <>
        La historia completa cabe en un archivo JSON. Puedes exportarla, o copiar un iframe que lleva todas las
        escenas dentro de la URL y pegarlo en un blog, un CMS o una nota de prensa. No hay cuentas que crear ni
        servidor que mantener.
      </>
    ),
  },
];

export default function LandingPage() {
  const [scene, setScene] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // On a phone the map is pinned to the top half, so the reading line
    // sits lower than on a desktop, where text and map share the height.
    const narrow = window.matchMedia('(max-width: 1023px)').matches;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = steps.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setScene(index);
        }
      },
      { rootMargin: narrow ? '-62% 0px -30% 0px' : '-48% 0px -48% 0px', threshold: 0 }
    );
    steps.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-40 h-14 bg-paper border-b border-ink">
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center gap-4">
          <Logo />
          <nav className="ml-auto flex items-center gap-1 sm:gap-3 text-sm font-semibold">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline px-2 py-1.5 text-ink-2 hover:text-ink"
            >
              Código<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[2px] bg-water text-paper hover:bg-water-strong"
            >
              Abrir el editor
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)] lg:gap-14">
        {/* Pinned map: a band at the top on a phone, a column on a desktop. */}
        <div className="sticky top-14 z-20 h-[44svh] -mx-4 px-4 pt-2 pb-2 bg-paper sm:-mx-6 sm:px-6 lg:order-2 lg:mx-0 lg:px-0 lg:pt-6 lg:pb-6 lg:h-[calc(100svh-56px)]">
          <LandingMap scene={scene} />
        </div>

        <div className="lg:order-1">
          <section
            ref={(el) => {
              steps.current[0] = el;
            }}
            className="pt-8 pb-16 lg:pt-[18svh] lg:min-h-[calc(100svh-56px)]"
            aria-labelledby="hero-title"
          >
            <h1 id="hero-title" className="text-[40px] sm:text-[52px] lg:text-[60px] font-extrabold leading-[0.98] tracking-[-0.035em] text-balance">
              Historias que se leen sobre un mapa
            </h1>
            <p className="mt-5 text-[18px] sm:text-[20px] leading-relaxed text-ink-2 max-w-[34ch]">
              GeoNarrator es un editor para contar algo sobre un mapa 3D. Cada escena guarda un texto y un encuadre
              de cámara; al hacer scroll, el mapa vuela de una a la siguiente.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/editor"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-[2px] bg-water text-paper text-[16px] font-semibold hover:bg-water-strong"
              >
                Abrir el editor
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden="true" />
              </Link>
              <span className="text-[14px] text-ink-3">Sin cuenta. Abre con un ejemplo cargado.</span>
            </div>
            <p className="mt-14 text-[14px] text-ink-2 max-w-[38ch] border-t border-rule pt-4">
              Esta página está hecha con la misma mecánica. Sigue bajando y mira cómo se mueve el mapa.
            </p>
          </section>

          <ol className="list-none">
            {SCENES.map((s, i) => (
              <li
                key={s.title}
                ref={(el) => {
                  steps.current[i + 1] = el;
                }}
                className={`min-h-[78svh] lg:min-h-[88svh] flex flex-col justify-center py-12 border-t border-rule transition-opacity duration-300 ${
                  scene === i + 1 ? 'opacity-100' : 'lg:opacity-45'
                }`}
              >
                <p className="font-mono text-[12px] text-ink-3 tabular">
                  Escena {String(i + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-2 text-[28px] sm:text-[34px] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance">
                  {s.title}
                </h2>
                <p className="mt-4 text-[17px] sm:text-[18px] leading-relaxed text-ink-2 max-w-[44ch]">{s.body}</p>
              </li>
            ))}
          </ol>

          <section className="py-20 lg:py-28 border-t border-ink" aria-labelledby="cta-title">
            <h2 id="cta-title" className="text-[30px] sm:text-[38px] font-extrabold leading-[1.02] tracking-[-0.03em] text-balance">
              El editor abre con una historia sobre Chile. Cámbiala hasta que sea tuya.
            </h2>
            <Link
              href="/editor"
              className="group mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-[2px] bg-water text-paper text-[16px] font-semibold hover:bg-water-strong"
            >
              Abrir el editor
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden="true" />
            </Link>
            <dl className="mt-14 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[14px] max-w-[46ch]">
              <dt className="font-mono text-[12px] text-ink-3 pt-0.5">sirve para</dt>
              <dd className="text-ink-2">periodismo de datos, clases, presentaciones de investigación</dd>
              <dt className="font-mono text-[12px] text-ink-3 pt-0.5">funciona con</dt>
              <dd className="text-ink-2">texto, lugares, coordenadas y archivos GeoJSON</dd>
              <dt className="font-mono text-[12px] text-ink-3 pt-0.5">guarda en</dt>
              <dd className="text-ink-2">tu navegador, un archivo JSON o la URL del iframe</dd>
            </dl>
          </section>
        </div>
      </main>

      <footer className="border-t border-ink">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-3 sm:items-center text-[13px] text-ink-2">
          <span className="font-semibold text-ink">GeoNarrator Studio</span>
          <span>
            Hecho por{' '}
            <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
              Kath<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
            .{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-ink">
              Código abierto<span className="sr-only"> (se abre en una pestaña nueva)</span>
            </a>
            , licencia MIT.
          </span>
          <span className="sm:ml-auto">Mapas © Mapbox © OpenStreetMap · Ferias: Geoportal de Chile (SNIT)</span>
        </div>
      </footer>
    </div>
  );
}
