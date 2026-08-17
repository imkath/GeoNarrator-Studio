'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Code2, Copy, Download, FileJson, RotateCcw } from 'lucide-react';
import Modal from './Modal';
import { MAX_EMBED_URL_LENGTH } from '@/lib/story-codec';

const FIELDS: [string, string][] = [
  ['id', 'Unique identifier for each scene'],
  ['title', 'Scene title (max 100 chars)'],
  ['content', 'Narrative text (max 1000 chars)'],
  ['longitude', '-180 to 180'],
  ['latitude', '-90 to 90'],
  ['zoom', '1-20 (world to street level)'],
  ['pitch', '0-85 (camera tilt)'],
  ['bearing', '-180 to 180 (rotation)'],
  ['mapStyle', 'dark, satellite, streets, outdoors, light'],
];

const EXAMPLE = `{
  "chapters": [
    {
      "id": "unique-id",
      "title": "Scene Title",
      "content": "Narrative text...",
      "longitude": -70.6693,
      "latitude": -33.4489,
      "zoom": 10,
      "pitch": 45,
      "bearing": 0
    }
  ],
  "mapStyle": "dark",
  "version": "1.0.0"
}`;

export function ImportHelpModal({
  onClose,
  onDownloadExample,
}: {
  onClose: () => void;
  onDownloadExample: () => void;
}) {
  return (
    <Modal
      title="Import Format"
      subtitle="JSON file structure"
      icon={
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <FileJson className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <button
            onClick={() => {
              onDownloadExample();
              onClose();
            }}
            className="flex-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Download example
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </>
      }
    >
      <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-xs text-amber-300">
            The quickest way is to export an existing project and use it as a template.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-300 mb-2">Required structure</h4>
          <pre className="bg-black/40 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto border border-white/5">
            {EXAMPLE}
          </pre>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300">Fields</h4>
          <div className="space-y-1.5 text-[11px]">
            {FIELDS.map(([field, description]) => (
              <div key={field} className="flex gap-2">
                <code className="text-indigo-400 shrink-0">{field}</code>
                <span className="text-slate-400">{description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ResetConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title="Reset Project"
      subtitle="Restores the default project"
      size="sm"
      icon={
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Reset
          </button>
        </>
      }
    >
      <div className="p-4">
        <p className="text-sm text-slate-300">All unsaved changes will be lost.</p>
      </div>
    </Modal>
  );
}

export function EmbedModal({
  onClose,
  sceneCount,
  embedUrl,
  embedCode,
  droppedLayers,
}: {
  onClose: () => void;
  sceneCount: number;
  embedUrl: string;
  embedCode: string;
  droppedLayers: string[];
}) {
  const [copied, setCopied] = useState(false);
  const tooLong = embedUrl.length > MAX_EMBED_URL_LENGTH;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      title="Embed Your Story"
      subtitle="Paste this code on any website"
      icon={
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Code2 className="w-5 h-5 text-indigo-400" aria-hidden="true" />
        </div>
      }
      onClose={onClose}
      footer={
        <>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={copy}
            className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy embed code'}
          </motion.button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </>
      }
    >
      <div className="p-4 space-y-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
          <p className="text-xs text-indigo-300">
            The embed carries all {sceneCount} scenes inside the URL itself.
          </p>
        </div>

        {droppedLayers.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3" role="alert">
            <p className="text-xs text-amber-300">
              These layers do not fit in a URL and were left out of the embed:{' '}
              {droppedLayers.join(', ')}. Export the project as JSON to share them.
            </p>
          </div>
        )}

        {tooLong && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3" role="alert">
            <p className="text-xs text-amber-300">
              This URL is {embedUrl.length} characters long. Past {MAX_EMBED_URL_LENGTH} some
              browsers and servers truncate it, so exporting the JSON and serving it separately
              is safer.
            </p>
          </div>
        )}

        <pre className="bg-black/40 rounded-lg p-4 text-[11px] text-slate-300 overflow-x-auto border border-white/5 whitespace-pre-wrap break-all">
          {embedCode}
        </pre>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Preview:</span>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 truncate max-w-[300px]"
          >
            Open in a new tab
          </a>
        </div>
      </div>
    </Modal>
  );
}
