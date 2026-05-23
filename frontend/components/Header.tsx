'use client';

import { motion } from 'framer-motion';
import { Activity, Brain, Radio, Zap } from 'lucide-react';
import clsx from 'clsx';

interface HeaderProps {
  incidentActive: boolean;
  incidentMode?: boolean;
  scenarioName?: string;
  isAnalyzing: boolean;
  backendOnline: boolean;
}

const TICKER_ITEMS = [
  'cpu.cluster.us-east ▓ 78%',
  'latency.p95 ▓ 420ms',
  'error.rate ▓ 12/min',
  'pods.healthy ▓ 47/48',
  'traces.ingested ▓ 12.4k/s',
  'ai.inference ▓ online',
  'mesh.health ▓ nominal',
];

export default function Header({
  incidentActive,
  incidentMode,
  scenarioName,
  isAnalyzing,
  backendOnline,
}: HeaderProps) {
  const tickerText = [...TICKER_ITEMS, ...TICKER_ITEMS].join('   ·   ');

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-cortex-bg/80 backdrop-blur-2xl">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cortex-accent/50 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cortex-purple/20 to-transparent" />

      <div className="mx-auto flex h-14 max-w-[1920px] items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <motion.div
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cortex-accent/40 bg-gradient-to-br from-cortex-accent/20 to-cortex-blue/10 shadow-glow-sm"
            whileHover={{ scale: 1.06, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Zap size={18} className="text-cortex-accent" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cortex-green shadow-[0_0_8px_rgba(0,255,136,0.8)]">
              <span className="absolute inset-0 animate-ping rounded-full bg-cortex-green opacity-60" />
            </span>
          </motion.div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-bold tracking-tight lg:text-lg">
              Cortex<span className="bg-gradient-to-r from-cortex-accent to-cortex-blue bg-clip-text text-transparent">Ops</span>
              <span className="ml-1.5 text-[10px] font-mono font-normal text-cortex-muted">AI</span>
            </h1>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center px-4 md:flex">
          <motion.div
            layout
            animate={
              incidentMode
                ? { scale: [1, 1.03, 1], boxShadow: ['0 0 0 rgba(255,61,94,0)', '0 0 24px rgba(255,61,94,0.4)', '0 0 0 rgba(255,61,94,0)'] }
                : {}
            }
            transition={{ repeat: incidentMode ? Infinity : 0, duration: 2 }}
            className={clsx(
              'flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[11px] transition-all duration-500',
              incidentActive || incidentMode
                ? 'border-cortex-red/50 bg-cortex-red/15 text-cortex-red shadow-glow-red'
                : 'border-cortex-border/50 bg-cortex-surface/40 text-cortex-muted'
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              {(incidentActive || incidentMode) && (
                <span className="absolute inset-0 animate-ping rounded-full bg-cortex-red opacity-75" />
              )}
              <span
                className={clsx(
                  'relative h-2.5 w-2.5 rounded-full',
                  incidentActive || incidentMode ? 'bg-cortex-red' : 'bg-cortex-green shadow-[0_0_8px_rgba(0,255,136,0.6)]'
                )}
              />
            </span>
            {incidentActive || incidentMode ? (
              <>
                <Radio size={12} />
                <span className="uppercase tracking-widest font-semibold">Live Incident</span>
                {scenarioName && <span className="hidden text-cortex-text/70 lg:inline">· {scenarioName}</span>}
              </>
            ) : (
              <span className="uppercase tracking-widest">Systems Nominal</span>
            )}
          </motion.div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className={clsx(
              'hidden items-center gap-2 rounded-xl border px-2.5 py-1.5 sm:flex transition-all duration-500',
              isAnalyzing
                ? 'border-cortex-purple/50 bg-cortex-purple/15 shadow-glow-purple'
                : 'border-cortex-border/40 bg-cortex-surface/50'
            )}
          >
            <Brain size={14} className={clsx(isAnalyzing && 'animate-pulse text-cortex-purple')} />
            <span className="font-mono text-[9px] uppercase tracking-wider text-cortex-muted">AI</span>
            <span className={clsx('font-mono text-[10px] font-bold', isAnalyzing ? 'text-cortex-purple' : 'text-cortex-green')}>
              {isAnalyzing ? 'Inferring' : 'Ready'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-cortex-border/40 bg-cortex-surface/50 px-2.5 py-1.5">
            <Activity size={12} className={backendOnline ? 'text-cortex-green' : 'text-cortex-red'} />
            <span className={clsx('font-mono text-[10px] font-bold', backendOnline ? 'text-cortex-green' : 'text-cortex-red')}>
              {backendOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="telemetry-ticker border-t border-white/[0.04] py-1">
        <div className="telemetry-ticker-inner px-4">{tickerText}</div>
      </div>
    </header>
  );
}
