"""SQLite-backed observability metrics."""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Optional

from db.sqlite import get_connection


def record_metric(
    *,
    question: str,
    query_latency_ms: float,
    retrieval_latency_ms: float,
    llm_latency_ms: float,
    token_usage: int,
    retrieved_chunks: int,
    citation_count: int,
    top_document: Optional[str] = None,
    error: Optional[str] = None,
    user_id: Optional[str] = None,
    chat_id: Optional[str] = None,
) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO metrics (
                user_id, chat_id, question, query_latency_ms, retrieval_latency_ms,
                llm_latency_ms, token_usage, retrieved_chunks, citation_count,
                top_document, error, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                chat_id,
                question,
                query_latency_ms,
                retrieval_latency_ms,
                llm_latency_ms,
                token_usage,
                retrieved_chunks,
                citation_count,
                top_document,
                error,
                datetime.now(timezone.utc).isoformat(),
            ),
        )


def _fetch_metrics(user_id: Optional[str] = None) -> list[dict]:
    query = "SELECT * FROM metrics"
    params: tuple = ()
    if user_id is not None:
        query += " WHERE user_id = ?"
        params = (user_id,)
    query += " ORDER BY id DESC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    return [dict(row) for row in rows]


def get_metrics_summary(user_id: Optional[str] = None) -> dict:
    rows = _fetch_metrics(user_id)
    total = len(rows)
    if total == 0:
        return {
            "total_queries": 0,
            "average_response_time_ms": 0.0,
            "average_retrieval_count": 0.0,
            "average_retrieval_latency_ms": 0.0,
            "average_llm_latency_ms": 0.0,
            "average_token_usage": 0.0,
            "citation_count": 0,
            "error_count": 0,
            "top_documents": [],
            "top_questions": [],
            "recent_metrics": [],
        }

    top_documents = Counter(
        row["top_document"] for row in rows if row.get("top_document")
    ).most_common(5)
    top_questions = Counter(row["question"] for row in rows).most_common(5)

    return {
        "total_queries": total,
        "average_response_time_ms": round(sum(row["query_latency_ms"] for row in rows) / total, 1),
        "average_retrieval_count": round(sum(row["retrieved_chunks"] for row in rows) / total, 1),
        "average_retrieval_latency_ms": round(sum(row["retrieval_latency_ms"] for row in rows) / total, 1),
        "average_llm_latency_ms": round(sum(row["llm_latency_ms"] for row in rows) / total, 1),
        "average_token_usage": round(sum(row["token_usage"] for row in rows) / total, 1),
        "citation_count": int(sum(row["citation_count"] for row in rows)),
        "error_count": sum(1 for row in rows if row.get("error")),
        "top_documents": [
            {"name": name, "count": count} for name, count in top_documents
        ],
        "top_questions": [
            {"question": question, "count": count} for question, count in top_questions
        ],
        "recent_metrics": rows[:20],
    }
