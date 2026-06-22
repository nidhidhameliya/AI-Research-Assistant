"""Chat endpoints with persistent history and multi-turn memory."""
from __future__ import annotations

import json
import time
from typing import AsyncIterator, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from db.chat_store import (
    append_message,
    create_chat,
    delete_chat,
    generate_chat_title,
    get_chat,
    get_recent_messages,
    list_chats,
    update_chat_title,
)
from db.metrics_store import record_metric
from db.stats_store import record_query
from security import get_current_user
from services.llm import get_answer, parse_knowledge_cards, stream_answer, strip_knowledge_cards
from services.retrieval import RetrievalResult, hybrid_search

logger = structlog.get_logger()
router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    chat_id: Optional[str] = None
    stream: bool = True
    filter_doc_type: Optional[str] = None


class Source(BaseModel):
    filename: str
    doc_type: str
    confidence: int
    content_preview: str


class ChatResponse(BaseModel):
    chat_id: str
    answer: str
    sources: list[Source]
    knowledge_cards: list[dict]
    response_time_ms: float


class ChatSummary(BaseModel):
    id: str
    title: str
    updated_at: str


class MessageItem(BaseModel):
    role: str
    content: str
    created_at: str


class ChatDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: list[MessageItem]


class NewChatRequest(BaseModel):
    title: Optional[str] = None
    first_question: Optional[str] = None


class NewChatResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


def _format_sources(results: list[RetrievalResult]) -> list[Source]:
    seen = set()
    sources = []
    for r in results:
        key = r.source
        if key not in seen:
            seen.add(key)
            sources.append(
                Source(
                    filename=r.source,
                    doc_type=r.doc_type,
                    confidence=r.confidence,
                    content_preview=r.content[:200].strip() + "..." if len(r.content) > 200 else r.content,
                )
            )
    return sources


def _top_document(results: list[RetrievalResult]) -> Optional[str]:
    return results[0].source if results else None


@router.post("/chat/new", response_model=NewChatResponse)
async def new_chat(request: NewChatRequest, user=Depends(get_current_user)) -> NewChatResponse:
    title = request.title or (generate_chat_title(request.first_question) if request.first_question else "New Chat")
    chat = create_chat(user_id=user["id"] if user else None, title=title)
    return NewChatResponse(**{k: chat[k] for k in ["id", "title", "created_at", "updated_at"]})


@router.get("/chats", response_model=list[ChatSummary])
async def get_chats(user=Depends(get_current_user)) -> list[ChatSummary]:
    chats = list_chats(user_id=user["id"] if user else None)
    return [ChatSummary(**chat) for chat in chats]


@router.get("/chat/{chat_id}", response_model=ChatDetail)
async def get_chat_detail(chat_id: str, user=Depends(get_current_user)) -> ChatDetail:
    chat = get_chat(chat_id, user_id=user["id"] if user else None)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return ChatDetail(
        id=chat["id"],
        title=chat["title"],
        created_at=chat["created_at"],
        updated_at=chat["updated_at"],
        messages=[MessageItem(**message) for message in chat["messages"]],
    )


@router.delete("/chat/{chat_id}")
async def remove_chat(chat_id: str, user=Depends(get_current_user)) -> dict:
    if not delete_chat(chat_id, user_id=user["id"] if user else None):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"ok": True}


@router.post("/chat")
async def chat(request: ChatRequest, user=Depends(get_current_user)):
    """Answer a question using RAG with optional SSE streaming."""
    if not request.question.strip():
        return {"error": "Question cannot be empty"}

    start = time.time()

    chat_id = request.chat_id
    is_new_chat = False
    if not chat_id:
        chat = create_chat(user_id=user["id"] if user else None, title=generate_chat_title(request.question))
        chat_id = chat["id"]
        is_new_chat = True
    else:
        chat = get_chat(chat_id, user_id=user["id"] if user else None)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

    history = get_recent_messages(chat_id, limit=10)
    append_message(chat_id, "user", request.question)
    if is_new_chat:
        update_chat_title(chat_id, generate_chat_title(request.question))

    retrieval_started = time.time()
    results = await hybrid_search(
        question=request.question,
        filter_doc_type=request.filter_doc_type,
    )
    retrieval_latency_ms = (time.time() - retrieval_started) * 1000
    sources = _format_sources(results)

    if request.stream:
        return StreamingResponse(
            _stream_response(
                chat_id=chat_id,
                question=request.question,
                results=results,
                sources=sources,
                history=history,
                user_id=user["id"] if user else None,
                start=start,
                retrieval_latency_ms=retrieval_latency_ms,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    llm_started = time.time()
    full_answer = await get_answer(request.question, results, history=history)
    llm_latency_ms = (time.time() - llm_started) * 1000
    elapsed = (time.time() - start) * 1000
    cards = parse_knowledge_cards(full_answer)
    clean_answer = strip_knowledge_cards(full_answer)
    append_message(chat_id, "assistant", clean_answer)
    record_query(elapsed)
    record_metric(
        question=request.question,
        query_latency_ms=elapsed,
        retrieval_latency_ms=retrieval_latency_ms,
        llm_latency_ms=llm_latency_ms,
        token_usage=len(clean_answer.split()),
        retrieved_chunks=len(results),
        citation_count=len(sources),
        top_document=_top_document(results),
        user_id=user["id"] if user else None,
        chat_id=chat_id,
    )

    return ChatResponse(
        chat_id=chat_id,
        answer=clean_answer,
        sources=sources,
        knowledge_cards=cards,
        response_time_ms=round(elapsed, 1),
    )


async def _stream_response(
    *,
    chat_id: str,
    question: str,
    results: list[RetrievalResult],
    sources: list[Source],
    history: list[dict],
    user_id: Optional[str],
    start: float,
    retrieval_latency_ms: float,
) -> AsyncIterator[str]:
    """SSE event generator for streaming responses."""
    yield f"data: {json.dumps({'type': 'chat', 'chat_id': chat_id})}\n\n"

    sources_payload = json.dumps({
        "type": "sources",
        "sources": [s.model_dump() for s in sources],
    })
    yield f"data: {sources_payload}\n\n"

    full_answer = ""
    llm_started = time.time()
    async for token in stream_answer(question, results, history=history):
        full_answer += token
        token_payload = json.dumps({"type": "token", "content": token})
        yield f"data: {token_payload}\n\n"

    llm_latency_ms = (time.time() - llm_started) * 1000
    cards = parse_knowledge_cards(full_answer)
    elapsed = (time.time() - start) * 1000
    clean_answer = strip_knowledge_cards(full_answer)
    append_message(chat_id, "assistant", clean_answer)
    record_query(elapsed)
    record_metric(
        question=question,
        query_latency_ms=elapsed,
        retrieval_latency_ms=retrieval_latency_ms,
        llm_latency_ms=llm_latency_ms,
        token_usage=len(clean_answer.split()),
        retrieved_chunks=len(results),
        citation_count=len(sources),
        top_document=_top_document(results),
        user_id=user_id,
        chat_id=chat_id,
    )

    done_payload = json.dumps({
        "type": "done",
        "knowledge_cards": cards,
        "response_time_ms": round(elapsed, 1),
    })
    yield f"data: {done_payload}\n\n"
    yield "data: [DONE]\n\n"
