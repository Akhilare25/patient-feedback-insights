"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AnalyzeResponse,
  AnalyzeSettings,
  PatientFeedbackItem,
} from "@/lib/types";
import { detectPotentialPHI } from "@/lib/phi-detector";
import { sampleFeedbackItems, getSampleCsvString } from "@/lib/sample-data";
import { buildMarkdownReport } from "@/lib/report";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast, ToastRoot } from "@/components/ui/use-toast";
import { SentimentDonut } from "@/components/SentimentDonut";
import { SectionCard } from "@/components/SectionCard";
import { ThemeList } from "@/components/ThemeList";
import { PriorityMatrix } from "@/components/PriorityMatrix";
import { QuoteList } from "@/components/QuoteList";
import { SafetyFlagList } from "@/components/SafetyFlagList";
import { KpiStrip } from "@/components/KpiStrip";
import { DataSafetyDialog } from "@/components/DataSafetyDialog";
import { PhiConfirmDialog } from "@/components/PhiConfirmDialog";

type InputMode = "csv" | "paste";

const defaultSettings: AnalyzeSettings = {
  model: "gpt-4o-mini",
  audience: "Clinic Executive",
  outputLength: "Standard",
  includeQuotes: true,
  includePriorityMatrix: true,
  includeCharts: true,
  includeSafetyFlags: true,
};

const SECTION_IDS = [
  "exec-summary",
  "kpis",
  "themes",
  "pain-points",
  "sentiment",
  "recommendations",
  "priority-matrix",
  "safety-flags",
  "notes",
] as const;

export default function HomePage() {
  const [inputMode, setInputMode] = useState<InputMode>("csv");
  const [csvPreview, setCsvPreview] = useState<PatientFeedbackItem[]>([]);
  const [pastedText, setPastedText] = useState("");
  const [items, setItems] = useState<PatientFeedbackItem[]>([]);
  const [settings, setSettings] = useState<AnalyzeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phiConfirmOpen, setPhiConfirmOpen] = useState(false);
  const [phiReasons, setPhiReasons] = useState<string[]>([]);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const { toast, toasts } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasLocation = useMemo(() => items.some((i) => i.location), [items]);
  const hasServiceLine = useMemo(() => items.some((i) => i.service_line), [items]);
  const hasChannel = useMemo(() => items.some((i) => i.channel), [items]);

  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterServiceLine, setFilterServiceLine] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");

  const locations = useMemo(
    () => Array.from(new Set(items.map((i) => i.location).filter(Boolean))) as string[],
    [items]
  );
  const serviceLines = useMemo(
    () => Array.from(new Set(items.map((i) => i.service_line).filter(Boolean))) as string[],
    [items]
  );
  const channels = useMemo(
    () => Array.from(new Set(items.map((i) => i.channel).filter(Boolean))) as string[],
    [items]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterLocation !== "all" && item.location !== filterLocation) return false;
      if (filterServiceLine !== "all" && item.service_line !== filterServiceLine) return false;
      if (filterChannel !== "all" && item.channel !== filterChannel) return false;
      return true;
    });
  }, [items, filterLocation, filterServiceLine, filterChannel]);

  const handleCsvFile = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: { data: Record<string, unknown>[] }) => {
        const rows = results.data.map((row: Record<string, unknown>) => {
          const text = (row.text || row.comment || row.feedback || "").toString().trim();
          return {
            text,
            date: row.date ? String(row.date) : undefined,
            location: row.location ? String(row.location) : undefined,
            service_line: row.service_line ? String(row.service_line) : undefined,
            channel: row.channel ? String(row.channel) : undefined,
            rating: row.rating != null ? Number(row.rating) : undefined,
          } as PatientFeedbackItem;
        });
        const nonEmpty = rows.filter((r) => r.text);
        setItems(nonEmpty);
        setCsvPreview(nonEmpty.slice(0, 10));
        if (!nonEmpty.length) {
          setError("CSV must include a non-empty 'text' column.");
          toast({ title: "No feedback found", description: "Add a 'text' column with content." });
        }
      },
      error: (err: Error) => {
        setError(err.message);
        toast({ title: "CSV error", description: err.message });
      },
    });
  };

  const handlePasteConvert = () => {
    const lines = pastedText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const converted: PatientFeedbackItem[] = lines.map((text) => ({ text }));
    setItems(converted);
    if (!converted.length) {
      toast({ title: "No feedback", description: "Paste at least one line." });
    }
  };

  const handleLoadSample = () => {
    setItems(sampleFeedbackItems);
    setCsvPreview(sampleFeedbackItems.slice(0, 10));
    setError(null);
    toast({ title: "Sample data loaded", description: "12 patient feedback rows. Click Generate insights." });
  };

  const downloadSampleCsv = () => {
    const csv = getSampleCsvString();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient-feedback-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "patient-feedback-sample.csv" });
  };

  const handleClear = () => {
    setItems([]);
    setCsvPreview([]);
    setPastedText("");
    setResult(null);
    setError(null);
    setFilterLocation("all");
    setFilterServiceLine("all");
    setFilterChannel("all");
    setPhiConfirmOpen(false);
    setPendingGenerate(false);
    toast({ title: "Cleared", description: "Input and results reset." });
  };

  const doGenerate = useCallback(async () => {
    const payloadItems = filteredItems.length ? filteredItems : items;
    if (!payloadItems.length) {
      toast({ title: "Add feedback first", description: "Upload CSV, paste text, or load sample data." });
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems, settings }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
      }
      const data = (await res.json()) as AnalyzeResponse;
      setResult(data);
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError(message);
      toast({ title: "Analysis failed", description: message });
    } finally {
      setIsLoading(false);
      setPendingGenerate(false);
    }
  }, [filteredItems, items, settings, toast]);

  const handleGenerate = () => {
    const payloadItems = filteredItems.length ? filteredItems : items;
    if (!payloadItems.length) {
      toast({ title: "Add feedback first", description: "Upload CSV, paste text, or load sample data." });
      return;
    }

    const phi = detectPotentialPHI(payloadItems);
    if (phi.hasPotentialPHI) {
      setPhiReasons(phi.reasons);
      setPendingGenerate(true);
      setPhiConfirmOpen(true);
      return;
    }
    doGenerate();
  };

  const handlePhiConfirm = () => {
    setPhiConfirmOpen(false);
    doGenerate();
  };

  const copyExecutiveSummary = () => {
    if (!result) return;
    const bullets = result.executiveSummaryBullets?.length
      ? result.executiveSummaryBullets.join("\n")
      : result.executiveSummary;
    void navigator.clipboard.writeText(bullets);
    toast({ title: "Copied", description: "Executive summary copied to clipboard." });
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient-feedback-insights.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "patient-feedback-insights.json" });
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const md = buildMarkdownReport(result);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient-feedback-insights-report.md";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "One-page markdown report." });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const estimateCalls = 1;

  return (
    <>
      <ToastRoot toasts={toasts} />
      <PhiConfirmDialog
        open={phiConfirmOpen}
        reasons={phiReasons}
        onConfirm={handlePhiConfirm}
        onCancel={() => { setPhiConfirmOpen(false); setPendingGenerate(false); }}
      />

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  Patient Feedback Insights Copilot
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Healthcare operations — turn raw feedback into executive-ready insight
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleLoadSample} className="bg-emerald-600 hover:bg-emerald-700">
                  Load sample data
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSampleCsv}>
                  Download sample CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  Clear
                </Button>
                <DataSafetyDialog />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Left: Input workflow card (stepper) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="border-slate-200 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Input workflow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1 */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                        1
                      </span>
                      <span className="text-sm font-medium text-slate-700">Choose input mode</span>
                    </div>
                    <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                        <TabsTrigger value="paste">Paste</TabsTrigger>
                      </TabsList>
                      <TabsContent value="csv" className="mt-3">
                        <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-4">
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            className="block w-full text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sky-700"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCsvFile(file);
                            }}
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Required: <strong>text</strong>. Optional: date, location, service_line, channel, rating.
                          </p>
                        </div>
                        {csvPreview.length > 0 && (
                          <div className="mt-3 max-h-40 overflow-auto rounded border border-slate-200">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Text</TableHead>
                                  <TableHead className="text-xs">Loc</TableHead>
                                  <TableHead className="text-xs">Rating</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {csvPreview.slice(0, 5).map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="max-w-[180px] truncate text-xs">{row.text}</TableCell>
                                    <TableCell className="text-xs">{row.location ?? "—"}</TableCell>
                                    <TableCell className="text-xs">{row.rating ?? "—"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="paste" className="mt-3">
                        <Textarea
                          rows={6}
                          placeholder="One comment per line..."
                          value={pastedText}
                          onChange={(e) => setPastedText(e.target.value)}
                          className="resize-none text-sm"
                        />
                        <Button variant="outline" size="sm" className="mt-2" onClick={handlePasteConvert}>
                          Use pasted feedback
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Step 2 label is implicit (Provide data is the content above) */}

                  {/* Step 3: Optional filters */}
                  {(hasLocation || hasServiceLine || hasChannel) && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                          3
                        </span>
                        <span className="text-sm font-medium text-slate-700">Optional filters</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {hasLocation && (
                          <div>
                            <label className="text-xs font-medium text-slate-600">Location</label>
                            <select
                              value={filterLocation}
                              onChange={(e) => setFilterLocation(e.target.value)}
                              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                            >
                              <option value="all">All</option>
                              {locations.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {hasServiceLine && (
                          <div>
                            <label className="text-xs font-medium text-slate-600">Service line</label>
                            <select
                              value={filterServiceLine}
                              onChange={(e) => setFilterServiceLine(e.target.value)}
                              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                            >
                              <option value="all">All</option>
                              {serviceLines.map((sl) => (
                                <option key={sl} value={sl}>{sl}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {hasChannel && (
                          <div>
                            <label className="text-xs font-medium text-slate-600">Channel</label>
                            <select
                              value={filterChannel}
                              onChange={(e) => setFilterChannel(e.target.value)}
                              className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
                            >
                              <option value="all">All</option>
                              {channels.map((ch) => (
                                <option key={ch} value={ch}>{ch}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Generate */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                        4
                      </span>
                      <span className="text-sm font-medium text-slate-700">Generate</span>
                    </div>
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-sky-600 hover:bg-sky-700"
                        onClick={handleGenerate}
                        disabled={isLoading || !items.length}
                      >
                        {isLoading ? "Analyzing…" : "Generate insights"}
                      </Button>
                      <p className="text-xs text-slate-500">
                        Approx. {estimateCalls} API call{estimateCalls !== 1 ? "s" : ""} • Results appear on the right
                      </p>
                      {error && <p className="text-xs text-red-600">{error}</p>}
                    </div>
                  </div>

                  {/* Collapsed settings */}
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-slate-600">Analysis settings</summary>
                    <div className="mt-2 space-y-2 pl-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500">Model</label>
                          <select
                            value={settings.model}
                            onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
                            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="gpt-4o-mini">gpt-4o-mini</option>
                            <option value="gpt-4o">gpt-4o</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500">Audience</label>
                          <select
                            value={settings.audience}
                            onChange={(e) =>
                              setSettings((s) => ({ ...s, audience: e.target.value as AnalyzeSettings["audience"] }))
                            }
                            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option value="Clinic Executive">Clinic Executive</option>
                            <option value="Patient Experience">Patient Experience</option>
                            <option value="Operations">Operations</option>
                            <option value="Nursing Unit">Nursing Unit</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </details>
                </CardContent>
              </Card>
            </div>

            {/* Right: Results panel */}
            <div ref={resultsRef} className="min-w-0">
              {!result && !isLoading && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
                  <p className="text-slate-500">Load sample data or add your own feedback, then click Generate insights.</p>
                  <p className="mt-2 text-sm text-slate-400">Results will appear here with executive summary, KPIs, themes, and more.</p>
                </div>
              )}

              {isLoading && (
                <Card className="border-slate-200">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <p className="mt-4 font-medium text-slate-700">Analyzing feedback…</p>
                    <p className="text-sm text-slate-500">Summarizing themes, sentiment, and recommendations.</p>
                  </CardContent>
                </Card>
              )}

              {result && (
                <div className="space-y-6">
                  {/* Sticky header + nav + export */}
                  <div className="sticky top-[4.5rem] z-30 -mx-2 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur md:top-20">
                    <h2 className="text-lg font-semibold text-slate-900">Insights report</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SECTION_IDS.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => scrollToSection(id)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        >
                          {id.replace(/-/g, " ")}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <Button variant="outline" size="sm" onClick={copyExecutiveSummary}>
                        Copy executive summary
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadJson}>
                        Download JSON
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                        Download markdown report
                      </Button>
                    </div>
                  </div>

                  {/* Executive Summary */}
                  <section id="exec-summary" className="scroll-mt-28">
                    <SectionCard title="Executive summary">
                      {result.executiveSummaryBullets?.length ? (
                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                          {result.executiveSummaryBullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm leading-relaxed text-slate-700">{result.executiveSummary}</p>
                      )}
                    </SectionCard>
                  </section>

                  {/* KPIs */}
                  {result.kpis && (
                    <section id="kpis" className="scroll-mt-28">
                      <SectionCard title="Key metrics">
                        <KpiStrip kpis={result.kpis} />
                      </SectionCard>
                    </section>
                  )}

                  {/* Themes */}
                  <section id="themes" className="scroll-mt-28">
                    <SectionCard title="Top themes">
                      <ThemeList items={result.themes} />
                    </SectionCard>
                  </section>

                  {/* Pain points */}
                  <section id="pain-points" className="scroll-mt-28">
                    <SectionCard title="Pain points">
                      <ThemeList items={result.painPoints} />
                    </SectionCard>
                  </section>

                  {/* Sentiment */}
                  <section id="sentiment" className="scroll-mt-28">
                    <SectionCard title="Sentiment">
                      <SentimentDonut sentiment={result.sentiment} />
                    </SectionCard>
                  </section>

                  {/* Recommendations */}
                  <section id="recommendations" className="scroll-mt-28">
                    <SectionCard title="Recommendations">
                      <ul className="space-y-4">
                        {result.recommendations.map((rec, idx) => (
                          <li key={idx} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-slate-900">{rec.title}</strong>
                              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">Impact: {rec.impact}</span>
                              <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">Effort: {rec.effort}</span>
                              {rec.owner && (
                                <span className="rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-800">{rec.owner}</span>
                              )}
                              {rec.timeframe && (
                                <span className="text-xs text-slate-500">{rec.timeframe}</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-600">{rec.rationale}</p>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  </section>

                  {/* Priority matrix */}
                  {result.priorityMatrix && (
                    <section id="priority-matrix" className="scroll-mt-28">
                      <SectionCard title="Impact / effort priority matrix">
                        <PriorityMatrix matrix={result.priorityMatrix} />
                      </SectionCard>
                    </section>
                  )}

                  {/* Evidence quotes */}
                  {result.quotes && result.quotes.length > 0 && (
                    <section className="scroll-mt-28">
                      <SectionCard title="Evidence quotes">
                        <QuoteList quotes={result.quotes} />
                      </SectionCard>
                    </section>
                  )}

                  {/* Safety flags */}
                  {result.safetyFlags && result.safetyFlags.length > 0 && (
                    <section id="safety-flags" className="scroll-mt-28">
                      <SectionCard title="Safety & quality flags">
                        <SafetyFlagList flags={result.safetyFlags} />
                      </SectionCard>
                    </section>
                  )}

                  {/* Notes and caveats */}
                  <section id="notes" className="scroll-mt-28">
                    <SectionCard title="Notes and caveats">
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {(result.notesAndCaveats ?? result.notes ?? []).map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </SectionCard>
                  </section>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
