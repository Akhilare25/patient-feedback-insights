import type { ThemeWithQuote } from "@/lib/types";

type Props = {
  items: ThemeWithQuote[] | { label: string; count: number }[];
};

export function ThemeList({ items }: Props) {
  if (!items.length) return <p className="text-sm text-slate-500">No themes identified.</p>;

  const total = items.reduce((sum: number, item: { count: number }) => sum + item.count, 0) || 1;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = Math.round((item.count / total) * 100);
        const withQuote = "evidenceQuote" in item ? item : null;
        return (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex justify-between items-start gap-2 mb-1">
              <span className="font-medium text-slate-900">{item.label}</span>
              <span className="text-sm text-slate-500 shrink-0">
                {item.count} • {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
              />
            </div>
            {withQuote?.evidenceQuote && (
              <p className="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-2">
                &ldquo;{withQuote.evidenceQuote}&rdquo;
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

