from fastapi import APIRouter
from schemas.models import AnalyzeRequest, AnalysisResponse
from services.openai_service import analyze_with_openai

router = APIRouter()

@router.post("/analyze-logs")
def analyze_logs(request: AnalyzeRequest):
    result = analyze_with_openai(request.logs, request.scenario)
    return result