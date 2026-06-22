"""Persistent chat history storage."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from db.sqlite import get_connection


def generate_chat_title(question: str) -> str:
    cleaned = " ".join(question.strip().replace("?", "").replace("!", "").split())
    if not cleaned:
        return "New Chat"

    lowered = cleaned.lower()
    prefixes = [
        "how does ",
        "how do ",
        "explain ",
        "what is ",
        "what are ",
        "where is ",
        "where are ",
        "compare ",
    ]
    for prefix in prefixes:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix) :]
            break

    words = [w for w in cleaned.split() if w.lower() not in {"the", "a", "an", "of", "to", "for", "and", "in"}]
    title = " ".join(words[:4]).strip().title()
    return title or "New Chat"


def create_chat(user_id: Optional[str] = None, title: Optional[str] = None) -> dict:
    chat_id = uuid4().hex
    now = datetime.now(timezone.utc).isoformat()
    chat_title = title or "New Chat"

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO chats (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (chat_id, user_id, chat_title, now, now),
        )

    return get_chat(chat_id, user_id=user_id) or {
        "id": chat_id,
        "title": chat_title,
        "messages": [],
        "created_at": now,
        "updated_at": now,
        "user_id": user_id,
    }


def list_chats(user_id: Optional[str] = None) -> list[dict]:
    query = "SELECT id, title, updated_at FROM chats"
    params: tuple = ()
    if user_id is not None:
        query += " WHERE user_id = ?"
        params = (user_id,)
    query += " ORDER BY datetime(updated_at) DESC"

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "updated_at": row["updated_at"],
        }
        for row in rows
    ]


def get_chat(chat_id: str, user_id: Optional[str] = None) -> Optional[dict]:
    with get_connection() as conn:
        chat_row = conn.execute(
            "SELECT * FROM chats WHERE id = ?",
            (chat_id,),
        ).fetchone()

        if not chat_row:
            return None

        if user_id is not None and chat_row["user_id"] != user_id:
            return None

        message_rows = conn.execute(
            """
            SELECT role, content, created_at
            FROM messages
            WHERE chat_id = ?
            ORDER BY id ASC
            """,
            (chat_id,),
        ).fetchall()

    return {
        "id": chat_row["id"],
        "user_id": chat_row["user_id"],
        "title": chat_row["title"],
        "created_at": chat_row["created_at"],
        "updated_at": chat_row["updated_at"],
        "messages": [
            {
                "role": row["role"],
                "content": row["content"],
                "created_at": row["created_at"],
            }
            for row in message_rows
        ],
    }


def append_message(chat_id: str, role: str, content: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            (chat_id, role, content, now),
        )
        conn.execute(
            "UPDATE chats SET updated_at = ? WHERE id = ?",
            (now, chat_id),
        )


def update_chat_title(chat_id: str, title: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            "UPDATE chats SET title = ?, updated_at = ? WHERE id = ?",
            (title, now, chat_id),
        )


def delete_chat(chat_id: str, user_id: Optional[str] = None) -> bool:
    with get_connection() as conn:
        if user_id is not None:
            row = conn.execute("SELECT user_id FROM chats WHERE id = ?", (chat_id,)).fetchone()
            if not row or row["user_id"] != user_id:
                return False

        cur = conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        conn.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
        return cur.rowcount > 0


def get_recent_messages(chat_id: str, limit: int = 10) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT role, content, created_at
            FROM messages
            WHERE chat_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (chat_id, limit),
        ).fetchall()

    return [
        {"role": row["role"], "content": row["content"], "created_at": row["created_at"]}
        for row in reversed(rows)
    ]
