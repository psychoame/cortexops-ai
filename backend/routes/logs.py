from fastapi import APIRouter
from schemas.models import SimulateRequest
from services.log_generator import generate_logs

router = APIRouter()

@router.post("/simulate-logs")
def simulate_logs(request: SimulateRequest):
    result = generate_logs(request.scenario)
    return result

@router.get("/scenarios")
def get_scenarios():
    return {
        "scenarios": [
            {"id": "random", "name": "Random Failure", "icon": "⚡"},
            {"id": "database_overload", "name": "Database Overload", "icon": "🗄️"},
            {"id": "redis_overflow", "name": "Redis Memory Overflow", "icon": "💾"},
            {"id": "api_latency_spike", "name": "API Latency Spike", "icon": "📈"},
            {"id": "k8s_pod_crashloop", "name": "K8s CrashLoopBackOff", "icon": "☸️"},
            {"id": "network_partition", "name": "Network Partition", "icon": "🔌"},
        ]
    }