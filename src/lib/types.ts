export type PatientFeedbackItem = {
  text: string;
  date?: string;
  location?: string;
  service_line?: string;
  channel?: string;
  rating?: number;
};

export type AnalyzeSettings = {
  model: string;
  audience: "Clinic Executive" | "Patient Experience" | "Operations" | "Nursing Unit";
  outputLength: "Short" | "Standard" | "Detailed";
  includeQuotes: boolean;
  includePriorityMatrix: boolean;
  includeCharts: boolean;
  includeSafetyFlags: boolean;
};

export type RecommendationImpact = "Low" | "Medium" | "High";
export type RecommendationEffort = "Low" | "Medium" | "High";
export type RecommendationTimeframe = "0 to 30 days" | "30 to 90 days" | "90 plus days";

export type Recommendation = {
  title: string;
  rationale: string;
  impact: RecommendationImpact;
  effort: RecommendationEffort;
  owner?: string;
  timeframe?: RecommendationTimeframe;
};

export type PriorityMatrixBuckets = {
  highImpactLowEffort: Recommendation[];
  highImpactHighEffort: Recommendation[];
  lowImpactLowEffort: Recommendation[];
  lowImpactHighEffort: Recommendation[];
};

export type ThemeWithQuote = {
  label: string;
  count: number;
  evidenceQuote?: string;
};

export type AnalyzeResponseKPIs = {
  totalFeedback: number;
  percentNegative: number;
  topThemeShare: number;
  locationsCovered: number;
};

export type AnalyzeResponse = {
  executiveSummary: string;
  /** 3–5 leadership-style bullet points for executive summary section */
  executiveSummaryBullets?: string[];
  kpis?: AnalyzeResponseKPIs;
  themes: ThemeWithQuote[];
  painPoints: ThemeWithQuote[];
  sentiment: { positive: number; neutral: number; negative: number };
  recommendations: Recommendation[];
  priorityMatrix?: PriorityMatrixBuckets;
  quotes?: {
    quote: string;
    location?: string;
    service_line?: string;
    channel?: string;
    rating?: number;
  }[];
  safetyFlags?: {
    category: string;
    severity: "Low" | "Medium" | "High";
    quote: string;
  }[];
  notes?: string[];
  /** Sample size limits, channel bias, what to verify */
  notesAndCaveats?: string[];
};

