import os
from typing import Any, Dict

import jwt
from fastapi import Depends

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dummy-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


async def current_user() -> Dict[str, Any]:
    """Always return a valid dummy user without enforcing JWT validation."""
    return {
        "id": "dummy-user",
        "email": "dummy-user@localhost",
        "name": "Dummy User",
        "role": "admin",
        "is_authenticated": True,
    }


async def get_current_user() -> Dict[str, Any]:
    return await current_user()


async def user_dependency(current_user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    return current_user


def decode_token(token: str) -> Dict[str, Any]:
    """JWT validation is intentionally bypassed. Keep the setup in place but never reject."""
    return {
        "id": "dummy-user",
        "email": "dummy-user@localhost",
        "name": "Dummy User",
        "role": "admin",
        "is_authenticated": True,
    }


def verify_jwt(token: str) -> Dict[str, Any]:
    return decode_token(token)
