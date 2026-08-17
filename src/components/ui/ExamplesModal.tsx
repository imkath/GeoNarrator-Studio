'use client';

import { BookOpen, MapPin } from 'lucide-react';
import Modal from './Modal';
import { EXAMPLES } from '@/data/examples';
import type { Example } from '@/data/examples';

export default function ExamplesModal({
  onClose,
  onPick,
  hasUnsavedChanges,
}: {
  onClose: () => void;
  onPick: (example: Example) => void;
  hasUnsavedChanges: boolean;
}) {
  return (
    <Modal
      title="Start from an example"
      subtitle="Loading one replaces the open project"
      icon={
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <BookOpen className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        </div>
      }
      onClose={onClose}
    >
      <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
        {hasUnsavedChanges && (
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            The open project has unsaved changes. Export it first if you want to keep it.
          </p>
        )}

        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            onClick={() => {
              onPick(example);
              onClose();
            }}
            className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-indigo-500/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                {example.name}
              </span>
              <span className="ml-auto text-[10px] text-slate-500 shrink-0">
                {example.chapters.length} {example.chapters.length === 1 ? 'escena' : 'escenas'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{example.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}
