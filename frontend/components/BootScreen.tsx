'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

const BOOT_LINES = [
  '> Initializing CortexOps AI kernel...',
  '> Loading observability engines...',
  '> Connecting telemetry pipelines...',
  '> Starting inference subsystem...',
  '> Calibrating incident intelligence...',
  '> System ready.',
];

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let lineIdx = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      onCompleteRef.current();
    };

    const lineInterval = setInterval(() => {
      if (lineIdx < BOOT_LINES.length) {
        const currentLine = BOOT_LINES[lineIdx];

        setLines((prev) => [...prev, currentLine]);
        setProgress(((lineIdx + 1) / BOOT_LINES.length) * 100);

        lineIdx++;
      } else {
        clearInterval(lineInterval);
        setTimeout(finish, 300);
      }
    }, 280);

    const maxWait = setTimeout(finish, 2800);

    return () => {
      clearInterval(lineInterval);
      clearTimeout(maxWait);
    };
  }, []);

  return (
    <motion.div
      className="boot-screen"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative mb-8">
        <div className="boot-logo-ring" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cortex-accent/40 bg-gradient-to-br from-cortex-accent/20 to-cortex-purple/20 shadow-glow-md"
        >
          <Zap size={36} className="text-cortex-accent" />
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-1 font-display text-2xl font-bold tracking-tight"
      >
        Cortex<span className="text-cortex-accent">Ops</span> AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mb-8 font-mono text-[11px] text-cortex-muted"
      >
        Autonomous infrastructure intelligence
      </motion.p>

      <div className="mb-4 h-1 w-64 overflow-hidden rounded-full bg-cortex-border/40">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cortex-accent via-cortex-blue to-cortex-purple"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="h-28 w-full max-w-md space-y-1 px-8 font-mono text-[11px] text-cortex-muted">
        <AnimatePresence>
          {lines.filter(Boolean).map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={
                line?.toLowerCase().includes('ready')
                  ? 'text-green-400'
                  : ''
              }
            >
              {line}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}