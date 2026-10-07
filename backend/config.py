from pathlib import Path
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent


def _resolve_path(value: str) -> str:
    path = Path(value)
    if not path.is_absolute():
        path = (_PROJECT_ROOT / path).resolve()
    return str(path)


class Settings(BaseSettings):
    groq_api_key: str = Field(default="")
    llm_chat_model: str = Field(default="llama-3.3-70b-versatile")
    llm_base_url: str = Field(default="https://api.groq.com/openai/v1")

    chroma_collection: str = "engineer_hub"
    chroma_persist_dir: str = Field(default=str(_PROJECT_ROOT / "vectorstore"))

    upload_dir: str = Field(default=str(_BACKEND_DIR / "uploads"))
    max_file_size_mb: int = 50

    github_token: str = Field(default="")

    chunk_size: int = 1000
    chunk_overlap: int = 200

    top_k_vector: int = 10
    top_k_final: int = 7
    mmr_diversity: float = 0.3

    log_level: str = Field(default="INFO")

    api_key: str = Field(default="")
    cors_origins: str = Field(default="http://localhost:3000")

    okf_enabled: bool = Field(default=True)
    okf_knowledge_dir: str = Field(default=str(_PROJECT_ROOT / "knowledge"))
    okf_trust_boost: float = Field(default=1.2)
    okf_min_score: float = Field(default=0.25)
    okf_auto_create_on_upload: bool = Field(default=True)

    multi_query_enabled: bool = Field(default=True)
    multi_query_count: int = Field(default=3)
    crag_enabled: bool = Field(default=True)
    self_rag_critique: bool = Field(default=True)
    web_search_fallback: bool = Field(default=False)

    model_config = SettingsConfigDict(
        env_file=(_PROJECT_ROOT / ".env", _BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("chroma_persist_dir", "upload_dir", "okf_knowledge_dir", mode="before")
    @classmethod
    def resolve_relative_paths(cls, value: str) -> str:
        return _resolve_path(value)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
