"""User persistence for JWT auth."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from db.sqlite import get_connection

PBKDF2_ITERATIONS = 120_000


def _hash_password(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        PBKDF2_ITERATIONS,
    )
    return digest.hex()


def create_user(email: str, password: str) -> dict:
    user_id = uuid4().hex
    salt = secrets.token_hex(16)
    password_hash = f"{salt}:{_hash_password(password, salt)}"
    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        conn.execute(
            "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (user_id, email.lower().strip(), password_hash, created_at),
        )

    return get_user_by_id(user_id) or {}


def authenticate_user(email: str, password: str) -> Optional[dict]:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email.lower().strip(),),
        ).fetchone()

    if not row:
        return None

    try:
        salt, stored_hash = row["password_hash"].split(":", 1)
    except ValueError:
        return None

    if _hash_password(password, salt) != stored_hash:
        return None

    return _row_to_user(row)


def get_user_by_id(user_id: str) -> Optional[dict]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _row_to_user(row) if row else None


def get_user_by_email(email: str) -> Optional[dict]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    return _row_to_user(row) if row else None


def _row_to_user(row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "created_at": row["created_at"],
    }
