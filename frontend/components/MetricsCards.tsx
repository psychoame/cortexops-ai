'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Gauge, AlertTriangle, Zap } from 'lucide-react';
import clsx from 'clsx';
import { MetricsData } from '../types';

interface MetricsCardsProps {
  metrics: MetricsData | null;
  incidentActive: boolean;
  spikeMode?: boolean;
}

const CARDS = [
  { key: 'cpu' as const, label: 'CPU', icon: Cpu, unit: '%', color: 'accent', warn: 80 },
  { key: 'latency' as const, label: 'Latency', icon: Gauge, unit: 'ms', color: 'yellow', warn: 1000 },
  { key: 'error_rate' as const, label: 'Errors', icon: AlertTriangle, unit: '/min', color: 'red', warn: 20 },
  { key: 'throughput' as const, label: 'Throughput', icon: Zap, unit: 'req/s', color: 'green', warn: 0 },
];

const colorMap = {
  accent: { border: 'border-cortex-accent/30', bg: 'bg-cortex-accent/10', text: 'text-cortex-accent', glow: 'shadow-glow-sm', dot: 'bg-cortex-accent' },
  yellow: { border: 'border-cortex-yellow/30', bg: 'bg-cortex-yellow/10', text: 'text-cortex-yellow', glow: '', dot: 'bg-cortex-yellow' },
  red: { border: 'border-cortex-red/30', bg: 'bg-cortex-red/10', text: 'text-cortex-red', glow: 'shadow-glow-red', dot: 'bg-cortex-red' },
  green: { border: 'border-cortex-green/30', bg: 'bg-cortex-green/10', text: 'text-cortex-green', glow: '', dot: 'bg-cortex-green' },
};

function AnimatedValue({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const from = shown;
    const to = value;
    const duration = 700;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{shown}</>;
}

export default function MetricsCards({ metrics, incidentActive, spikeMode }: MetricsCardsProps) {
  const current = metrics?.current;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {CARDS.map((card, i) => {
        const colors = colorMap[card.color as keyof typeof colorMap];
        const value = current ? current[card.key] : null;
        const isHigh =
          value !== null &&
          (card.key === 'throughput' ? value < 20 && incidentActive : value >= card.warn);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: spikeMode && isHigh ? [1, 1.04, 1] : 1,
            }}
            transition={{
              delay: i * 0.06,
              scale: spikeMode ? { repeat: 2, duration: 0.4 } : undefined,
            }}
            whileHover={{ y: -3, scale: 1.02 }}
            className={clsx(
              'glass-card rounded-xl border p-3 transition-shadow duration-300',
              colors.border,
              colors.bg,
              (isHigh || spikeMode) && isHigh && colors.glow
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <card.icon size={14} className={colors.text} />
              {(incidentActive || spikeMode) && isHigh && (
                <span className="relative flex h-2 w-2">
                  <span className={clsx('absolute inset-0 animate-ping rounded-full opacity-50', colors.dot)} />
                  <span className={clsx('relative h-2 w-2 rounded-full', colors.dot)} />
                </span>
              )}
            </div>
            <p className="font-mono text-[8px] uppercase tracking-widest text-cortex-muted">{card.label}</p>
            {value === null ? (
              <div className="mt-2 h-7 w-20 skeleton" />
            ) : (
              <p className={clsx('mt-0.5 font-display text-xl font-bold tabular-nums', colors.text)}>
                <AnimatedValue value={value} />
                <span className="ml-0.5 text-[10px] font-mono font-normal text-cortex-muted">{card.unit}</span>
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
