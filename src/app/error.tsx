'use client';

import Link from 'next/link';
import { Mark } from '@/components/ui/Logo';

const STORAGE_KEY = 'geonarrator-storage';

/**
 * Without this, any render error left the default Next screen and no way
 * back. The most likely cause is the project stored in this browser, so the
 * way out is to try again, or to clear it and start from the example.
 */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-dvh bg-paper text-ink flex items-center justify-center px-6">
      <div className="max-w-md">
        <Mark className="w-8 h-8" />
        <h1 className="mt-6 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em]">Algo se rompió al dibujar la página</h1>
        <p className="mt-3 text-[16px] text-ink-2 leading-relaxed">
          Prueba de nuevo. Si vuelve a pasar en el editor, lo más probable es que el proyecto guardado en este
          navegador esté dañado: borrarlo deja el editor con el ejemplo, y no toca nada que hayas exportado.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="inline-flex px-4 py-2.5 rounded-[2px] bg-water text-paper text-sm font-semibold hover:bg-water-strong"
          >
            Intentar de nuevo
          </button>
          <button
            onClick={() => {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                // Storage blocked: reloading is still the best we can do.
              }
              window.location.reload();
            }}
            className="inline-flex px-4 py-2.5 rounded-[2px] border border-ink text-sm font-semibold hover:bg-paper-2"
          >
            Borrar lo guardado y recargar
          </button>
          <Link href="/" className="inline-flex px-4 py-2.5 text-sm font-semibold text-ink-2 hover:text-ink">
            Ir a la portada
          </Link>
        </div>
      </div>
    </main>
  );
}
