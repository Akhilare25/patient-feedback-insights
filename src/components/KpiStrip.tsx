"use client";

import type { AnalyzeResponseKPIs } from "@/lib/types";

type Props = {
  kpis: AnalyzeResponseKPIs;
};

export function KpiStrip({ kpis }: Props) {
  const cards = [
    { label: "Total feedback", value: String(kpis.totalFeedback), sub: "responses" },
    { label: "% Negative", value: `${kpis.percentNegative}%`, sub: "sentiment" },
    { label: "Top theme share", value: `${kpis.topThemeShare}%`, sub: "of responses" },
    { label: "Locations covered", value: String(kpis.locationsCovered), sub: "sites" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{c.value}</p>
          <p className="text-xs text-slate-400">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
