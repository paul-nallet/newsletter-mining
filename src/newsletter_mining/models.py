from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Trend(str, Enum):
    EMERGING = "emerging"
    GROWING = "growing"
    STABLE = "stable"
    DECLINING = "declining"


class ExtractedProblem(BaseModel):
    id: str = Field(description="Unique identifier for this problem")
    problem_summary: str = Field(description="One-line summary of the problem")
    problem_detail: str = Field(description="Detailed description of the problem")
    category: str = Field(description="Problem category (e.g. 'devops', 'security', 'ux')")
    severity: Severity = Field(default=Severity.MEDIUM)
    original_quote: str = Field(default="", description="Exact quote from the newsletter")
    context: str = Field(default="", description="Surrounding context for the problem")
    signals: list[str] = Field(default_factory=list, description="Signals indicating this is a problem (frustration, workaround, complaint)")
    mentioned_tools: list[str] = Field(default_factory=list, description="Tools/products mentioned in relation to this problem")
    target_audience: str = Field(default="", description="Who experiences this problem")


class ParsedNewsletter(BaseModel):
    file_path: str
    format: str = Field(description="File format: html, eml, txt")
    subject: str = ""
    sender: str = ""
    date: str = ""
    body_text: str = Field(description="Extracted plain text content")


class AnalysisResult(BaseModel):
    source_file: str
    analyzed_at: datetime = Field(default_factory=datetime.now)
    newsletter_subject: str = ""
    newsletter_sender: str = ""
    newsletter_date: str = ""
    problems: list[ExtractedProblem] = Field(default_factory=list)
    overall_sentiment: str = Field(default="", description="Overall tone of the newsletter")
    key_topics: list[str] = Field(default_factory=list, description="Main topics discussed")


class ProblemCluster(BaseModel):
    cluster_id: str
    cluster_name: str = Field(description="Short descriptive name for this cluster")
    cluster_summary: str = Field(default="", description="Summary of the common problem theme")
    problem_ids: list[str] = Field(default_factory=list)
    mention_count: int = 0
    trend: Trend = Field(default=Trend.STABLE)
    sources: list[str] = Field(default_factory=list, description="Source newsletters mentioning this cluster")


class ProblemWithEmbedding(BaseModel):
    problem: ExtractedProblem
    source_file: str
    embedding: list[float] = Field(default_factory=list)


class ClusterReport(BaseModel):
    generated_at: datetime = Field(default_factory=datetime.now)
    total_problems: int = 0
    total_clusters: int = 0
    clusters: list[ProblemCluster] = Field(default_factory=list)
    problems: list[ProblemWithEmbedding] = Field(default_factory=list, exclude=True)
