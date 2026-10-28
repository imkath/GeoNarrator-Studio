'use client';

import Modal from './Modal';
import { EXAMPLES } from '@/data/examples';
import type { Example } from '@/data/examples';
import { MAP_STYLES } from '@/lib/map-styles';

export default function ExamplesModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (example: Example) => void;
}) {
  return (
    <Modal
      title="Partir de un ejemplo"
      subtitle="Cargar uno reemplaza el proyecto abierto. Si quieres conservarlo, expórtalo antes."
      onClose={onClose}
    >
      <ul className="divide-y divide-rule">
        {EXAMPLES.map((example) => (
          <li key={example.id}>
            <button
              onClick={() => {
                onPick(example);
                onClose();
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-water-tint focus-visible:bg-water-tint"
            >
              <span className="flex items-baseline gap-3">
                <span className="font-semibold">{example.name}</span>
                <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-3">
                  {example.chapters.length} {example.chapters.length === 1 ? 'escena' : 'escenas'} ·{' '}
                  {MAP_STYLES.find((s) => s.id === example.mapStyle)?.name.toLowerCase()}
                </span>
              </span>
              <span className="block text-[13px] text-ink-2 mt-0.5">{example.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
