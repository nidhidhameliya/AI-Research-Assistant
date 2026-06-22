"""Groq streaming LLM service with knowledge card extraction."""
import asyncio
import json
import re
from typing import AsyncIterator, List, Optional
from groq import Groq
from services.retrieval import RetrievalResult
from config import get_settings
import structlog

logger = structlog.get_logger()
settings = get_settings()

# Lazy Groq client — initialized on first use so .env is fully loaded
_groq_client: Groq | None = None


def _get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=get_settings().groq_api_key)
    return _groq_client


SYSTEM_PROMPT = """You are an Engineering Intelligence Assistant for a software engineering team.
You answer questions based ONLY on the provided knowledge base context.
You are precise, technical, and helpful.

Rules:
1. Answer based ONLY on the provided context. If the context doesn't contain the answer, say so clearly.
2. Always cite your sources using the [SOURCE: filename] format inline.
3. Structure your response with clear headings when answering complex questions.
4. For technical topics, include code examples when relevant from the context.
5. Be concise but complete. Prefer bullet points for lists of items.
6. At the end of your answer, output a JSON block in this exact format:
   ```knowledge_cards
   [
     {"title": "Card Title", "content": "Brief description", "type": "service|flow|concept|alert"},
     ...
   ]
   ```
   Include 2-4 relevant knowledge cards that highlight key concepts from your answer.
   Only output the knowledge_cards block — no other JSON.
"""


def _build_context(results: List[RetrievalResult]) -> str:
    """Format retrieved chunks into a context string."""
    if not results:
        return "No relevant documentation found in the knowledge base."

    context_parts = []
    for i, result in enumerate(results, 1):
        context_parts.append(
            f"[DOCUMENT {i}] Source: {result.source}\n"
            f"Confidence: {result.confidence}%\n"
            f"---\n{result.content}"
        )
    return "\n\n".join(context_parts)


def _build_messages(
    question: str,
    results: List[RetrievalResult],
    history: Optional[List[dict]] = None,
    system_prompt: str = SYSTEM_PROMPT,
) -> list[dict]:
    context = _build_context(results)
    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if history:
        for message in history[-10:]:
            role = message.get("role")
            content = message.get("content", "")
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})

    messages.append(
        {
            "role": "user",
            "content": f"""Question: {question}

Knowledge Base Context:
{context}

Answer the question based on the context above. Include inline citations like [SOURCE: filename].
""",
        }
    )
    return messages


async def stream_completion(messages: List[dict]) -> AsyncIterator[str]:
    try:
        response = await asyncio.to_thread(
            _get_groq_client().chat.completions.create,
            model=get_settings().groq_chat_model,
            messages=messages,
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )

        for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        logger.error("LLM streaming failed", error=str(e))
        yield f"\n\nError generating response: {str(e)}"


async def stream_answer(
    question: str,
    results: List[RetrievalResult],
    history: Optional[List[dict]] = None,
    system_prompt: str = SYSTEM_PROMPT,
) -> AsyncIterator[str]:
    """Stream Groq response with context from retrieved documents."""
    messages = _build_messages(question, results, history=history, system_prompt=system_prompt)
    async for chunk in stream_completion(messages):
        yield chunk


async def get_answer_from_messages(messages: List[dict]) -> str:
    full_response = ""
    async for chunk in stream_completion(messages):
        full_response += chunk
    return full_response


async def get_answer(
    question: str,
    results: List[RetrievalResult],
    history: Optional[List[dict]] = None,
) -> str:
    """Non-streaming answer for internal use."""
    full_response = ""
    async for chunk in stream_answer(question, results, history=history):
        full_response += chunk
    return full_response


def parse_knowledge_cards(answer: str) -> list[dict]:
    """Extract knowledge cards JSON from the answer text."""
    pattern = r"```knowledge_cards\s*([\s\S]*?)```"
    match = re.search(pattern, answer)
    if not match:
        return []
    try:
        cards = json.loads(match.group(1).strip())
        if isinstance(cards, list):
            return cards[:4]
    except json.JSONDecodeError:
        pass
    return []


def strip_knowledge_cards(answer: str) -> str:
    """Remove the knowledge_cards JSON block from the answer text."""
    pattern = r"\n?```knowledge_cards\s*[\s\S]*?```\n?"
    return re.sub(pattern, "", answer).strip()
