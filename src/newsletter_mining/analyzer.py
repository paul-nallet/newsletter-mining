from __future__ import annotations

import json
import time
import uuid

import openai
from rich.console import Console

from newsletter_mining.config import require_openai_key
from newsletter_mining.models import AnalysisResult, ExtractedProblem, ParsedNewsletter

console = Console()

SYSTEM_PROMPT = """\
You are an expert analyst specialized in identifying problems, pain points, and unmet needs \
from newsletter content. Your goal is to extract actionable insights that could represent \
business opportunities.

For each problem you identify, provide:
- A concise summary (1 sentence)
- A detailed description (2-3 sentences)
- The category (e.g., devops, security, ux, data, infrastructure, workflow, cost, performance)
- Severity: low, medium, high, or critical
- The exact quote from the text that signals this problem
- Context around the problem
- Signals that indicate this is a real pain point (frustration, workaround, complaint, wish, comparison)
- Any tools or products mentioned in relation to this problem
- The target audience experiencing this problem

Focus on:
- Explicit complaints or frustrations
- Workarounds people describe
- "I wish..." or "if only..." statements
- Comparisons suggesting something is lacking
- Descriptions of manual/tedious processes
- Cost or performance concerns
- Security or reliability issues mentioned

Respond ONLY with valid JSON matching this exact schema:
{
  "problems": [
    {
      "problem_summary": "string",
      "problem_detail": "string",
      "category": "string",
      "severity": "low|medium|high|critical",
      "original_quote": "string",
      "context": "string",
      "signals": ["string"],
      "mentioned_tools": ["string"],
      "target_audience": "string"
    }
  ],
  "overall_sentiment": "string describing the overall tone",
  "key_topics": ["string"]
}

If no problems are found, return an empty problems array. Do not invent problems that are not present in the text.\
"""


def analyze_newsletter(newsletter: ParsedNewsletter, max_retries: int = 2) -> AnalysisResult:
    """Analyze a parsed newsletter using GPT-4o to extract problems and pain points."""
    api_key = require_openai_key()
    client = openai.OpenAI(api_key=api_key)

    user_message = f"""Analyze the following newsletter content and extract all problems, pain points, and unmet needs.

Newsletter metadata:
- Subject: {newsletter.subject or 'Unknown'}
- Sender: {newsletter.sender or 'Unknown'}
- Date: {newsletter.date or 'Unknown'}

Newsletter content:
---
{newsletter.body_text[:15000]}
---"""

    for attempt in range(max_retries + 1):
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                max_tokens=4096,
                temperature=0.1,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            )

            raw_text = response.choices[0].message.content or ""
            data = _parse_json_response(raw_text)

            problems = []
            for i, p in enumerate(data.get("problems", [])):
                problems.append(
                    ExtractedProblem(
                        id=str(uuid.uuid4())[:8],
                        problem_summary=p.get("problem_summary", ""),
                        problem_detail=p.get("problem_detail", ""),
                        category=p.get("category", "other"),
                        severity=p.get("severity", "medium"),
                        original_quote=p.get("original_quote", ""),
                        context=p.get("context", ""),
                        signals=p.get("signals", []),
                        mentioned_tools=p.get("mentioned_tools", []),
                        target_audience=p.get("target_audience", ""),
                    )
                )

            return AnalysisResult(
                source_file=newsletter.file_path,
                newsletter_subject=newsletter.subject,
                newsletter_sender=newsletter.sender,
                newsletter_date=newsletter.date,
                problems=problems,
                overall_sentiment=data.get("overall_sentiment", ""),
                key_topics=data.get("key_topics", []),
            )

        except (json.JSONDecodeError, KeyError) as e:
            if attempt < max_retries:
                console.print(f"[yellow]Retry {attempt + 1}/{max_retries}: JSON parse error: {e}[/yellow]")
                time.sleep(1)
            else:
                console.print(f"[red]Failed to parse GPT-4o response after {max_retries + 1} attempts[/red]")
                raise
        except openai.APIError as e:
            if attempt < max_retries:
                console.print(f"[yellow]Retry {attempt + 1}/{max_retries}: API error: {e}[/yellow]")
                time.sleep(2)
            else:
                raise


def _parse_json_response(text: str) -> dict:
    """Parse JSON from model response, handling markdown code blocks."""
    text = text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json) and last line (```)
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    return json.loads(text)
