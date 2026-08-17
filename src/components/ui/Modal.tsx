'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'lg';
}

/** Shared dialog chrome: backdrop, click-outside dismissal and header. */
export default function Modal({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  size = 'lg',
}: ModalProps) {
  const titleId = `modal-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`bg-slate-900 border border-white/10 rounded-2xl w-full overflow-hidden shadow-2xl ${
          size === 'sm' ? 'max-w-sm' : 'max-w-lg max-h-[80vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          {icon}
          <div>
            <h3 id={titleId} className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {children}

        {footer && <div className="p-4 border-t border-white/10 flex gap-2">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}
