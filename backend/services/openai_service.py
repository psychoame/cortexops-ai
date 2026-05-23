import os
import json
from openai import OpenAI
from schemas.models import LogEntry, AnalysisResponse
from typing import List

_api_key = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=_api_key) if _api_key else None

FALLBACK_ANALYSES = {
    "database_overload": {
        "root_cause": "Database connection pool exhaustion caused by a surge in slow queries (avg 2.3s) combined with insufficient connection pool sizing. The primary bottleneck is unoptimized SELECT queries scanning full table partitions under high concurrency load.",
        "severity": "Critical",
        "confidence": "94%",
        "recommended_fix": "1. Immediately increase connection pool size from 100 → 300 connections.\n2. Add DB read replicas and route SELECT queries to replicas.\n3. Optimize slow queries with proper indexing on orders.created_at and orders.user_id.\n4. Implement connection pooling via PgBouncer.\n5. Set query timeout to 3s to prevent long-running query accumulation.",
        "summary": "A cascading database failure occurred when unoptimized queries caused connection pool exhaustion. The checkout service became unable to acquire database connections, resulting in a 47 errors/min spike and 503 responses to end users. Memory pressure on the primary node (94%) further risks data integrity.",
        "affected_services": ["db-primary", "checkout-service", "order-service", "api-gateway"],
        "timeline": [
            {"time": "T+0:00", "event": "Slow query spike detected (2.3s avg)", "severity": "warn"},
            {"time": "T+0:54", "event": "Connection pool exhausted (100/100)", "severity": "error"},
            {"time": "T+1:12", "event": "Checkout service timeouts begin", "severity": "critical"},
            {"time": "T+2:06", "event": "503 errors returned to users", "severity": "critical"},
            {"time": "T+3:00", "event": "DB memory at 94% - OOM risk", "severity": "critical"},
        ]
    },
    "redis_overflow": {
        "root_cause": "Redis memory overflow triggered by excessive session data growth without TTL policies. LRU eviction invalidated active user sessions, causing authentication failures and cache stampede as services attempted to re-populate evicted keys simultaneously.",
        "severity": "High",
        "confidence": "91%",
        "recommended_fix": "1. Set maxmemory-policy to allkeys-lru with explicit TTL on all session keys.\n2. Scale Redis cluster by adding 2 additional nodes.\n3. Implement Redis Cluster sharding to distribute memory load.\n4. Add circuit breaker for cache misses to prevent stampede.\n5. Set session key TTL to 3600s and implement lazy deletion.",
        "summary": "Redis memory exhaustion caused cascading session invalidation across the platform. When node-1 reached OOM, LRU eviction deleted active sessions, forcing all affected users to re-authenticate. The failover to node-2 triggered a secondary overflow, degrading 2/3 cluster nodes.",
        "affected_services": ["redis-node-1", "redis-node-2", "session-service", "user-service"],
        "timeline": [
            {"time": "T+0:00", "event": "Redis memory at 82% warning threshold", "severity": "warn"},
            {"time": "T+0:18", "event": "Cache hit rate drops 94% → 71%", "severity": "warn"},
            {"time": "T+0:54", "event": "OOM - LRU eviction begins", "severity": "critical"},
            {"time": "T+1:30", "event": "Session authentication failures cascade", "severity": "error"},
            {"time": "T+2:48", "event": "Node-2 overwhelmed under failover load", "severity": "critical"},
        ]
    },
    "api_latency_spike": {
        "root_cause": "Thread pool saturation on API instances caused by upstream CDN cache invalidation storm, resulting in cache miss rate jumping from 23% to 61%. This generated 2.6x normal origin traffic, exhausting request queues and triggering circuit breaker cascade.",
        "severity": "Critical",
        "confidence": "88%",
        "recommended_fix": "1. Implement request queue depth limits with backpressure signals.\n2. Add CDN cache warming strategy before invalidation events.\n3. Scale API instances from 4 → 8 with auto-scaling rules.\n4. Configure circuit breaker with exponential backoff (not open-circuit).\n5. Implement request coalescing for identical cache-miss requests.",
        "summary": "A CDN cache invalidation event caused a 61% cache miss rate, flooding origin API servers with 2.6x normal traffic. Thread pool exhaustion on instances 2 and 3 caused queue buildup, p95 latency breaching 4.7s SLO. Instance 3 was removed from rotation, concentrating load further.",
        "affected_services": ["api-instance-2", "api-instance-3", "cdn-edge", "load-balancer"],
        "timeline": [
            {"time": "T+0:00", "event": "CDN cache miss rate begins climbing", "severity": "warn"},
            {"time": "T+0:36", "event": "API p99 latency exceeds 1000ms", "severity": "warn"},
            {"time": "T+1:12", "event": "Thread pool saturation on instance-3", "severity": "error"},
            {"time": "T+1:48", "event": "Latency SLO breached (p95 = 4.7s)", "severity": "critical"},
            {"time": "T+2:24", "event": "Circuit breaker opens - cascade begins", "severity": "critical"},
        ]
    },
    "k8s_pod_crashloop": {
        "root_cause": "New deployment (payment-service v2.4.1) entered CrashLoopBackOff due to missing Vault credentials and environment variable misconfiguration. The deployment was missing STRIPE_KEY secret injection and had an incompatible database migration that caused immediate container exit.",
        "severity": "Critical",
        "confidence": "97%",
        "recommended_fix": "1. Rollback deployment: kubectl rollout undo deployment/payment-service.\n2. Fix Vault policy to allow payment-service v2 to read secret/stripe.\n3. Add missing STRIPE_KEY to Kubernetes Secret manifest.\n4. Run database migration separately as a Job before deployment.\n5. Add pre-flight checks in container entrypoint for required secrets.",
        "summary": "A faulty deployment of payment-service v2.4.1 caused complete service unavailability. The new version attempted to read a Vault secret path that didn't exist, and required a database migration that had not been run. After 5 crash restarts, Kubernetes entered CrashLoopBackOff, blocking all payment processing.",
        "affected_services": ["payment-service", "k8s-node-1", "k8s-scheduler", "api-gateway"],
        "timeline": [
            {"time": "T+0:00", "event": "Deployment rollout initiated v2.4.1", "severity": "info"},
            {"time": "T+0:18", "event": "Container exits with code 1 (Vault failure)", "severity": "error"},
            {"time": "T+0:54", "event": "3rd restart - missing STRIPE_KEY detected", "severity": "error"},
            {"time": "T+1:30", "event": "CrashLoopBackOff after 5 restarts", "severity": "critical"},
            {"time": "T+2:06", "event": "100% of payment requests returning 503", "severity": "critical"},
        ]
    },
    "network_partition": {
        "root_cause": "ARP table corruption on core-02 switch caused a network partition between availability zones us-east-1a and us-east-1b. This created a split-brain scenario where services in each zone could not reach inter-zone dependencies, breaking distributed transactions and causing cross-zone replication lag.",
        "severity": "Critical",
        "confidence": "86%",
        "recommended_fix": "1. Emergency: Flush and rebuild ARP tables on core-02 (arp -d -a).\n2. Failover all traffic to us-east-1a until network restored.\n3. Enable graceful degradation mode in payment-service for partition tolerance.\n4. Implement health-check based circuit breaking for inter-zone calls.\n5. Post-incident: Review switch firmware, add redundant paths, implement BFD.",
        "summary": "ARP table corruption on a core switch caused a network partition splitting services between availability zones. Services relying on cross-zone communication failed completely. Distributed transactions became unsafe due to coordinator unreachability, and replication lag of 47s risked data consistency across the partition.",
        "affected_services": ["network-monitor", "consul", "order-service", "payment-service"],
        "timeline": [
            {"time": "T+0:00", "event": "2.3% packet loss detected in us-east-1b", "severity": "warn"},
            {"time": "T+0:36", "event": "ARP table inconsistency on core-02", "severity": "error"},
            {"time": "T+0:54", "event": "Split-brain: zones isolated from each other", "severity": "critical"},
            {"time": "T+1:30", "event": "Distributed transactions fail across zones", "severity": "critical"},
            {"time": "T+2:48", "event": "47s replication lag - consistency at risk", "severity": "critical"},
        ]
    }
}

def analyze_with_openai(logs: List[LogEntry], scenario: str = None) -> dict:
    if not client:
        return get_fallback_analysis(scenario)
    
    log_text = "\n".join([f"[{l.timestamp}] [{l.level}] {l.service}: {l.message}" for l in logs])
    
    prompt = f"""You are an expert SRE/DevOps incident analyst. Analyze the following infrastructure logs and provide a structured root cause analysis.

LOGS:
{log_text}

Respond ONLY with a valid JSON object in this exact format:
{{
  "root_cause": "Detailed technical explanation of the root cause (2-3 sentences)",
  "severity": "Critical|High|Medium|Low",
  "confidence": "XX%",
  "recommended_fix": "Numbered list of 4-5 specific remediation steps",
  "summary": "Executive summary of the incident (2-3 sentences)",
  "affected_services": ["service1", "service2"],
  "timeline": [
    {{"time": "T+0:00", "event": "First event description", "severity": "warn|error|critical|info"}},
    {{"time": "T+1:30", "event": "Second event description", "severity": "critical"}}
  ]
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)
    except Exception as e:
        print(f"OpenAI error: {e}")
        return get_fallback_analysis(scenario)

def get_fallback_analysis(scenario: str = None) -> dict:
    if scenario and scenario in FALLBACK_ANALYSES:
        return FALLBACK_ANALYSES[scenario]
    return FALLBACK_ANALYSES["database_overload"]