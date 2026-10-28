'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { AUTHOR_URL, REPO_URL } from '@/lib/site';

// Mapbox GL is most of the weight of this page. Loading it apart lets the
// text paint first over a dark field the map then fills.
const LandingMap = dynamic(() => import('./LandingMap'), { ssr: false });

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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = steps.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setScene(index);
        }
      },
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 }
    );
    steps.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative bg-paper text-ink">
      {/* The map fills the screen behind everything and the story scrolls
          over it. Only a band on the left is darkened, where the text sits. */}
      <div className="fixed inset-0 z-0 bg-paper">
        <LandingMap scene={scene} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-paper/90 border-b border-rule">
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

      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
        <section
          ref={(el) => {
            steps.current[0] = el;
          }}
          className="min-h-svh flex flex-col justify-end pb-[14svh] pt-24"
          aria-labelledby="hero-title"
        >
          <h1
            id="hero-title"
            className="max-w-[12ch] text-[48px] sm:text-[72px] lg:text-[104px] font-extrabold leading-[0.92] tracking-[-0.045em]"
          >
            Historias que se leen sobre un mapa
          </h1>
          <p className="mt-6 text-[18px] sm:text-[21px] leading-relaxed text-ink max-w-[36ch]">
            Un editor para contar algo sobre un mapa 3D. Cada escena guarda un texto y un encuadre de cámara; al
            hacer scroll, el mapa vuela de una a la siguiente.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 [text-shadow:none]">
            <Link
              href="/editor"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-[2px] bg-water text-paper text-[17px] font-semibold hover:bg-water-strong"
            >
              Abrir el editor
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden="true" />
            </Link>
            <span className="text-[14px] text-ink-2 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
              Sin cuenta. Abre con un ejemplo cargado.
            </span>
          </div>
          <p className="mt-16 font-mono text-[12px] text-ink-2">Baja: esta página está hecha con la misma mecánica.</p>
        </section>

        <ol className="list-none">
          {SCENES.map((s, i) => (
            <li
              key={s.title}
              ref={(el) => {
                steps.current[i + 1] = el;
              }}
              className="min-h-[100svh] flex items-center py-16"
            >
              <div
                className={`w-full max-w-[460px] bg-paper border rounded-[4px] p-6 sm:p-7 [text-shadow:none] transition-opacity duration-500 ${
                  scene === i + 1 ? 'border-ink-3 opacity-100' : 'border-rule opacity-50'
                }`}
              >
                <p className="font-mono text-[12px] text-ink-3 tabular">Escena {String(i + 1).padStart(2, '0')} / 04</p>
                <h2 className="mt-2 text-[28px] sm:text-[32px] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance">
                  {s.title}
                </h2>
                <p className="mt-4 text-[16px] sm:text-[17px] leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="min-h-svh flex flex-col justify-center py-24" aria-labelledby="cta-title">
          <h2
            id="cta-title"
            className="max-w-[16ch] text-[40px] sm:text-[60px] font-extrabold leading-[0.96] tracking-[-0.04em]"
          >
            El editor abre con una historia sobre Chile. Cámbiala hasta que sea tuya.
          </h2>
          <div className="[text-shadow:none]">
            <Link
              href="/editor"
              className="group mt-9 inline-flex items-center gap-2 px-6 py-3.5 rounded-[2px] bg-water text-paper text-[17px] font-semibold hover:bg-water-strong"
            >
              Abrir el editor
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
          <dl className="mt-14 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[15px] max-w-[48ch]">
            <dt className="font-mono text-[12px] text-ink-2 pt-0.5">sirve para</dt>
            <dd>periodismo de datos, clases, presentaciones de investigación</dd>
            <dt className="font-mono text-[12px] text-ink-2 pt-0.5">funciona con</dt>
            <dd>texto, lugares, coordenadas y archivos GeoJSON</dd>
            <dt className="font-mono text-[12px] text-ink-2 pt-0.5">guarda en</dt>
            <dd>tu navegador, un archivo JSON o la URL del iframe</dd>
          </dl>
        </section>
      </main>

      <footer className="relative z-10 border-t border-rule bg-paper">
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
