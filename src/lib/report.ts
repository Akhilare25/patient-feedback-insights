import type { AnalyzeResponse } from "./types";

/** Build a one-page markdown report from analysis result */
export function buildMarkdownReport(result: AnalyzeResponse): string {
  const bullets = result.executiveSummaryBullets?.length
    ? result.executiveSummaryBullets
    : [result.executiveSummary];
  const lines: string[] = [
    "# Patient Feedback Insights Report",
    "",
    "## Executive Summary",
    "",
    ...bullets.map((b) => `- ${b}`),
    ""
  ];

  if (result.kpis) {
    lines.push(
      "## Key metrics",
      "",
      `| Total feedback | % Negative | Top theme share | Locations |`,
      `|----------------|------------|-----------------|-----------|`,
      `| ${result.kpis.totalFeedback} | ${result.kpis.percentNegative}% | ${result.kpis.topThemeShare}% | ${result.kpis.locationsCovered} |`,
      ""
    );
  }

  if (result.themes?.length) {
    lines.push("## Top themes", "");
    result.themes.forEach((t) => {
      lines.push(`- **${t.label}** (${t.count})`);
      if (t.evidenceQuote) lines.push(`  - *"${t.evidenceQuote}"*`);
    });
    lines.push("");
  }

  if (result.painPoints?.length) {
    lines.push("## Pain points", "");
    result.painPoints.forEach((p) => {
      lines.push(`- **${p.label}** (${p.count})`);
      if (p.evidenceQuote) lines.push(`  - *"${p.evidenceQuote}"*`);
    });
    lines.push("");
  }

  lines.push("## Sentiment", "");
  lines.push(
    `- Positive: ${result.sentiment.positive}% | Neutral: ${result.sentiment.neutral}% | Negative: ${result.sentiment.negative}%`,
    ""
  );

  if (result.recommendations?.length) {
    lines.push("## Recommendations", "");
    result.recommendations.forEach((r) => {
      lines.push(
        `### ${r.title}`,
        `- **Rationale:** ${r.rationale}`,
        `- Impact: ${r.impact} | Effort: ${r.effort}${r.owner ? ` | Owner: ${r.owner}` : ""}${r.timeframe ? ` | ${r.timeframe}` : ""}`,
        ""
      );
    });
  }

  if (result.safetyFlags?.length) {
    lines.push("## Safety / quality flags", "");
    result.safetyFlags.forEach((f) => {
      lines.push(`- **${f.category}** [${f.severity}]: "${f.quote}"`);
    });
    lines.push("");
  }

  const caveats = result.notesAndCaveats ?? result.notes ?? [];
  if (caveats.length) {
    lines.push("## Notes and caveats", "");
    caveats.forEach((n) => lines.push(`- ${n}`));
  }

  return lines.join("\n");
}
