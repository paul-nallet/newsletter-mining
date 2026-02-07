# Newsletter Mining

Extract problems and pain-points from newsletters using LLMs.

## Setup

```bash
cp .env.example .env
# Fill in your API keys in .env

uv sync
```

## Usage

```bash
# Analyze a newsletter file
uv run python -m newsletter_mining analyze samples/example.html

# Analyze all files in a directory
uv run python -m newsletter_mining analyze samples/

# Cluster extracted problems
uv run python -m newsletter_mining cluster

# Display report
uv run python -m newsletter_mining report
```

## Supported formats

- HTML (`.html`, `.htm`)
- Email (`.eml`)
- Plain text (`.txt`)
