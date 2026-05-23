from pydantic import BaseModel
from typing import List, Optional

class LogEntry(BaseModel):
    timestamp: str
    level: str
    service: str
    message: str

class SimulateRequest(BaseModel):
    scenario: str = "random"

class SimulateResponse(BaseModel):
    logs: List[LogEntry]
    metrics: dict
    scenario: str

class AnalyzeRequest(BaseModel):
    logs: List[LogEntry]
    scenario: Optional[str] = None

class AnalysisResponse(BaseModel):
    root_cause: str
    severity: str
    confidence: str
    recommended_fix: str
    summary: str
    affected_services: List[str]
    timeline: List[dict]