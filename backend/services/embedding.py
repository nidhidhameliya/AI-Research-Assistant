"""Local embedding service using Chroma's built-in all-MiniLM-L6-v2."""
import asyncio
from typing import List
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
import structlog

import shutil
from pathlib import Path

logger = structlog.get_logger()

_embedding_fn = None


def _clear_chroma_cache():
    cache_dir = Path.home() / ".cache" / "chroma"
    if cache_dir.exists():
        try:
            logger.warning("Clearing corrupted Chroma cache directory...", path=str(cache_dir))
            shutil.rmtree(cache_dir)
            logger.info("Chroma cache directory cleared successfully.")
        except Exception as e:
            logger.error("Failed to clear Chroma cache directory", error=str(e))


def _get_embedding_fn() -> DefaultEmbeddingFunction:
    global _embedding_fn
    if _embedding_fn is None:
        logger.info("Initializing Chroma DefaultEmbeddingFunction (all-MiniLM-L6-v2)...")
        _embedding_fn = DefaultEmbeddingFunction()
    return _embedding_fn


async def embed_texts(texts: List[str], batch_size: int = 100) -> List[List[float]]:
    """Generate embeddings for a list of texts with batching using local model."""
    if not texts:
        return []

    embedding_fn = _get_embedding_fn()
    all_embeddings: List[List[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        # Clean texts
        batch = [t.replace("\n", " ").strip() for t in batch if t.strip()]
        if not batch:
            continue

        try:
            # Run the local embedding function in a thread to keep FastAPI non-blocking
            batch_embeddings = await asyncio.to_thread(
                embedding_fn,
                batch
            )
            all_embeddings.extend(batch_embeddings)
            logger.info(
                "Embedded batch locally",
                batch_num=i // batch_size + 1,
                count=len(batch),
            )
        except Exception as e:
            err_str = str(e)
            logger.error("Local embedding failed", error=err_str, batch_start=i)
            
            # Check for corrupted model cache
            if "INVALID_PROTOBUF" in err_str or "Protobuf parsing failed" in err_str or "onnx" in err_str.lower():
                logger.warning("Corrupted ONNX model detected. Clearing cache and retrying...")
                _clear_chroma_cache()
                global _embedding_fn
                _embedding_fn = None  # Reset function
                embedding_fn = _get_embedding_fn()
                
                try:
                    batch_embeddings = await asyncio.to_thread(
                        embedding_fn,
                        batch
                    )
                    all_embeddings.extend(batch_embeddings)
                    logger.info("Embedded batch successfully after model redownload.")
                    continue
                except Exception as retry_err:
                    logger.error("Retry after clearing cache failed", error=str(retry_err))
                    raise retry_err
            raise

    return all_embeddings


async def embed_query(text: str) -> List[float]:
    """Embed a single query string locally."""
    embedding_fn = _get_embedding_fn()
    try:
        # Run in a thread
        embeddings = await asyncio.to_thread(
            embedding_fn,
            [text]
        )
        return embeddings[0]
    except Exception as e:
        err_str = str(e)
        logger.error("Local query embedding failed", error=err_str)
        
        # Check for corrupted model cache
        if "INVALID_PROTOBUF" in err_str or "Protobuf parsing failed" in err_str or "onnx" in err_str.lower():
            logger.warning("Corrupted ONNX model detected during query embedding. Clearing cache and retrying...")
            _clear_chroma_cache()
            global _embedding_fn
            _embedding_fn = None
            embedding_fn = _get_embedding_fn()
            
            try:
                embeddings = await asyncio.to_thread(
                    embedding_fn,
                    [text]
                )
                return embeddings[0]
            except Exception as retry_err:
                logger.error("Retry query embedding after clearing cache failed", error=str(retry_err))
                raise retry_err
        raise ValueError(f"Failed to generate query embedding: {e}")
