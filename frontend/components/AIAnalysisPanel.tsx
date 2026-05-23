'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Shield, AlertOctagon, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { AnalysisResult } from '../types';

interface AIAnalysisPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

const KEYWORDS = [
  'connection pool', 'timeout', 'OOM', 'memory', 'latency', 'circuit breaker',
  'CrashLoopBackOff', 'Redis', 'database', 'partition', 'overload', 'exhausted',
  '503', 'critical', 'cascade', 'replica', 'pod', 'vault', 'cache', 'SLO',
];

const STREAM_STATUS = [
  'Ingesting telemetry vectors…',
  'Correlating cross-service traces…',
  'Running causal inference graph…',
  'Detecting anomaly signatures…',
  'Synthesizing root cause hypothesis…',
];

function highlightKeywords(text: string) {
  if (!text) return text;
  const pattern = new RegExp(`(${KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(pattern).map((part, i) =>
    KEYWORDS.some(k => k.toLowerCase() === part.toLowerCase()) ? (
      <span key={i} className="keyword-highlight">{part}</span>
    ) : (
      part
    )
  );
}

function TypedText({ text, speed = 10 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
      } else {
        setDone(true);
        clearInterval(iv);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return (
    <span>
      {highlightKeywords(displayed)}
      {!done && <span className="typing-cursor" />}
    </span>
  );
}

function ConfidenceRing({ value }: { value: string }) {
  const pct = useMemo(() => {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }, [value]);

  const c = 2 * Math.PI * 22;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="-rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(0,255,136,0.1)" strokeWidth="3" />
        <motion.circle
          cx="28" cy="28" r="22" fill="none" stroke="url(#confGrad)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.6))' }}
        />
        <defs>
          <linearGradient id="confGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00FF88" />
            <stop offset="100%" stopColor="#00D9FF" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute font-mono text-[11px] font-bold text-cortex-green">{pct}%</span>
    </div>
  );
}

function AnalyzingState() {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setStatusIdx(i => (i + 1) % STREAM_STATUS.length), 1400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-cortex-purple/40 bg-cortex-purple/15"
        >
          <div className="absolute inset-0 rounded-xl bg-cortex-purple/20 blur-md" />
          <Brain size={22} className="relative text-cortex-purple" />
        </motion.div>
        <div>
          <p className="font-display text-sm font-semibold text-cortex-text">Inference in progress</p>
          <motion.p
            key={statusIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[10px] text-cortex-accent"
          >
            {STREAM_STATUS[statusIdx]}
          </motion.p>
        </div>
      </div>

      <div className="space-y-2">
        {[100, 92, 85, 78].map((w, i) => (
          <div key={i} className="skeleton h-3" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-24 rounded-xl" />
      </div>

      <div className="flex items-center gap-2 font-mono text-[10px] text-cortex-purple/90">
        <Sparkles size={10} className="animate-pulse" />
        <span className="terminal-cursor-blink">Neural ops engine active</span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const isCritical = severity === 'Critical';
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'inline-flex items-center gap-2 rounded-lg px-3 py-1 font-display text-lg font-bold',
        `severity-${severity}`,
        isCritical && 'border border-cortex-red/50 bg-cortex-red/15 shadow-glow-red'
      )}
    >
      {isCritical && (
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="h-2 w-2 rounded-full bg-cortex-red shadow-[0_0_12px_rgba(255,61,94,1)]"
        />
      )}
      {severity}
    </motion.span>
  );
}

export default function AIAnalysisPanel({ analysis, isAnalyzing }: AIAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'fix'>('summary');

  return (
    <motion.div
      layout
      className={clsx(
        'glass-card-bright glow-border flex h-full min-h-[360px] flex-col glow-accent lg:min-h-0',
        'ai-engine-glow',
        isAnalyzing && 'analyzing active'
      )}
    >
      <div className="relative overflow-hidden border-b border-white/[0.06] px-5 py-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cortex-purple/5 via-transparent to-cortex-accent/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cortex-purple/40 bg-gradient-to-br from-cortex-purple/25 to-cortex-accent/10">
              <Brain size={16} className="text-cortex-purple" />
            </div>
            <div>
              <span className="font-display text-sm font-bold tracking-tight">
                AI Incident Intelligence
              </span>
              <p className="font-mono text-[9px] text-cortex-muted">Autonomous root cause engine</p>
            </div>
          </div>
          {analysis && !isAnalyzing && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 rounded-full border border-cortex-green/30 bg-cortex-green/10 px-2.5 py-1"
            >
              <CheckCircle2 size={11} className="text-cortex-green" />
              <span className="font-mono text-[10px] font-bold text-cortex-green">Complete</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isAnalyzing && <AnalyzingState />}

        {!isAnalyzing && !analysis && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 px-6 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-2xl bg-cortex-purple/30 blur-2xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cortex-purple/30 bg-cortex-purple/10">
                <Brain size={32} className="text-cortex-purple/60" />
              </div>
            </motion.div>
            <div>
              <p className="font-display text-base font-semibold">Engine Standby</p>
              <p className="mt-1 text-sm text-cortex-muted">
                Deploy an incident to activate autonomous analysis
              </p>
            </div>
          </div>
        )}

        {!isAnalyzing && analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-5 p-5"
          >
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ y: -2 }}
                className={clsx(
                  'rounded-xl border p-3 backdrop-blur-sm',
                  analysis.severity === 'Critical'
                    ? 'border-cortex-red/40 bg-gradient-to-br from-cortex-red/15 to-transparent'
                    : 'border-cortex-yellow/30 bg-gradient-to-br from-cortex-yellow/10 to-transparent'
                )}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <AlertOctagon size={12} className={analysis.severity === 'Critical' ? 'text-cortex-red' : 'text-cortex-yellow'} />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cortex-muted">Severity</span>
                </div>
                <SeverityBadge severity={analysis.severity} />
              </motion.div>

              <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 rounded-xl border border-cortex-green/25 bg-gradient-to-br from-cortex-green/10 to-cortex-accent/5 p-3">
                <ConfidenceRing value={analysis.confidence} />
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-cortex-muted">Confidence</span>
                  <p className="font-display text-xl font-bold text-cortex-green">{analysis.confidence}</p>
                </div>
              </motion.div>
            </div>

            <div className="rounded-xl border border-cortex-accent/20 bg-gradient-to-br from-cortex-surface/80 to-cortex-card/40 p-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Shield size={13} className="text-cortex-accent" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-cortex-accent">Root Cause · Live</span>
              </div>
              <p className="font-body text-sm leading-relaxed text-cortex-text/95">
                <TypedText text={analysis.root_cause} speed={6} />
              </p>
            </div>

            <div>
              <div className="mb-3 flex gap-2">
                {(['summary', 'fix'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      'rounded-lg border px-3 py-1.5 font-mono text-xs capitalize transition-all duration-300',
                      activeTab === tab
                        ? 'border-cortex-accent/40 bg-cortex-accent/15 text-cortex-accent shadow-glow-sm'
                        : 'border-cortex-border/50 text-cortex-muted hover:border-cortex-accent/25 hover:text-cortex-text'
                    )}
                  >
                    {tab === 'fix' ? 'Remediation' : 'Summary'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'summary' && (
                  <motion.p
                    key="summary"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="font-body text-sm leading-relaxed text-cortex-text/85"
                  >
                    {highlightKeywords(analysis.summary)}
                  </motion.p>
                )}
                {activeTab === 'fix' && (
                  <motion.div key="fix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {analysis.recommended_fix.split('\n').map(
                      (step, i) =>
                        step.trim() && (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ x: 4 }}
                            className="flex gap-3 rounded-lg border border-cortex-border/30 bg-cortex-surface/40 p-2.5 transition-colors hover:border-cortex-accent/25 hover:bg-cortex-accent/5"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-cortex-accent/15 font-mono text-[10px] font-bold text-cortex-accent">
                              {i + 1}
                            </span>
                            <span className="text-sm leading-relaxed text-cortex-text/85">
                              {step.replace(/^\d+\.\s*/, '')}
                            </span>
                          </motion.div>
                        )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-cortex-muted">
                Affected Services
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.affected_services.map((svc, i) => (
                  <motion.span
                    key={svc}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    whileHover={{ scale: 1.06, boxShadow: '0 0 16px rgba(255,61,94,0.3)' }}
                    className="rounded-lg border border-cortex-red/30 bg-cortex-red/10 px-2.5 py-1 font-mono text-xs text-cortex-red"
                  >
                    {svc}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
