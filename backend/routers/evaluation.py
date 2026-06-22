"""GET /evaluation â€” retrieval and chat quality summary."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from db.metrics_store import get_metrics_summary
from security import get_current_user

router = APIRouter()


class EvaluationResponse(BaseModel):
    total_queries: int
    average_response_time_ms: float
    average_retrieval_count: float
    citation_count: int
    top_documents: list[dict]
    top_questions: list[dict]


@router.get("/evaluation", response_model=EvaluationResponse)
async def get_evaluation(user=Depends(get_current_user)) -> EvaluationResponse:
    summary = get_metrics_summary(user_id=user["id"] if user else None)
    return EvaluationResponse(
        total_queries=summary["total_queries"],
        average_response_time_ms=summary["average_response_time_ms"],
        average_retrieval_count=summary["average_retrieval_count"],
        citation_count=summary["citation_count"],
        top_documents=summary["top_documents"],
        top_questions=summary["top_questions"],
    )
