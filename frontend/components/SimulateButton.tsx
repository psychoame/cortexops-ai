'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronDown, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { Scenario } from '../types';

interface SimulateButtonProps {
  scenarios: Scenario[];
  selectedScenario: string;
  onScenarioChange: (id: string) => void;
  onSimulate: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function SimulateButton({
  scenarios,
  selectedScenario,
  onScenarioChange,
  onSimulate,
  isLoading,
  disabled,
}: SimulateButtonProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = scenarios.find(s => s.id === selectedScenario);

  const handleSimulate = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    ripple.style.width = ripple.style.height = '20px';
    e.currentTarget.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    onSimulate();
  };

  return (
    <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={isLoading || disabled}
          className={clsx(
            'flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 font-mono text-xs transition-all duration-300 sm:w-56',
            'border-cortex-border/50 bg-cortex-surface/60 text-cortex-text backdrop-blur-sm',
            'hover:border-cortex-accent/40 hover:shadow-glow-sm',
            open && 'border-cortex-accent/50 shadow-glow-sm'
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base">{selected?.icon ?? '⚡'}</span>
            <span className="truncate">{selected?.name ?? 'Select scenario'}</span>
          </span>
          <ChevronDown size={14} className={clsx('shrink-0 transition-transform duration-300', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-cortex-border/60 bg-cortex-card/95 py-1 shadow-2xl backdrop-blur-2xl sm:right-auto sm:w-56"
            >
              {scenarios.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onScenarioChange(s.id);
                    setOpen(false);
                  }}
                  className={clsx(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left font-mono text-xs transition-all',
                    s.id === selectedScenario
                      ? 'bg-gradient-to-r from-cortex-accent/15 to-transparent text-cortex-accent'
                      : 'text-cortex-text/80 hover:bg-white/[0.04]'
                  )}
                >
                  <span>{s.icon}</span>
                  {s.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        ref={btnRef}
        type="button"
        onClick={handleSimulate}
        disabled={isLoading || disabled}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.03 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        className={clsx(
          'btn-premium group flex flex-1 items-center justify-center gap-2 px-6 py-3 sm:flex-initial',
          isLoading && 'danger'
        )}
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {isLoading ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            <AlertTriangle size={12} className="animate-pulse" />
            Deploying Incident…
          </>
        ) : (
          <>
            <Play size={14} className="fill-current" />
            <Sparkles size={12} />
            Simulate Incident
          </>
        )}
      </motion.button>
    </div>
  );
}
