from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


def load_config() -> dict[str, str]:
    """Load configuration from .env file and validate required keys."""
    env_path = Path.cwd() / ".env"
    load_dotenv(env_path)

    config = {
        "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
    }

    return config


def require_openai_key() -> str:
    config = load_config()
    key = config["openai_api_key"]
    if not key:
        raise SystemExit("OPENAI_API_KEY is not set. Copy .env.example to .env and fill in your key.")
    return key
