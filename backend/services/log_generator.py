import random
from datetime import datetime, timedelta
from schemas.models import LogEntry

SCENARIOS = {
    "database_overload": {
        "name": "Database Overload",
        "logs": [
            ("INFO", "api-gateway", "Request received: POST /api/checkout"),
            ("INFO", "auth-service", "User authentication successful"),
            ("WARN", "db-primary", "Connection pool utilization at 78%"),
            ("WARN", "db-primary", "Slow query detected: SELECT * FROM orders (2.3s)"),
            ("ERROR", "db-primary", "Connection pool exhausted - max 100 connections reached"),
            ("ERROR", "checkout-service", "Database timeout after 5000ms"),
            ("CRITICAL", "checkout-service", "Checkout transaction failed - unable to acquire DB connection"),
            ("ERROR", "api-gateway", "503 Service Unavailable returned to client"),
            ("WARN", "db-replica", "Replica lag increasing: 4.2s behind primary"),
            ("CRITICAL", "db-primary", "Memory usage at 94% - OOM risk"),
            ("ERROR", "order-service", "Failed to persist order: connection refused"),
            ("CRITICAL", "monitoring", "ALERT: Database error rate exceeded threshold (47 errors/min)"),
        ],
        "metrics": {"cpu": 89, "latency": 4200, "error_rate": 47, "throughput": 12},
    },
    "redis_overflow": {
        "name": "Redis Memory Overflow",
        "logs": [
            ("INFO", "cache-service", "Redis cluster health check initiated"),
            ("WARN", "redis-node-1", "Memory usage at 82% (6.5GB / 8GB)"),
            ("WARN", "cache-service", "Cache hit rate dropping: 94% → 71%"),
            ("ERROR", "redis-node-1", "Memory overflow - evicting keys with LRU policy"),
            ("ERROR", "session-service", "Session cache miss for user_id 48291"),
            ("CRITICAL", "redis-node-1", "OOM command not allowed when used memory > maxmemory"),
            ("ERROR", "api-gateway", "Session validation failed - cache unavailable"),
            ("WARN", "redis-node-2", "Receiving failover traffic from node-1"),
            ("CRITICAL", "redis-node-2", "Memory threshold breached under failover load"),
            ("ERROR", "user-service", "Cannot store user preferences: Redis ENOMEM"),
            ("CRITICAL", "monitoring", "ALERT: Redis cluster degraded - 2/3 nodes affected"),
        ],
        "metrics": {"cpu": 67, "latency": 1800, "error_rate": 28, "throughput": 34},
    },
    "api_latency_spike": {
        "name": "API Latency Spike",
        "logs": [
            ("INFO", "load-balancer", "Traffic distribution nominal across 4 instances"),
            ("WARN", "api-instance-2", "Response time increasing: p99 = 890ms"),
            ("WARN", "api-instance-3", "Response time increasing: p99 = 1240ms"),
            ("ERROR", "api-instance-2", "Request queue depth at 847 - backpressure detected"),
            ("WARN", "cdn-edge", "Cache MISS rate spike: 23% → 61%"),
            ("ERROR", "api-instance-3", "Thread pool saturation: 100/100 threads active"),
            ("CRITICAL", "api-gateway", "Latency SLO breach: p95 = 4.7s (threshold: 500ms)"),
            ("ERROR", "load-balancer", "Health check failed for api-instance-3"),
            ("WARN", "load-balancer", "Removing api-instance-3 from rotation"),
            ("CRITICAL", "api-instance-2", "Circuit breaker OPEN - downstream timeout cascade"),
            ("ERROR", "monitoring", "ALERT: 14% of requests returning 504 Gateway Timeout"),
        ],
        "metrics": {"cpu": 94, "latency": 4700, "error_rate": 14, "throughput": 8},
    },
    "k8s_pod_crashloop": {
        "name": "Kubernetes Pod CrashLoop",
        "logs": [
            ("INFO", "k8s-scheduler", "Deployment rollout initiated: payment-service v2.4.1"),
            ("WARN", "k8s-node-1", "Pod payment-service-7d9f starting"),
            ("ERROR", "payment-service", "FATAL: Cannot connect to vault.internal:8200 - connection refused"),
            ("WARN", "k8s-node-1", "Container exited with code 1 - restarting"),
            ("ERROR", "payment-service", "FATAL: Secret STRIPE_KEY not found in environment"),
            ("WARN", "k8s-scheduler", "Pod restart count: 3 (CrashLoopBackOff threshold approaching)"),
            ("ERROR", "payment-service", "FATAL: Database migration failed - schema version mismatch"),
            ("CRITICAL", "k8s-node-1", "Pod payment-service-7d9f in CrashLoopBackOff (5 restarts)"),
            ("ERROR", "k8s-scheduler", "Deployment rollout BLOCKED - readiness probe failing"),
            ("CRITICAL", "monitoring", "ALERT: payment-service UNAVAILABLE - all pods unhealthy"),
            ("ERROR", "api-gateway", "Upstream payment-service returning 503 for 100% of requests"),
        ],
        "metrics": {"cpu": 45, "latency": 9999, "error_rate": 100, "throughput": 0},
    },
    "network_partition": {
        "name": "Network Partition",
        "logs": [
            ("INFO", "service-mesh", "Istio sidecar health nominal across all pods"),
            ("WARN", "network-monitor", "Packet loss detected on us-east-1b subnet: 2.3%"),
            ("WARN", "consul", "Health check timeout for 3 services in zone us-east-1b"),
            ("ERROR", "network-monitor", "ARP table inconsistency detected on switch core-02"),
            ("CRITICAL", "consul", "Split-brain scenario: services in us-east-1b unreachable from 1a"),
            ("ERROR", "order-service", "Cannot reach inventory-service: dial tcp timeout"),
            ("ERROR", "inventory-service", "Cannot reach order-service: no route to host"),
            ("CRITICAL", "payment-service", "Distributed transaction coordinator unreachable"),
            ("ERROR", "data-sync", "Replication lag: 47 seconds - consistency at risk"),
            ("CRITICAL", "monitoring", "ALERT: Network partition detected between availability zones"),
            ("ERROR", "load-balancer", "Cross-zone load balancing disabled - traffic isolation"),
        ],
        "metrics": {"cpu": 52, "latency": 8300, "error_rate": 62, "throughput": 5},
    },
}

def generate_logs(scenario: str = "random") -> dict:
    if scenario == "random":
        scenario = random.choice(list(SCENARIOS.keys()))
    
    scenario_data = SCENARIOS.get(scenario, SCENARIOS["database_overload"])
    base_time = datetime.utcnow() - timedelta(minutes=5)
    
    logs = []
    for i, (level, service, message) in enumerate(scenario_data["logs"]):
        timestamp = base_time + timedelta(seconds=i * 18 + random.randint(0, 10))
        logs.append(LogEntry(
            timestamp=timestamp.strftime("%Y-%m-%dT%H:%M:%S.") + f"{random.randint(100,999)}Z",
            level=level,
            service=service,
            message=message,
        ))
    
    return {
        "logs": logs,
        "metrics": generate_metrics(scenario_data["metrics"]),
        "scenario": scenario,
        "scenario_name": scenario_data["name"],
    }

def generate_metrics(base_metrics: dict) -> dict:
    def jitter(val, pct=10):
        return max(0, min(100, val + random.randint(-pct, pct)))
    
    cpu_series = []
    latency_series = []
    error_series = []
    
    for i in range(20):
        t = (datetime.utcnow() - timedelta(minutes=20 - i)).strftime("%H:%M")
        cpu_series.append({"time": t, "value": jitter(base_metrics["cpu"] - 30 + i * 2)})
        latency_series.append({"time": t, "value": int(base_metrics["latency"] * (0.1 + (i / 20) * 0.9) + random.randint(-100, 100))})
        error_series.append({"time": t, "value": jitter(base_metrics["error_rate"] * (0.05 + (i / 20)) )})
    
    return {
        "cpu_series": cpu_series,
        "latency_series": latency_series,
        "error_series": error_series,
        "current": {
            "cpu": base_metrics["cpu"],
            "latency": base_metrics["latency"],
            "error_rate": base_metrics["error_rate"],
            "throughput": base_metrics["throughput"],
        }
    }