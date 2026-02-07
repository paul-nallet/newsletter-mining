from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from newsletter_mining.analyzer import analyze_newsletter
from newsletter_mining.clustering import cluster_problems, enrich_cluster_summaries
from newsletter_mining.embeddings import generate_embeddings_batch
from newsletter_mining.models import AnalysisResult, ClusterReport, ProblemWithEmbedding
from newsletter_mining.parser import parse_file

console = Console()

OUTPUT_DIR = Path("output")
SUPPORTED_EXTENSIONS = {".html", ".htm", ".eml", ".txt"}


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        prog="newsletter-mining",
        description="Extract problems and pain-points from newsletters using LLMs",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # analyze
    analyze_parser = subparsers.add_parser("analyze", help="Analyze newsletter file(s)")
    analyze_parser.add_argument(
        "paths",
        nargs="+",
        help="File(s) or directory to analyze",
    )

    # cluster
    subparsers.add_parser("cluster", help="Cluster extracted problems")

    # report
    subparsers.add_parser("report", help="Display a summary report")

    args = parser.parse_args(argv)

    if args.command == "analyze":
        cmd_analyze(args.paths)
    elif args.command == "cluster":
        cmd_cluster()
    elif args.command == "report":
        cmd_report()


def _collect_files(paths: list[str]) -> list[Path]:
    """Resolve paths to a list of supported files."""
    files: list[Path] = []
    for p in paths:
        path = Path(p)
        if path.is_dir():
            for ext in SUPPORTED_EXTENSIONS:
                files.extend(path.glob(f"*{ext}"))
        elif path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append(path)
        else:
            console.print(f"[yellow]Skipping unsupported path: {p}[/yellow]")
    return sorted(set(files))


def cmd_analyze(paths: list[str]) -> None:
    """Analyze one or more newsletter files."""
    files = _collect_files(paths)
    if not files:
        console.print("[red]No supported files found.[/red]")
        sys.exit(1)

    console.print(f"[bold]Analyzing {len(files)} file(s)...[/bold]\n")
    OUTPUT_DIR.mkdir(exist_ok=True)

    for file_path in files:
        console.print(f"[blue]Parsing:[/blue] {file_path}")
        newsletter = parse_file(file_path)

        if not newsletter.body_text.strip():
            console.print(f"[yellow]  Skipping (empty content): {file_path}[/yellow]")
            continue

        console.print(f"  Text length: {len(newsletter.body_text)} chars")
        console.print(f"[blue]Analyzing with GPT-4o...[/blue]")

        result = analyze_newsletter(newsletter)

        # Save result
        output_name = f"{file_path.stem}_analysis.json"
        output_path = OUTPUT_DIR / output_name
        output_path.write_text(
            result.model_dump_json(indent=2),
            encoding="utf-8",
        )

        # Display summary
        console.print(f"[green]  Found {len(result.problems)} problem(s)[/green]")
        for p in result.problems:
            console.print(f"    [{p.severity.value}] {p.problem_summary}")
        console.print(f"  Saved to: {output_path}\n")

    console.print("[bold green]Analysis complete.[/bold green]")


def _load_analysis_results() -> list[AnalysisResult]:
    """Load all analysis result JSON files from the output directory."""
    results: list[AnalysisResult] = []
    if not OUTPUT_DIR.exists():
        return results

    for json_file in sorted(OUTPUT_DIR.glob("*_analysis.json")):
        try:
            data = json.loads(json_file.read_text(encoding="utf-8"))
            results.append(AnalysisResult(**data))
        except Exception as e:
            console.print(f"[yellow]Warning: Could not load {json_file}: {e}[/yellow]")

    return results


def cmd_cluster() -> None:
    """Cluster problems from all analysis results."""
    results = _load_analysis_results()
    if not results:
        console.print("[red]No analysis results found in output/. Run 'analyze' first.[/red]")
        sys.exit(1)

    # Collect all problems
    all_problems: list[ProblemWithEmbedding] = []
    for r in results:
        for p in r.problems:
            all_problems.append(ProblemWithEmbedding(
                problem=p,
                source_file=r.source_file,
            ))

    if not all_problems:
        console.print("[yellow]No problems found in analysis results.[/yellow]")
        return

    console.print(f"[bold]Generating embeddings for {len(all_problems)} problems...[/bold]")
    texts = [f"{p.problem.problem_summary}. {p.problem.problem_detail}" for p in all_problems]
    embeddings = generate_embeddings_batch(texts)

    for pw, emb in zip(all_problems, embeddings):
        pw.embedding = emb

    console.print("[bold]Clustering problems...[/bold]")
    report = cluster_problems(all_problems)

    console.print(f"[bold]Enriching cluster summaries with GPT-4o...[/bold]")
    report = enrich_cluster_summaries(report)

    # Save cluster report
    output_path = OUTPUT_DIR / "cluster_report.json"
    # Serialize without the embeddings (too large)
    report_data = report.model_dump()
    report_data.pop("problems", None)
    output_path.write_text(
        json.dumps(report_data, indent=2, default=str),
        encoding="utf-8",
    )

    console.print(f"\n[green]Clustered {report.total_problems} problems into {report.total_clusters} cluster(s)[/green]")
    console.print(f"Saved to: {output_path}\n")

    _display_cluster_report(report)


def cmd_report() -> None:
    """Display a summary report from existing results."""
    results = _load_analysis_results()

    # Try to load cluster report
    cluster_path = OUTPUT_DIR / "cluster_report.json"
    cluster_report = None
    if cluster_path.exists():
        try:
            data = json.loads(cluster_path.read_text(encoding="utf-8"))
            cluster_report = ClusterReport(**data)
        except Exception:
            pass

    if not results and not cluster_report:
        console.print("[red]No results found in output/. Run 'analyze' first.[/red]")
        sys.exit(1)

    # Analysis summary
    if results:
        _display_analysis_summary(results)

    # Cluster summary
    if cluster_report:
        console.print()
        _display_cluster_report(cluster_report)
    elif results:
        console.print("\n[dim]Run 'cluster' to group similar problems together.[/dim]")


def _display_analysis_summary(results: list[AnalysisResult]) -> None:
    total_problems = sum(len(r.problems) for r in results)

    console.print(Panel(
        f"[bold]{len(results)}[/bold] newsletters analyzed\n"
        f"[bold]{total_problems}[/bold] problems extracted",
        title="Analysis Summary",
    ))

    # Problems by severity
    severity_counts: dict[str, int] = {}
    category_counts: dict[str, int] = {}
    for r in results:
        for p in r.problems:
            severity_counts[p.severity.value] = severity_counts.get(p.severity.value, 0) + 1
            category_counts[p.category] = category_counts.get(p.category, 0) + 1

    if severity_counts:
        table = Table(title="Problems by Severity")
        table.add_column("Severity", style="bold")
        table.add_column("Count", justify="right")
        for sev in ["critical", "high", "medium", "low"]:
            if sev in severity_counts:
                color = {"critical": "red", "high": "yellow", "medium": "blue", "low": "dim"}.get(sev, "")
                table.add_row(f"[{color}]{sev}[/{color}]", str(severity_counts[sev]))
        console.print(table)

    if category_counts:
        table = Table(title="Problems by Category")
        table.add_column("Category", style="bold")
        table.add_column("Count", justify="right")
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
            table.add_row(cat, str(count))
        console.print(table)

    # Detail per newsletter
    for r in results:
        if r.problems:
            console.print(f"\n[bold]{r.newsletter_subject or r.source_file}[/bold]")
            for p in r.problems:
                color = {"critical": "red", "high": "yellow", "medium": "blue", "low": "dim"}.get(p.severity.value, "")
                console.print(f"  [{color}][{p.severity.value}][/{color}] {p.problem_summary}")
                if p.mentioned_tools:
                    console.print(f"    Tools: {', '.join(p.mentioned_tools)}")


def _display_cluster_report(report: ClusterReport) -> None:
    console.print(Panel(
        f"[bold]{report.total_problems}[/bold] problems in [bold]{report.total_clusters}[/bold] clusters",
        title="Cluster Report",
    ))

    for cluster in report.clusters:
        trend_icon = {
            "emerging": "[green]^[/green]",
            "growing": "[green]^^[/green]",
            "stable": "[dim]-[/dim]",
            "declining": "[red]v[/red]",
        }.get(cluster.trend, "-")

        console.print(
            f"\n{trend_icon} [bold]{cluster.cluster_name}[/bold] "
            f"({cluster.mention_count} mention{'s' if cluster.mention_count != 1 else ''})"
        )
        if cluster.cluster_summary:
            console.print(f"  {cluster.cluster_summary}")
        if cluster.sources:
            console.print(f"  [dim]Sources: {', '.join(Path(s).name for s in cluster.sources)}[/dim]")
