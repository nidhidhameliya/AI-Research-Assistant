from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    # App
    app_name: str = Field(default="AI Research Assistant", env="APP_NAME")

    # Groq LLM
    groq_api_key: str = Field(default="", env="GROQ_API_KEY")
    groq_chat_model: str = "llama-3.3-70b-versatile"
    groq_vision_model: str = Field(
        default="meta-llama/llama-4-scout-17b-16e-instruct",
        env="GROQ_VISION_MODEL",
    )

    # ChromaDB
    chroma_host: str = Field(default="localhost", env="CHROMA_HOST")
    chroma_port: int = Field(default=8000, env="CHROMA_PORT")
    chroma_collection: str = "engineer_hub"

    # Upload
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    max_file_size_mb: int = 50

    # GitHub
    github_token: str = Field(default="", env="GITHUB_TOKEN")

    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval
    top_k_vector: int = 10
    top_k_final: int = 5
    mmr_diversity: float = 0.3

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # Local persistence
    app_db_path: str = Field(default="./vectorstore/app.db", env="APP_DB_PATH")
    jwt_secret_key: str = Field(default="change-me-in-production", env="JWT_SECRET_KEY")
    jwt_algorithm: str = "HS256"

    model_config = ConfigDict(
        # Load both backend/.env and root .env (later files take precedence)
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra environment variables not defined in this class
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
