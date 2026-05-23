export interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

export interface MetricPoint {
  time: string;
  value: number;
}

export interface MetricsData {
  cpu_series: MetricPoint[];
  latency_series: MetricPoint[];
  error_series: MetricPoint[];
  current: {
    cpu: number;
    latency: number;
    error_rate: number;
    throughput: number;
  };
}

export interface SimulateResponse {
  logs: LogEntry[];
  metrics: MetricsData;
  scenario: string;
  scenario_name?: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  severity: string;
}

export interface AnalysisResult {
  root_cause: string;
  severity: string;
  confidence: string;
  recommended_fix: string;
  summary: string;
  affected_services: string[];
  timeline: TimelineEvent[];
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
}
