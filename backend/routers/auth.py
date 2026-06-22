"""Authentication endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from db.auth_store import authenticate_user, create_user, get_user_by_email
from security import create_access_token, get_current_user
router = APIRouter()


class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/auth/register", response_model=AuthResponse)
async def register(request: AuthRequest) -> AuthResponse:
    if get_user_by_email(request.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = create_user(request.email, request.password)
    token = create_access_token(user["id"], user["email"])
    return AuthResponse(access_token=token, user=user)


@router.post("/auth/login", response_model=AuthResponse)
async def login(request: AuthRequest) -> AuthResponse:
    user = authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    return AuthResponse(access_token=token, user=user)


@router.post("/auth/logout")
async def logout() -> dict:
    return {"ok": True}


@router.get("/auth/me")
async def me(user=Depends(get_current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user
