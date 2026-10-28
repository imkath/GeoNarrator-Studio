import Link from 'next/link';
import { Metadata } from 'next';
import { Mark } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-paper flex items-center justify-center px-6">
      <div className="max-w-md">
        <Mark className="w-8 h-8" />
        <p className="mt-6 font-mono text-[12px] text-ink-3">error 404 · fuera de la hoja</p>
        <h1 className="mt-2 text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em]">
          Esta dirección no está en el mapa
        </h1>
        <p className="mt-3 text-[17px] text-ink-2 leading-relaxed">
          Puede que el enlace esté incompleto. Si venías a ver una historia incrustada, pide que te compartan el
          enlace de nuevo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/editor"
            className="inline-flex px-4 py-2.5 rounded-[2px] bg-water text-paper text-sm font-semibold hover:bg-water-strong"
          >
            Abrir el editor
          </Link>
          <Link
            href="/"
            className="inline-flex px-4 py-2.5 rounded-[2px] border border-ink text-sm font-semibold hover:bg-paper-2"
          >
            Ir a la portada
          </Link>
        </div>
      </div>
    </main>
  );
}
