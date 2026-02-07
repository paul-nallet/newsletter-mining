from __future__ import annotations

import openai

from newsletter_mining.config import require_openai_key

MODEL = "text-embedding-3-small"


def generate_embedding(text: str) -> list[float]:
    """Generate an embedding vector for a single text using OpenAI."""
    api_key = require_openai_key()
    client = openai.OpenAI(api_key=api_key)

    response = client.embeddings.create(
        model=MODEL,
        input=text,
    )

    return response.data[0].embedding


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embedding vectors for a batch of texts using OpenAI."""
    if not texts:
        return []

    api_key = require_openai_key()
    client = openai.OpenAI(api_key=api_key)

    # OpenAI supports up to 2048 inputs per batch
    response = client.embeddings.create(
        model=MODEL,
        input=texts,
    )

    # Sort by index to preserve input order
    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [item.embedding for item in sorted_data]
