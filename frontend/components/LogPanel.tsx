'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Wifi } from 'lucide-react';
import clsx from 'clsx';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  isStreaming: boolean;
  visibleCount: number;
  rapidStream?: boolean;
}

const LEVEL_STYLES: Record<string, { text: string; glow?: string }> = {
  INFO: { text: 'text-cortex-accent/90' },
  WARN: { text: 'text-cortex-yellow log-glow-warn' },
  ERROR: { text: 'text-cortex-red log-glow-error' },
  CRITICAL: { text: 'text-cortex-red font-semibold log-glow-critical' },
};

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts.slice(11, 19) || ts;
  }
}

export default function LogPanel({ logs, isStreaming, visibleCount, rapidStream }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayed = logs.slice(0, visibleCount);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: rapidStream ? 'auto' : 'smooth' });
  }, [visibleCount, logs.length, rapidStream]);

  return (
    <motion.div
      layout
      className={clsx('glass-card glow-border flex h-full min-h-[320px] flex-col overflow-hidden lg:min-h-0', isStreaming && 'active')}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cortex-green/40 bg-cortex-green/10 shadow-[0_0_12px_rgba(0,255,136,0.2)]">
            <Terminal size={14} className="text-cortex-green" />
          </div>
          <div>
            <span className="font-display text-sm font-semibold">Observability Terminal</span>
            <p className="font-mono text-[9px] text-cortex-muted">live · tail -f</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="flex items-center gap-1.5 rounded-full border border-cortex-green/30 bg-cortex-green/10 px-2 py-0.5 font-mono text-[9px] text-cortex-green"
            >
              <Wifi size={9} />
              LIVE
            </motion.span>
          )}
          <span className="rounded-md border border-cortex-border/40 bg-black/30 px-2 py-0.5 font-mono text-[10px] tabular-nums text-cortex-muted">
            {displayed.length}/{logs.length || '—'}
          </span>
        </div>
      </div>

      <div className="terminal-viewport">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="terminal-scanline" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-[#030508] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[#030508] to-transparent" />

        <div ref={scrollRef} className="relative z-0 h-full max-h-[calc(100vh-280px)] overflow-y-auto p-3 lg:max-h-none">
          {displayed.length === 0 && !isStreaming && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
              <Terminal size={28} className="text-cortex-muted/30" />
              <p className="text-xs text-cortex-muted">Awaiting telemetry stream</p>
              <p className="font-mono text-[10px] text-cortex-accent/50">
                cortexops@ops <span className="text-cortex-green">$</span> logs --follow --cluster prod
                <span className="terminal-cursor-blink ml-0.5 inline-block h-3 w-1.5 bg-cortex-accent align-middle" />
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {displayed.map((log, i) => {
              const style = LEVEL_STYLES[log.level] || { text: 'text-cortex-muted' };
              const isNew = i === displayed.length - 1 && isStreaming;
              return (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ duration: rapidStream ? 0.12 : 0.22 }}
                  className={clsx(
                    'terminal-line group flex gap-1.5 border-l-2 py-0.5 pl-2 sm:gap-2',
                    isNew ? 'border-cortex-accent/60 bg-cortex-accent/5' : 'border-transparent hover:border-cortex-accent/25 hover:bg-white/[0.02]',
                    log.level === 'CRITICAL' && 'log-glow-critical'
                  )}
                >
                  <span className="shrink-0 text-cortex-muted/60">{formatTime(log.timestamp)}</span>
                  <span className={clsx('shrink-0 w-16 uppercase sm:w-14', style.text)}>{log.level}</span>
                  <span className="hidden shrink-0 text-cortex-purple/80 sm:inline">[{log.service}]</span>
                  <span className="min-w-0 break-all text-cortex-text/90">{log.message}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(isStreaming || displayed.length > 0) && (
            <div className="mt-1 flex items-center gap-1 pl-2 font-mono text-[11px] text-cortex-accent">
              <span className="text-cortex-green">❯</span>
              <span className="terminal-cursor-blink inline-block h-3.5 w-2 bg-cortex-accent shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
