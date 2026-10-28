'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'lg';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog: closes on Escape and on the backdrop, keeps Tab inside, and
 * hands focus back to whatever opened it. Every dialog in the app goes through
 * here, so none of them can forget one of the three.
 */
export default function Modal({ title, subtitle, onClose, children, footer, size = 'lg' }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-100 bg-black/60 flex items-end sm:items-center justify-center sm:p-4 animate-[fade_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-paper border border-ink rounded-t-[4px] sm:rounded-[4px] w-full flex flex-col max-h-[88vh] ${
          size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-rule">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-extrabold leading-tight">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-ink-2 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-auto -mr-2 p-2 rounded-[2px] text-ink-2 hover:text-ink hover:bg-paper-2"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto">{children}</div>

        {footer && <div className="px-5 py-3 border-t border-rule flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/** Button styles shared by dialogs, so every confirm reads the same. */
export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] bg-water text-paper text-sm font-semibold hover:bg-water-strong disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] border border-ink text-ink text-sm font-semibold hover:bg-paper-2',
  danger:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[2px] bg-danger text-paper text-sm font-semibold hover:brightness-90',
};
