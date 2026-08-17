'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Logo() {
  return (
    <Link href="/" aria-label="GeoNarrator Studio, home">
      <motion.div
        className="flex items-center gap-3 sm:gap-4 group cursor-pointer"
        whileHover="hover"
        initial="initial"
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
              filter: 'blur(12px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />

          <motion.div
            className="relative"
            variants={{ initial: { scale: 1 }, hover: { scale: 1.08 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <div
              className="absolute -inset-[1px] rounded-xl opacity-60 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
              aria-hidden="true"
            />

            <div className="relative bg-slate-950 p-2.5 sm:p-3 rounded-xl">
              <motion.svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                aria-hidden="true"
                variants={{ initial: { rotate: 0 }, hover: { rotate: 15 } }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <circle cx="12" cy="12" r="10" stroke="url(#globeGradient)" strokeWidth="1.5" />
                <motion.ellipse
                  cx="12"
                  cy="12"
                  rx="10"
                  ry="4"
                  stroke="url(#globeGradient)"
                  strokeWidth="1.5"
                  variants={{ initial: { ry: 4 }, hover: { ry: 5 } }}
                />
                <path
                  d="M12 2C14.5 2 16.5 6.5 16.5 12C16.5 17.5 14.5 22 12 22C9.5 22 7.5 17.5 7.5 12C7.5 6.5 9.5 2 12 2Z"
                  stroke="url(#globeGradient)"
                  strokeWidth="1.5"
                />
                <motion.g variants={{ initial: { y: 0, scale: 1 }, hover: { y: -1, scale: 1.1 } }}>
                  <circle cx="15" cy="8" r="2" fill="#f472b6" />
                  <circle cx="15" cy="8" r="1" fill="white" />
                </motion.g>
                <defs>
                  <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </motion.svg>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col">
          <h1 className="flex items-center">
            <span className="sm:hidden font-black text-lg tracking-tight text-white">GN</span>
            <span className="hidden sm:flex items-baseline gap-0.5">
              <motion.span
                className="font-black text-xl tracking-tight text-white"
                variants={{ initial: { y: 0 }, hover: { y: -2 } }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                Geo
              </motion.span>
              <motion.span
                className="font-light text-xl tracking-tight text-white/90"
                variants={{ initial: { y: 0 }, hover: { y: -2 } }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.02 }}
              >
                Narrator
              </motion.span>
            </span>
          </h1>

          <div className="hidden sm:flex items-center gap-2 mt-0.5">
            <motion.div
              className="h-px w-3 bg-gradient-to-r from-indigo-500 to-transparent"
              variants={{ initial: { width: 12 }, hover: { width: 20 } }}
              aria-hidden="true"
            />
            <motion.span
              className="text-[9px] font-semibold tracking-[0.2em] text-slate-400 uppercase"
              variants={{
                initial: { opacity: 0.7, letterSpacing: '0.2em' },
                hover: { opacity: 1, letterSpacing: '0.25em' },
              }}
            >
              Story Studio
            </motion.span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
