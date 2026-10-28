'use client';

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import Modal, { btn } from './Modal';
import { MAX_EMBED_URL_LENGTH } from '@/lib/story-codec';

const FIELDS: [string, string][] = [
  ['id', 'identificador único de la escena'],
  ['title', 'título, hasta 100 caracteres'],
  ['content', 'texto de la escena, hasta 1.000 caracteres'],
  ['longitude', 'de -180 a 180'],
  ['latitude', 'de -85 a 85'],
  ['zoom', 'de 1 (el mundo) a 20 (un edificio)'],
  ['pitch', 'inclinación, de 0 a 85 grados'],
  ['bearing', 'rotación, de -180 a 180 grados'],
  ['mapStyle', 'satellite, outdoors, streets, light o dark'],
];

const EXAMPLE = `{
  "projectName": "Mi historia",
  "mapStyle": "satellite",
  "chapters": [
    {
      "id": "escena-1",
      "title": "Plaza de Armas",
      "content": "El punto cero de Santiago.",
      "longitude": -70.6506,
      "latitude": -33.4372,
      "zoom": 16,
      "pitch": 55,
      "bearing": 20
    }
  ]
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
      title="Formato para importar"
      subtitle="Un archivo JSON con la lista de escenas"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btn.secondary}>
            Cerrar
          </button>
          <button
            onClick={() => {
              onDownloadExample();
              onClose();
            }}
            className={btn.primary}
          >
            <Download className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            Descargar el proyecto abierto
          </button>
        </>
      }
    >
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-ink-2">
          Lo más rápido es exportar un proyecto y usarlo de plantilla. Las capas de datos viajan en el mismo
          archivo cuando se exportan desde aquí.
        </p>

        <pre className="bg-paper-2 rounded-[2px] p-3 font-mono text-[12px] leading-relaxed overflow-x-auto">
          {EXAMPLE}
        </pre>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
          {FIELDS.map(([field, description]) => (
            <div key={field} className="contents">
              <dt className="font-mono text-water">{field}</dt>
              <dd className="text-ink-2">{description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}

export function ResetConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal
      title="¿Volver al proyecto de ejemplo?"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className={btn.secondary} data-autofocus>
            Cancelar
          </button>
          <button onClick={onConfirm} className={btn.danger}>
            Borrar y volver al ejemplo
          </button>
        </>
      }
    >
      <p className="px-5 py-4 text-sm text-ink-2">
        Se borran todas las escenas y capas de este proyecto. Si quieres conservarlo, exporta el JSON antes.
      </p>
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
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const tooLong = embedUrl.length > MAX_EMBED_URL_LENGTH;

  const copy = async (text: string, what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setCopyFailed(false);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <Modal
      title="Incrustar la historia"
      subtitle={`Las ${sceneCount} escenas viajan dentro del enlace. No hay servidor de por medio.`}
      onClose={onClose}
      footer={
        <>
          <button onClick={() => copy(embedUrl, 'link')} className={btn.secondary}>
            {copied === 'link' ? (
              <Check className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            )}
            {copied === 'link' ? 'Enlace copiado' : 'Copiar el enlace'}
          </button>
          <button onClick={() => copy(embedCode, 'code')} className={btn.primary} data-autofocus>
            {copied === 'code' ? (
              <Check className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
            )}
            {copied === 'code' ? 'Código copiado' : 'Copiar el código'}
          </button>
        </>
      }
    >
      <div className="px-5 py-4 space-y-3">
        {droppedLayers.length > 0 && (
          <p className="text-[13px] bg-caution-tint text-caution rounded-[2px] px-3 py-2" role="alert">
            {droppedLayers.length === 1 ? 'La capa' : 'Las capas'} {droppedLayers.join(', ')} no{' '}
            {droppedLayers.length === 1 ? 'cabe' : 'caben'} en un enlace y {droppedLayers.length === 1 ? 'quedó' : 'quedaron'} fuera. Para{' '}
            {droppedLayers.length === 1 ? 'compartirla' : 'compartirlas'}, exporta el proyecto como JSON.
          </p>
        )}

        {tooLong && (
          <p className="text-[13px] bg-caution-tint text-caution rounded-[2px] px-3 py-2" role="alert">
            El enlace mide {embedUrl.length.toLocaleString('es-CL')} caracteres. Pasados los{' '}
            {MAX_EMBED_URL_LENGTH.toLocaleString('es-CL')}, algunos navegadores y servidores lo cortan. Acortar
            los textos ayuda.
          </p>
        )}

        {copyFailed && (
          <p className="text-[13px] bg-danger-tint text-danger rounded-[2px] px-3 py-2" role="alert">
            El navegador no dejó copiar. Selecciona el código y cópialo a mano.
          </p>
        )}

        <label htmlFor="embed-code" className="block font-mono text-[11px] text-ink-3">
          Código para pegar en tu sitio
        </label>
        <textarea
          id="embed-code"
          readOnly
          value={embedCode}
          onFocus={(e) => e.currentTarget.select()}
          rows={7}
          className="w-full bg-paper-2 rounded-[2px] p-3 font-mono text-[12px] leading-relaxed resize-none break-all"
        />

        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm font-semibold text-water underline underline-offset-4 hover:text-water-strong"
        >
          Ver cómo queda<span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </div>
    </Modal>
  );
}
