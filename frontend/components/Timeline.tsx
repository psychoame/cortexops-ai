'use client';

import { motion } from 'framer-motion';
import { Clock, Play, Circle } from 'lucide-react';
import clsx from 'clsx';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
  incidentActive: boolean;
}

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-cortex-accent shadow-[0_0_12px_rgba(0,217,255,0.8)]',
  warn: 'bg-cortex-yellow shadow-[0_0_12px_rgba(255,184,0,0.7)]',
  error: 'bg-cortex-red shadow-[0_0_12px_rgba(255,61,94,0.7)]',
  critical: 'bg-cortex-red shadow-[0_0_16px_rgba(255,61,94,1)]',
};

export default function Timeline({ events, incidentActive }: TimelineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glow-border overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cortex-accent/30 bg-cortex-accent/10">
            <Play size={12} className="text-cortex-accent fill-cortex-accent" />
          </div>
          <div>
            <span className="font-display text-sm font-bold">Incident Replay System</span>
            <p className="font-mono text-[9px] text-cortex-muted">chronological event reconstruction</p>
          </div>
        </div>
        {events.length > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-full border border-cortex-accent/30 bg-cortex-accent/10 px-2.5 py-0.5 font-mono text-[10px] text-cortex-accent"
          >
            {events.length} events
          </motion.span>
        )}
      </div>

      <div className="relative px-4 py-5">
        {events.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-cortex-muted">
            <Circle size={8} className="opacity-20" />
            <p className="font-mono text-xs">Replay timeline activates after AI analysis</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[11px] top-4 bottom-4 w-0.5 overflow-hidden rounded-full bg-cortex-border/30">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="w-full bg-gradient-to-b from-cortex-accent via-cortex-purple to-cortex-red/50"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
              {events.map((evt, i) => {
                const sev = evt.severity.toLowerCase();
                return (
                  <motion.div
                    key={`${evt.time}-${i}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative min-w-[210px] flex-shrink-0 sm:min-w-[240px]"
                  >
                    {i < events.length - 1 && (
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.35 + i * 0.12, duration: 0.3 }}
                        className="absolute -right-2 top-5 hidden h-px w-4 origin-left bg-gradient-to-r from-cortex-accent/50 to-transparent sm:block"
                      />
                    )}

                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                          className={clsx(
                            'relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-cortex-bg',
                            SEVERITY_DOT[sev] || SEVERITY_DOT.warn
                          )}
                        />
                      </div>
                      <motion.div
                        whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,217,255,0.1)' }}
                        className="flex-1 rounded-xl border border-cortex-border/40 bg-gradient-to-br from-cortex-surface/80 to-cortex-card/40 p-3 backdrop-blur-sm transition-colors hover:border-cortex-accent/30"
                      >
                        <div className="mb-1 flex items-center gap-1.5">
                          <Clock size={10} className="text-cortex-muted" />
                          <p className="font-mono text-[10px] font-bold text-cortex-accent">{evt.time}</p>
                        </div>
                        <p className="text-xs leading-snug text-cortex-text/90">{evt.event}</p>
                        <span
                          className={clsx(
                            'mt-2 inline-block rounded-md px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest',
                            sev === 'critical' && 'bg-cortex-red/20 text-cortex-red border border-cortex-red/30',
                            sev === 'error' && 'bg-cortex-red/10 text-cortex-red/90',
                            sev === 'warn' && 'bg-cortex-yellow/10 text-cortex-yellow',
                            sev === 'info' && 'bg-cortex-accent/10 text-cortex-accent'
                          )}
                        >
                          {evt.severity}
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
