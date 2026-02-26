import type { AnalyzeResponse } from "@/lib/types";

type Props = {
  quotes: NonNullable<AnalyzeResponse["quotes"]>;
};

export function QuoteList({ quotes }: Props) {
  if (!quotes.length) return <p className="text-sm text-slate-500">No quotes provided.</p>;

  return (
    <div className="space-y-4">
      {quotes.map((q, idx) => (
        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
          <p className="text-sm italic text-slate-700">&ldquo;{q.quote}&rdquo;</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.location && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{q.location}</span>
            )}
            {q.service_line && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{q.service_line}</span>
            )}
            {q.channel && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{q.channel}</span>
            )}
            {typeof q.rating === "number" && (
              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700">Rating: {q.rating}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

