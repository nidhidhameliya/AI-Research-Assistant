"""AI Research Assistant - FastAPI Application Entry Point."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import get_settings
from db.sqlite import init_db
from routers import auth, chat, compare, evaluation, github, metrics, sources, stats, upload

structlog.configure(
    wrapper_class=structlog.make_filtering_bound_logger(
        logging.getLevelName(os.getenv("LOG_LEVEL", "INFO"))
    ),
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    settings = get_settings()

    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs("./vectorstore", exist_ok=True)
    init_db()

    logger.info("AI Research Assistant starting", model=settings.groq_chat_model, chroma_host=settings.chroma_host)

    try:
        from db.chroma import get_chroma_client, get_collection

        client = get_chroma_client()
        client.heartbeat()
        collection = get_collection()
        count = collection.count()
        logger.info("ChromaDB connected", chunks=count)
    except Exception as e:
        logger.error("ChromaDB connection failed - will retry on first request", error=str(e))

    yield

    logger.info("AI Research Assistant shutting down")


settings = get_settings()

app = FastAPI(
    title="AI Research Assistant",
    description="End-to-end Retrieval-Augmented Generation platform with persistent memory and cited answers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(upload.router, tags=["Ingestion"])
app.include_router(github.router, tags=["Ingestion"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(sources.router, tags=["Knowledge Base"])
app.include_router(stats.router, tags=["Admin"])
app.include_router(auth.router, tags=["Auth"])
app.include_router(compare.router, tags=["Compare"])
app.include_router(evaluation.router, tags=["Evaluation"])
app.include_router(metrics.router, tags=["Observability"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    try:
        from db.chroma import get_chroma_client

        client = get_chroma_client()
        client.heartbeat()
        chroma_status = "ok"
    except Exception as e:
        chroma_status = f"error: {str(e)[:50]}"

    return {
        "status": "ok",
        "service": settings.app_name,
        "chromadb": chroma_status,
    }
