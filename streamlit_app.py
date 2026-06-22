"""Streamlit entrypoint for AI Research Assistant.

This app reuses the backend RAG services directly so it can run on Streamlit
Community Cloud without the FastAPI or Next.js servers.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import streamlit as st


ROOT = Path(__file__).parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _load_streamlit_secrets() -> None:
    """Expose Streamlit secrets as environment variables before backend imports."""
    try:
        secrets = st.secrets
    except Exception:
        secrets = {}

    for key in (
        "GROQ_API_KEY",
        "GROQ_CHAT_MODEL",
        "GROQ_VISION_MODEL",
        "GITHUB_TOKEN",
        "UPLOAD_DIR",
        "LOG_LEVEL",
    ):
        if key in secrets:
            os.environ[key] = str(secrets[key])

    os.environ.setdefault("UPLOAD_DIR", str(ROOT / "uploads"))
    os.environ.setdefault("LOG_LEVEL", "INFO")


_load_streamlit_secrets()

from config import get_settings  # noqa: E402
from db.chroma import get_all_documents_metadata, get_collection, get_total_chunks  # noqa: E402
from db.stats_store import get_stats, increment_chunks, increment_documents, record_query  # noqa: E402
from routers.upload import ALLOWED_EXTENSIONS, _detect_doc_type  # noqa: E402
from services.chunking import chunk_text  # noqa: E402
from services.embedding import embed_texts  # noqa: E402
from services.ingestion import extract_text  # noqa: E402
from services.llm import parse_knowledge_cards, stream_answer, strip_knowledge_cards  # noqa: E402
from services.retrieval import hybrid_search  # noqa: E402


settings = get_settings()


st.set_page_config(
    page_title="AI Research Assistant",
    layout="wide",
)


async def _index_uploaded_file(uploaded_file) -> tuple[str, int, str]:
    suffix = Path(uploaded_file.name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValueError(f"Unsupported file type: {suffix}. Allowed: {allowed}")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{uuid.uuid4().hex}_{uploaded_file.name}"

    content = uploaded_file.getvalue()
    if len(content) > settings.max_file_size_mb * 1024 * 1024:
        raise ValueError(f"File too large. Max size: {settings.max_file_size_mb}MB")

    file_path.write_bytes(content)

    text = await extract_text(file_path, mime_type=uploaded_file.type)
    if not text.strip():
        raise ValueError("Could not extract text from file.")

    chunks = chunk_text(text, filename=uploaded_file.name)
    if not chunks:
        raise ValueError("No content chunks generated.")

    embeddings = await embed_texts(chunks)
    doc_type = _detect_doc_type(uploaded_file.name)

    collection = get_collection()
    now = datetime.now(timezone.utc).isoformat()
    collection.add(
        ids=[uuid.uuid4().hex for _ in chunks],
        documents=chunks,
        embeddings=embeddings,
        metadatas=[
            {
                "source": uploaded_file.name,
                "filename": uploaded_file.name,
                "doc_type": doc_type,
                "indexed_at": now,
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ],
    )

    increment_documents(1)
    increment_chunks(len(chunks))
    return uploaded_file.name, len(chunks), doc_type


async def _answer_question(question: str, placeholder) -> tuple[str, list, list[dict], float]:
    start = time.time()
    results = await hybrid_search(question=question)

    answer = ""
    async for token in stream_answer(question, results):
        answer += token
        placeholder.markdown(strip_knowledge_cards(answer) or answer)

    elapsed = (time.time() - start) * 1000
    record_query(elapsed)
    cards = parse_knowledge_cards(answer)
    clean_answer = strip_knowledge_cards(answer)
    return clean_answer, results, cards, round(elapsed, 1)


def _render_sources(results) -> None:
    seen = set()
    for result in results:
        if result.source in seen:
            continue
        seen.add(result.source)
        with st.expander(f"{result.source} · {result.confidence}%"):
            st.caption(result.doc_type)
            st.write(result.content[:800])


def _render_sidebar() -> None:
    st.sidebar.title("Engineering Hub")
    st.sidebar.caption("Streamlit deployment")

    if settings.groq_api_key:
        st.sidebar.success("Groq key configured")
    else:
        st.sidebar.error("Set GROQ_API_KEY in Streamlit secrets")

    st.sidebar.divider()
    st.sidebar.write("Backend-free Streamlit mode")
    st.sidebar.write("Chroma path:", str(ROOT / "vectorstore"))


def _chat_page() -> None:
    st.header("Chat")
    st.caption("Ask questions about your indexed engineering knowledge base.")

    if "messages" not in st.session_state:
        st.session_state.messages = []

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    question = st.chat_input("Ask a question")
    if not question:
        return

    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.markdown(question)

    with st.chat_message("assistant"):
        placeholder = st.empty()
        try:
            answer, results, cards, elapsed = asyncio.run(_answer_question(question, placeholder))
            placeholder.markdown(answer)
            st.caption(f"{elapsed} ms")

            if results:
                st.subheader("Sources")
                _render_sources(results)

            if cards:
                st.subheader("Knowledge Cards")
                cols = st.columns(min(4, len(cards)))
                for col, card in zip(cols, cards):
                    with col:
                        st.markdown(f"**{card.get('title', 'Card')}**")
                        st.caption(card.get("type", "concept"))
                        st.write(card.get("content", ""))

            st.session_state.messages.append({"role": "assistant", "content": answer})
        except Exception as exc:
            st.error(f"Error generating response: {exc}")


def _upload_page() -> None:
    st.header("Upload")
    st.caption("Index documents into the local Chroma knowledge base.")

    uploaded_files = st.file_uploader(
        "Choose files",
        accept_multiple_files=True,
        type=[ext.lstrip(".") for ext in sorted(ALLOWED_EXTENSIONS)],
    )

    if not uploaded_files:
        return

    if st.button("Index selected files", type="primary"):
        for uploaded_file in uploaded_files:
            with st.status(f"Indexing {uploaded_file.name}", expanded=True) as status:
                try:
                    filename, chunk_count, doc_type = asyncio.run(_index_uploaded_file(uploaded_file))
                    status.update(
                        label=f"Indexed {filename}: {chunk_count} chunks ({doc_type})",
                        state="complete",
                    )
                except Exception as exc:
                    status.update(label=f"Failed: {uploaded_file.name}", state="error")
                    st.error(str(exc))


def _sources_page() -> None:
    st.header("Sources")
    sources = get_all_documents_metadata()
    st.metric("Chunks stored", get_total_chunks())

    if not sources:
        st.info("No sources indexed yet.")
        return

    st.dataframe(
        [
            {
                "Filename": source.get("filename", ""),
                "Type": source.get("doc_type", "document"),
                "Indexed at": source.get("indexed_at", ""),
            }
            for source in sources
        ],
        use_container_width=True,
    )


def _stats_page() -> None:
    st.header("Dashboard")
    stats = get_stats()
    stats["chunks_stored"] = get_total_chunks()

    cols = st.columns(4)
    cols[0].metric("Documents", stats["documents_indexed"])
    cols[1].metric("Repositories", stats["repositories_indexed"])
    cols[2].metric("Chunks", stats["chunks_stored"])
    cols[3].metric("Queries", stats["total_queries"])
    st.metric("Average response time", f"{stats['avg_response_time_ms']} ms")


def main() -> None:
    _render_sidebar()

    page = st.sidebar.radio("Navigation", ["Chat", "Upload", "Sources", "Dashboard"])
    if page == "Chat":
        _chat_page()
    elif page == "Upload":
        _upload_page()
    elif page == "Sources":
        _sources_page()
    else:
        _stats_page()


if __name__ == "__main__":
    main()
