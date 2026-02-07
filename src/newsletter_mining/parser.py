from __future__ import annotations

import email
from email import policy
from pathlib import Path

from bs4 import BeautifulSoup

from newsletter_mining.models import ParsedNewsletter


def parse_file(path: str | Path) -> ParsedNewsletter:
    """Parse a newsletter file and extract its text content.

    Supports HTML, EML, and TXT formats.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    suffix = path.suffix.lower()

    if suffix == ".html" or suffix == ".htm":
        return _parse_html(path)
    elif suffix == ".eml":
        return _parse_eml(path)
    elif suffix == ".txt":
        return _parse_txt(path)
    else:
        raise ValueError(f"Unsupported file format: {suffix}. Use .html, .eml, or .txt")


def _parse_html(path: Path) -> ParsedNewsletter:
    raw = path.read_text(encoding="utf-8", errors="replace")
    soup = BeautifulSoup(raw, "html.parser")

    # Remove script and style elements
    for tag in soup(["script", "style"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    title = soup.title.string if soup.title else ""

    return ParsedNewsletter(
        file_path=str(path),
        format="html",
        subject=title or "",
        body_text=text,
    )


def _parse_eml(path: Path) -> ParsedNewsletter:
    raw = path.read_bytes()
    msg = email.message_from_bytes(raw, policy=policy.default)

    subject = msg.get("Subject", "")
    sender = msg.get("From", "")
    date = msg.get("Date", "")

    body = _extract_eml_body(msg)

    return ParsedNewsletter(
        file_path=str(path),
        format="eml",
        subject=subject,
        sender=sender,
        date=date,
        body_text=body,
    )


def _extract_eml_body(msg: email.message.Message) -> str:
    """Extract plain text body from an email message."""
    # Try plain text first
    body = msg.get_body(preferencelist=("plain",))
    if body:
        content = body.get_content()
        if isinstance(content, str):
            return content

    # Fall back to HTML → text
    body = msg.get_body(preferencelist=("html",))
    if body:
        content = body.get_content()
        if isinstance(content, str):
            soup = BeautifulSoup(content, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()
            return soup.get_text(separator="\n", strip=True)

    return ""


def _parse_txt(path: Path) -> ParsedNewsletter:
    text = path.read_text(encoding="utf-8", errors="replace")

    return ParsedNewsletter(
        file_path=str(path),
        format="txt",
        body_text=text,
    )
