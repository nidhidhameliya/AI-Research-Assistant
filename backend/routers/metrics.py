"""GET /metrics â€” observability metrics from SQLite."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from db.metrics_store import get_metrics_summary
from security import get_current_user

router = APIRouter()


class MetricsResponse(BaseModel):
    total_queries: int
    average_response_time_ms: float
    average_retrieval_count: float
    average_retrieval_latency_ms: float
    average_llm_latency_ms: float
    average_token_usage: float
    citation_count: int
    error_count: int
    top_documents: list[dict]
    top_questions: list[dict]
    recent_metrics: list[dict]


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics(user=Depends(get_current_user)) -> MetricsResponse:
    summary = get_metrics_summary(user_id=user["id"] if user else None)
    return MetricsResponse(**summary)
