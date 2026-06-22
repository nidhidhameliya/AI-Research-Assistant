"""POST /compare â€” multi-document comparison."""
from __future__ import annotations

from collections import defaultdict
from pathlib import PurePath

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db.chroma import get_collection
from services.llm import get_answer_from_messages
from security import get_current_user

router = APIRouter()


class CompareRequest(BaseModel):
    documents: list[str]
    question: str


class CompareResponse(BaseModel):
    comparison: dict


def _matches_document(metadata: dict, requested: str) -> bool:
    filename = metadata.get("filename", "")
    source = metadata.get("source", "")
    requested_name = PurePath(requested).name.lower()
    return filename.lower().endswith(requested_name) or source.lower().endswith(requested_name) or source.lower().endswith(requested.lower())


def _label_for_document(document: str) -> str:
    stem = PurePath(document).stem
    cleaned = stem.replace("-", " ").replace("_", " ").strip()
    return cleaned.title() or document


@router.post("/compare", response_model=CompareResponse)
async def compare_documents(request: CompareRequest, _user=Depends(get_current_user)) -> CompareResponse:
    if len(request.documents) < 2:
        raise HTTPException(status_code=400, detail="At least two documents are required")

    collection = get_collection()
    data = collection.get(include=["documents", "metadatas"], limit=1000)
    documents = data.get("documents") or []
    metadatas = data.get("metadatas") or []

    grouped: dict[str, list[str]] = defaultdict(list)
    for chunk, meta in zip(documents, metadatas):
        for requested in request.documents:
            if _matches_document(meta or {}, requested):
                grouped[requested].append(chunk)

    if len(grouped) < 2:
        raise HTTPException(status_code=404, detail="Could not find enough matching documents to compare")

    context_parts = []
    labeled_docs = [_label_for_document(doc) for doc in request.documents]
    for original, label in zip(request.documents, labeled_docs):
        chunks = grouped.get(original, [])[:5]
        if chunks:
            context_parts.append(f"Document: {label}\n" + "\n\n".join(chunks))

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert comparison assistant. Compare the provided documents "
                "using clear sections for each document and a concise summary."
            ),
        },
        {
            "role": "user",
            "content": f"Question: {request.question}\n\nDocuments:\n\n" + "\n\n---\n\n".join(context_parts),
        },
    ]

    answer = await get_answer_from_messages(messages)

    return CompareResponse(
        comparison={
            label: "\n".join(grouped.get(original, [])[:3])[:2000]
            for original, label in zip(request.documents, labeled_docs)
        } | {"Summary": answer},
    )
