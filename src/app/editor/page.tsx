import { Metadata } from 'next';
import EditorClient from '@/components/EditorClient';

export const metadata: Metadata = {
  title: 'Editor',
  description:
    'Arma una historia sobre un mapa 3D: escribe cada escena, elige el lugar y el encuadre de cámara, suma tus datos y compártela.',
  alternates: { canonical: '/editor' },
};

export default function EditorPage() {
  return <EditorClient />;
}
