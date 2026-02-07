from __future__ import annotations

import json
import uuid

import numpy as np
import openai
from rich.console import Console

from newsletter_mining.config import require_openai_key
from newsletter_mining.models import (
    ClusterReport,
    ProblemCluster,
    ProblemWithEmbedding,
)

console = Console()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    va = np.array(a)
    vb = np.array(b)
    dot = np.dot(va, vb)
    norm = np.linalg.norm(va) * np.linalg.norm(vb)
    if norm == 0:
        return 0.0
    return float(dot / norm)


def cluster_problems(
    problems: list[ProblemWithEmbedding],
    threshold: float = 0.85,
) -> ClusterReport:
    """Cluster problems by cosine similarity using incremental assignment.

    For each problem, find the closest existing cluster centroid.
    If similarity > threshold, assign to that cluster. Otherwise, create a new cluster.
    """
    clusters: list[dict] = []  # Each has: problem_ids, embeddings, sources

    for pw in problems:
        if not pw.embedding:
            continue

        best_cluster_idx = -1
        best_similarity = -1.0

        for i, cluster in enumerate(clusters):
            # Compare against cluster centroid (mean of embeddings)
            centroid = np.mean(cluster["embeddings"], axis=0).tolist()
            sim = cosine_similarity(pw.embedding, centroid)
            if sim > best_similarity:
                best_similarity = sim
                best_cluster_idx = i

        if best_similarity >= threshold and best_cluster_idx >= 0:
            clusters[best_cluster_idx]["problem_ids"].append(pw.problem.id)
            clusters[best_cluster_idx]["embeddings"].append(pw.embedding)
            if pw.source_file not in clusters[best_cluster_idx]["sources"]:
                clusters[best_cluster_idx]["sources"].append(pw.source_file)
        else:
            clusters.append({
                "problem_ids": [pw.problem.id],
                "embeddings": [pw.embedding],
                "sources": [pw.source_file],
            })

    # Build ProblemCluster objects
    problem_clusters = []
    problems_by_id = {pw.problem.id: pw.problem for pw in problems}

    for cluster_data in clusters:
        pids = cluster_data["problem_ids"]
        representative = problems_by_id[pids[0]]

        problem_clusters.append(ProblemCluster(
            cluster_id=str(uuid.uuid4())[:8],
            cluster_name=representative.problem_summary[:80],
            problem_ids=pids,
            mention_count=len(pids),
            sources=cluster_data["sources"],
        ))

    # Sort by mention count descending
    problem_clusters.sort(key=lambda c: c.mention_count, reverse=True)

    return ClusterReport(
        total_problems=len([p for p in problems if p.embedding]),
        total_clusters=len(problem_clusters),
        clusters=problem_clusters,
        problems=problems,
    )


def enrich_cluster_summaries(report: ClusterReport) -> ClusterReport:
    """Use GPT-4o to generate descriptive summaries for each cluster."""
    api_key = require_openai_key()
    client = openai.OpenAI(api_key=api_key)

    problems_by_id = {pw.problem.id: pw.problem for pw in report.problems}

    for cluster in report.clusters:
        problem_texts = []
        for pid in cluster.problem_ids:
            p = problems_by_id.get(pid)
            if p:
                problem_texts.append(f"- {p.problem_summary}: {p.problem_detail}")

        if not problem_texts:
            continue

        prompt = f"""Given these related problems, provide:
1. A short cluster name (3-5 words)
2. A one-paragraph summary of the common theme

Problems:
{chr(10).join(problem_texts)}

        Respond in JSON: {{"cluster_name": "...", "cluster_summary": "...", "trend": "emerging|growing|stable|declining"}}"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                max_tokens=500,
                temperature=0.1,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt}],
            )
            raw = (response.choices[0].message.content or "").strip()
            if raw.startswith("```"):
                lines = raw.split("\n")[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]
                raw = "\n".join(lines)

            data = json.loads(raw)
            cluster.cluster_name = data.get("cluster_name", cluster.cluster_name)
            cluster.cluster_summary = data.get("cluster_summary", "")
            cluster.trend = data.get("trend", "stable")
        except Exception as e:
            console.print(f"[yellow]Warning: Could not generate summary for cluster {cluster.cluster_id}: {e}[/yellow]")

    return report
