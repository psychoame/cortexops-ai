'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { AlertCircle, X } from 'lucide-react';
import Header from './Header';
import LogPanel from './LogPanel';
import AIAnalysisPanel from './AIAnalysisPanel';
import MetricsCards from './MetricsCards';
import dynamic from 'next/dynamic';

const Charts = dynamic(() => import('./Charts'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="skeleton h-[125px] rounded-xl" />
      <div className="skeleton h-[125px] rounded-xl" />
      <div className="skeleton h-[125px] rounded-xl" />
    </div>
  ),
});
import Timeline from './Timeline';
import SimulateButton from './SimulateButton';
import BootScreen from './BootScreen';
import { apiFetch } from '../lib/api';
import {
  AnalysisResult,
  LogEntry,
  MetricsData,
  Scenario,
  SimulateResponse,
} from '../types';

function AmbientBackground() {
  return (
    <>
      <div className="ambient-layer">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>
      <div className="noise-overlay" />
    </>
  );
}

export default function Dashboard() {
  const [booted, setBooted] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('random');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [visibleLogCount, setVisibleLogCount] = useState(0);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scenarioName, setScenarioName] = useState<string | undefined>();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [incidentMode, setIncidentMode] = useState(false);
  const [spikeMode, setSpikeMode] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [dashboardPulse, setDashboardPulse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const incidentActive = logs.length > 0;
  const finishBoot = useCallback(() => setBooted(true), []);

  useEffect(() => {
    const failsafe = setTimeout(finishBoot, 3200);
    return () => clearTimeout(failsafe);
  }, [finishBoot]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const r = await apiFetch('/health');
        setBackendOnline(r.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    apiFetch('/api/scenarios')
      .then(r => r.json())
      .then(data => setScenarios(data.scenarios ?? []))
      .catch(() =>
        setScenarios([
          { id: 'random', name: 'Random Failure', icon: '⚡' },
          { id: 'database_overload', name: 'Database Overload', icon: '🗄️' },
          { id: 'redis_overflow', name: 'Redis Memory Overflow', icon: '💾' },
          { id: 'api_latency_spike', name: 'API Latency Spike', icon: '📈' },
          { id: 'k8s_pod_crashloop', name: 'K8s CrashLoopBackOff', icon: '☸️' },
          { id: 'network_partition', name: 'Network Partition', icon: '🔌' },
        ])
      );
  }, []);

  const streamLogs = useCallback((incoming: LogEntry[], rapid = false) => {
    setIsStreaming(true);
    setVisibleLogCount(0);
    let count = 0;
    const delay = rapid ? 70 : 180;
    const interval = setInterval(() => {
      count++;
      setVisibleLogCount(count);
      if (count >= incoming.length) {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, delay);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    setError(null);
    setIsSimulating(true);
    setAnalysis(null);
    setLogs([]);
    setMetrics(null);
    setVisibleLogCount(0);
    setIncidentMode(true);
    setSpikeMode(true);
    setDashboardPulse(true);
    setTimeout(() => setDashboardPulse(false), 700);

    try {
      const simRes = await apiFetch('/api/simulate-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: selectedScenario }),
      });

      const simData: SimulateResponse = await simRes.json();
      if (!simData.logs?.length) throw new Error('No logs returned from simulation');

      setChartKey(k => k + 1);
      setLogs(simData.logs);
      setMetrics(simData.metrics);
      setScenarioName(simData.scenario_name ?? simData.scenario);
      streamLogs(simData.logs, true);

      await new Promise(r => setTimeout(r, Math.min(simData.logs.length * 70, 900)));

      setIsAnalyzing(true);
      const analyzeRes = await apiFetch('/api/analyze-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: simData.logs, scenario: simData.scenario }),
      });

      const analysisData: AnalysisResult = await analyzeRes.json();
      await new Promise(r => setTimeout(r, 400));
      setAnalysis(analysisData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      console.error(err);
      setError(
        backendOnline
          ? msg
          : 'Cannot reach backend. Run: cd backend && python -m uvicorn main:app --reload --port 8000'
      );
      setIncidentMode(false);
      setSpikeMode(false);
    } finally {
      setIsSimulating(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!booted && <BootScreen key="boot" onComplete={finishBoot} />}
      </AnimatePresence>

      {booted && (
        <>
          <AmbientBackground />
          <div className={clsx('incident-ambient', incidentMode && 'active')} />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={clsx('relative z-10 flex min-h-screen flex-col', dashboardPulse && 'dashboard-pulse')}
          >
            <Header
              incidentActive={incidentActive}
              incidentMode={incidentMode}
              scenarioName={scenarioName}
              isAnalyzing={isAnalyzing}
              backendOnline={backendOnline}
            />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="relative z-50 mx-4 mt-3 flex items-start gap-3 rounded-xl border border-cortex-red/40 bg-cortex-red/15 px-4 py-3 lg:mx-6"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-cortex-red" />
                  <p className="flex-1 font-mono text-xs leading-relaxed text-cortex-text">{error}</p>
                  <button type="button" onClick={() => setError(null)} className="shrink-0 text-cortex-muted hover:text-cortex-text" aria-label="Dismiss">
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!backendOnline && !error && (
              <div className="mx-4 mt-3 rounded-xl border border-cortex-yellow/30 bg-cortex-yellow/10 px-4 py-2 font-mono text-[11px] text-cortex-yellow lg:mx-6">
                Backend offline — run:{' '}
                <code className="text-cortex-text">python -m uvicorn main:app --reload --port 8000</code> in{' '}
                <code className="text-cortex-text">backend</code>
              </div>
            )}

            <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-4 p-4 lg:gap-5 lg:p-6">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="bg-gradient-to-r from-cortex-text via-cortex-accent to-cortex-purple bg-clip-text font-display text-xl font-bold text-transparent lg:text-2xl">
                    Operations Command Center
                  </h2>
                  <p className="font-mono text-[11px] text-cortex-muted">
                    Autonomous DevOps intelligence · real-time observability
                  </p>
                </div>
                <SimulateButton
                  scenarios={scenarios}
                  selectedScenario={selectedScenario}
                  onScenarioChange={setSelectedScenario}
                  onSimulate={handleSimulate}
                  isLoading={isSimulating || isAnalyzing}
                  disabled={false}
                />
              </motion.section>

              <section className="stagger-children grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5 lg:min-h-[calc(100vh-240px)]">
                <div className="flex min-h-[320px] flex-col lg:col-span-3 lg:min-h-0">
                  <LogPanel logs={logs} isStreaming={isStreaming} visibleCount={visibleLogCount} rapidStream={incidentMode} />
                </div>
                <div className="flex min-h-[360px] flex-col lg:col-span-5 lg:min-h-0">
                  <AIAnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
                </div>
                <div className="flex min-h-0 flex-col gap-3 sm:gap-4 lg:col-span-4">
                  <MetricsCards metrics={metrics} incidentActive={incidentActive} spikeMode={spikeMode} />
                  <Charts metrics={metrics} chartKey={chartKey} spikeMode={spikeMode} />
                </div>
              </section>

              <section>
                <Timeline events={analysis?.timeline ?? []} incidentActive={incidentActive} />
              </section>
            </main>

            <footer className="relative z-10 border-t border-white/[0.04] py-3 text-center font-mono text-[10px] text-cortex-muted/50">
              CortexOps AI · Enterprise infrastructure intelligence
            </footer>
          </motion.div>
        </>
      )}
    </>
  );
}
