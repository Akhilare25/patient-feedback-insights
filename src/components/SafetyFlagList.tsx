import type { AnalyzeResponse } from "@/lib/types";

type Props = {
  flags: NonNullable<AnalyzeResponse["safetyFlags"]>;
};

export function SafetyFlagList({ flags }: Props) {
  if (!flags.length) return <p className="text-sm text-slate-500">No safety or quality flags detected.</p>;

  const severityClass = (severity: "Low" | "Medium" | "High") => {
    if (severity === "High") return "bg-red-100 text-red-800";
    if (severity === "Medium") return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  };

  return (
    <div className="space-y-4">
      {flags.map((flag, idx) => (
        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-900">{flag.category}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClass(flag.severity)}`}>
              {flag.severity}
            </span>
          </div>
          <p className="text-sm text-slate-600 italic">&ldquo;{flag.quote}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}

