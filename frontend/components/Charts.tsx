'use client';

import { useMemo, type ElementType } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { MetricsData } from '../types';

interface ChartsProps {
  metrics: MetricsData | null;
  chartKey?: number;
  spikeMode?: boolean;
}

interface ChartCardProps {
  title: string;
  icon: ElementType;
  data: { time: string; value: number }[];
  color: string;
  colorEnd: string;
  gradientId: string;
  unit?: string;
  index: number;
  chartKey?: number;
  spikeMode?: boolean;
}

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-cortex-accent/30 bg-cortex-card/95 px-3 py-2 font-mono text-[10px] shadow-glow-sm backdrop-blur-xl">
      <p className="text-cortex-muted">{label}</p>
      <p className="text-lg font-bold text-cortex-accent">
        {payload[0].value}
        <span className="text-cortex-muted text-[10px]">{unit}</span>
      </p>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  data,
  color,
  colorEnd,
  gradientId,
  unit = '',
  index,
  chartKey = 0,
  spikeMode,
}: ChartCardProps) {
  const hasData = data.length > 0;
  const displayData = useMemo(() => {
    if (!spikeMode || !hasData) return data;
    return data.map((d, i) => ({
      ...d,
      value: Math.round(d.value * (0.55 + (i / data.length) * 0.55)),
    }));
  }, [data, spikeMode, hasData]);

  return (
    <motion.div
      key={`${gradientId}-${chartKey}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={{ y: -2 }}
      className="glass-card glow-border overflow-hidden rounded-xl border border-white/[0.05]"
    >
      <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2">
        <div className="flex items-center gap-2">
          <Icon size={12} className="text-cortex-muted" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-cortex-muted">{title}</span>
        </div>
        {spikeMode && (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="font-mono text-[8px] uppercase text-cortex-red"
          >
            spike
          </motion.span>
        )}
      </div>
      <div className="h-[125px] w-full p-2">
        {!hasData ? (
          <div className="skeleton h-full w-full rounded-lg opacity-30" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={colorEnd} stopOpacity={0} />
                </linearGradient>
                <filter id={`glow-${gradientId}`}>
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,217,255,0.06)" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#5C6B82', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#5C6B82', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<ChartTooltip unit={unit} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                filter={`url(#glow-${gradientId})`}
                animationDuration={spikeMode ? 400 : 1200}
                animationEasing="ease-out"
                isAnimationActive
                dot={false}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: '#04060C',
                  strokeWidth: 2,
                  style: { filter: `drop-shadow(0 0 6px ${color})` },
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

export default function Charts({ metrics, chartKey = 0, spikeMode }: ChartsProps) {
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <ChartCard
        title="CPU Utilization"
        icon={Activity}
        data={metrics?.cpu_series ?? []}
        color="#00D9FF"
        colorEnd="#3B82F6"
        gradientId="cpuGrad"
        unit="%"
        index={0}
        chartKey={chartKey}
        spikeMode={spikeMode}
      />
      <ChartCard
        title="Latency p95"
        icon={TrendingUp}
        data={metrics?.latency_series ?? []}
        color="#FFB800"
        colorEnd="#FF3D5E"
        gradientId="latGrad"
        unit="ms"
        index={1}
        chartKey={chartKey}
        spikeMode={spikeMode}
      />
      <ChartCard
        title="Error Rate"
        icon={AlertCircle}
        data={metrics?.error_series ?? []}
        color="#FF3D5E"
        colorEnd="#8B5CF6"
        gradientId="errGrad"
        unit="/min"
        index={2}
        chartKey={chartKey}
        spikeMode={spikeMode}
      />
    </div>
  );
}
