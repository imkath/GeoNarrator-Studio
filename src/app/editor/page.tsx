import { Metadata } from 'next';
import EditorClient from '@/components/EditorClient';

export const metadata: Metadata = {
  title: 'Editor',
  description: 'Create and edit your 3D scrollytelling map stories with the GeoNarrator Studio visual editor.',
};

export default function EditorPage() {
  return <EditorClient />;
}
