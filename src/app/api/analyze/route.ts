import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { analyzeRequestBodySchema } from "@/lib/validators";
import type {
  AnalyzeResponse,
  AnalyzeResponseKPIs,
  AnalyzeSettings,
  PatientFeedbackItem,
  PriorityMatrixBuckets,
  Recommendation,
  ThemeWithQuote
} from "@/lib/types";

const MAX_CHARS = 18000;

function pickQuoteForTheme(items: PatientFeedbackItem[], keywords: string[]): string | undefined {
  const lower = items.map((i) => i.text.toLowerCase());
  for (const kw of keywords) {
    const idx = lower.findIndex((t) => t.includes(kw));
    if (idx >= 0) return items[idx].text;
  }
  return items[0]?.text;
}

function buildMockResponse(items: PatientFeedbackItem[], _settings: AnalyzeSettings): AnalyzeResponse {
  const total = items.length;
  const locations = new Set(items.map((i) => i.location).filter(Boolean));
  const locationsCovered = locations.size;

  const quotes = items.slice(0, 10).map((item) => ({
    quote: item.text,
    location: item.location,
    service_line: item.service_line,
    channel: item.channel,
    rating: item.rating
  }));

  const recommendations: Recommendation[] = [
    {
      title: "Reduce clinic wait times and improve real-time communication",
      rationale:
        "Multiple patients describe waiting well past their scheduled appointment time without explanation. Setting expectations and providing updates can quickly improve perceived respect and trust.",
      impact: "High",
      effort: "Medium",
      owner: "Clinic Operations",
      timeframe: "0 to 30 days"
    },
    {
      title: "Simplify appointment scheduling and follow-up workflows",
      rationale:
        "Patients report needing several calls or messages to schedule or clarify follow-ups. Streamlining workflows and scripting can reduce friction and prevent leakage.",
      impact: "High",
      effort: "High",
      owner: "Access / Scheduling",
      timeframe: "30 to 90 days"
    },
    {
      title: "Clarify billing statements and create a single point of contact",
      rationale:
        "Confusion about multiple statements and who to call for help is a recurring theme. Clearer templates and a visible help line can reduce frustration and rework.",
      impact: "Medium",
      effort: "Medium",
      owner: "Revenue Cycle",
      timeframe: "30 to 90 days"
    },
    {
      title: "Tighten portal usability and messaging workflows",
      rationale:
        "Patients struggle to find where to message their care team and are unsure when to expect a reply. Clear navigation labels and service-level expectations can increase portal adoption.",
      impact: "Medium",
      effort: "Medium",
      owner: "Digital / IT",
      timeframe: "0 to 30 days"
    },
    {
      title: "Standardize safety and cleanliness checks in waiting areas",
      rationale:
        "Comments about unclean or unclearly cleaned spaces erode trust in safety. A visible checklist and rounding pattern can quickly address this.",
      impact: "High",
      effort: "Low",
      owner: "Clinic Leadership",
      timeframe: "0 to 30 days"
    },
    {
      title: "Strengthen processes for handling post-discharge concerns",
      rationale:
        "Patients reporting symptoms or concerns after discharge are sometimes unsure what is normal and when they will hear back. Clear discharge instructions and triage callbacks reduce risk.",
      impact: "High",
      effort: "Medium",
      owner: "Inpatient Nursing",
      timeframe: "30 to 90 days"
    }
  ];

  const priorityMatrix: PriorityMatrixBuckets = {
    highImpactLowEffort: [recommendations[4]],
    highImpactHighEffort: [recommendations[0], recommendations[1], recommendations[5]],
    lowImpactLowEffort: [],
    lowImpactHighEffort: [recommendations[2], recommendations[3]]
  };

  const negPct = Math.min(50, Math.max(15, 38 - Math.floor(total / 4)));
  const posPct = Math.min(55, 25 + total);
  const neutralPct = 100 - negPct - posPct;
  const sentiment = {
    positive: Math.max(0, posPct),
    neutral: Math.max(5, neutralPct),
    negative: negPct
  };

  const themeLabels: [string, number, string[]][] = [
    ["Wait times and flow", Math.max(2, Math.round(total * 0.3)), ["wait", "minutes", "appointment time", "delay"]],
    ["Scheduling and access", Math.max(2, Math.round(total * 0.25)), ["scheduling", "follow-up", "phone calls", "calls"]],
    ["Communication and follow-up", Math.max(2, Math.round(total * 0.25)), ["message", "hear back", "call"]],
    ["Billing clarity", Math.max(1, Math.round(total * 0.15)), ["billing", "statements", "clarification"]],
    ["Digital experience / portal", Math.max(1, Math.round(total * 0.15)), ["portal", "online", "message my doctor"]],
    ["Staff and clinical quality", Math.max(1, Math.round(total * 0.2)), ["nurse", "provider", "listened", "staff"]],
    ["Environment and safety", Math.max(1, Math.round(total * 0.1)), ["wiped", "chairs", "uncomfortable"]],
    ["Wayfinding and logistics", Math.max(1, Math.round(total * 0.1)), ["signage", "parking", "confusing"]]
  ];

  const themes: ThemeWithQuote[] = themeLabels.slice(0, 8).map(([label, count, kws]) => ({
    label,
    count,
    evidenceQuote: pickQuoteForTheme(items, kws)
  }));

  const painLabels: [string, number, string[]][] = [
    ["Extended waits without updates", Math.max(2, Math.round(total * 0.28)), ["wait", "minutes", "delay", "no one explained"]],
    ["Hard-to-navigate scheduling and callbacks", Math.max(2, Math.round(total * 0.24)), ["phone calls", "scheduling", "hear back"]],
    ["Unclear or fragmented billing statements", Math.max(1, Math.round(total * 0.18)), ["billing", "statements", "clarification"]],
    ["Portal confusion and response expectations", Math.max(1, Math.round(total * 0.18)), ["portal", "confusing", "message"]],
    ["Medication or follow-up callback delays", Math.max(1, Math.round(total * 0.12)), ["message", "side effect", "hear back"]],
    ["Environment of care concerns", Math.max(1, Math.round(total * 0.1)), ["wiped", "chairs", "uncomfortable"]],
    ["Post-discharge uncertainty", Math.max(1, Math.round(total * 0.1)), ["went home", "wasn't sure", "normal"]],
    ["Wayfinding and parking", Math.max(1, Math.round(total * 0.08)), ["signage", "parking", "missed"]]
  ];

  const painPoints: ThemeWithQuote[] = painLabels.slice(0, 8).map(([label, count, kws]) => ({
    label,
    count,
    evidenceQuote: pickQuoteForTheme(items, kws)
  }));

  const topThemeCount = themes[0]?.count ?? 0;
  const topThemeShare = total > 0 ? Math.round((topThemeCount / total) * 100) : 0;

  const kpis: AnalyzeResponseKPIs = {
    totalFeedback: total,
    percentNegative: sentiment.negative,
    topThemeShare,
    locationsCovered: locationsCovered || 1
  };

  const executiveSummaryBullets = [
    "Patient feedback indicates strong appreciation for clinical quality and staff, with recurring friction in access, wait-time transparency, and post-visit communication.",
    "Top drivers of dissatisfaction are extended waits without explanation, difficulty scheduling and receiving callbacks, and confusing billing and portal experiences.",
    "Quick wins include standardizing wait-time communication and cleanliness visibility; larger efforts should focus on scheduling workflows and portal usability.",
    "Safety-related themes include post-discharge follow-up delays and environment-of-care concerns; these should be prioritized for review.",
    "Recommendations are ordered by impact and effort in the priority matrix to support huddle planning and resource allocation."
  ];

  const safetyQuoteFromInput =
    items.find((i) => /wiped|chairs|clean/.test(i.text.toLowerCase()))?.text ||
    "No one wiped down the waiting room chairs between patients, which made me question how safe the environment was.";
  const safetyQuoteDischarge =
    items.find((i) => /IV|red|swollen|discharge|hear back/.test(i.text.toLowerCase()))?.text ||
    "I called about redness and swelling at my IV site after discharge and did not hear back for two days, which worried me.";

  const response: AnalyzeResponse = {
    executiveSummary:
      "Patients describe caring staff and generally positive clinical interactions, but experience friction in access, communication, and billing. The biggest pain points center around long and unexplained wait times, difficulty scheduling and receiving timely callbacks, confusing billing statements, and uncertainty about how to use the portal or what to expect after discharge. Addressing wait-time transparency, simplifying access and portal workflows, and clarifying financial communication would materially improve trust and loyalty while also reducing rework for teams.",
    executiveSummaryBullets,
    kpis,
    themes,
    painPoints,
    sentiment,
    recommendations,
    priorityMatrix,
    quotes,
    safetyFlags: [
      { category: "Environment of care / cleanliness", severity: "Medium", quote: safetyQuoteFromInput },
      { category: "Post-procedure symptom follow-up", severity: "High", quote: safetyQuoteDischarge }
    ],
    notes: [
      "Mocked output because API key not set.",
      "Set the OPENAI_API_KEY environment variable and restart the dev server to use live model analysis."
    ],
    notesAndCaveats: [
      `Sample size: ${total} feedback items. Results are indicative; larger samples will improve theme stability.`,
      "Channel bias: Feedback mix depends on survey channel (e.g., post-visit vs. portal). Consider weighting or segmenting by channel when making decisions.",
      "Verify safety flags with clinical or quality teams before action; this tool surfaces potential concerns only."
    ]
  };

  return response;
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = analyzeRequestBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body.",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  const { items, settings } = parsed.data;

  const cleanedItems: PatientFeedbackItem[] = items
    .map((item) => ({
      ...item,
      text: item.text.trim()
    }))
    .filter((item) => item.text.length > 0);

  if (!cleanedItems.length) {
    return NextResponse.json(
      { error: "All feedback items are empty after trimming; provide at least one non-empty comment." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const mock = buildMockResponse(cleanedItems, settings);
    return NextResponse.json(mock);
  }

  const client = new OpenAI({ apiKey });

  const annotated = cleanedItems.map((item, idx) => {
    const metaParts = [
      item.location || "Unknown location",
      item.service_line || "General service line",
      item.channel || "Unknown channel",
      typeof item.rating === "number" ? `rating ${item.rating}` : "rating n/a"
    ];
    return `#${idx + 1} (${metaParts.join(" | ")}): ${item.text}`;
  });

  let combined = annotated.join("\n\n");
  if (combined.length > MAX_CHARS) {
    combined = combined.slice(0, MAX_CHARS);
  }

  const systemPrompt =
    "You are a healthcare patient experience analytics copilot. " +
    "You analyze raw patient comments from clinics and hospitals and produce concise, executive-ready insight. " +
    "Always respond with **ONLY** valid JSON, no markdown, no natural language outside the JSON.";

  const userPrompt = `
You are given de-identified patient feedback comments from a health system. Produce healthcare-specific, executive-ready insight.

Comments (each line is one comment with metadata prefix):

${combined}

Produce a single JSON object with these exact keys (no extra fields). Use only valid JSON.

{
  "executiveSummary": "2-4 sentences, leadership tone, audience: ${settings.audience}",
  "executiveSummaryBullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "kpis": {
    "totalFeedback": ${cleanedItems.length},
    "percentNegative": <number 0-100>,
    "topThemeShare": <number 0-100, share of top theme>,
    "locationsCovered": <number of unique locations in data>
  },
  "themes": [
    { "label": "Theme name", "count": <number>, "evidenceQuote": "exact or shortened quote from input" }
  ],
  "painPoints": [
    { "label": "Pain point", "count": <number>, "evidenceQuote": "exact or shortened quote from input" }
  ],
  "sentiment": { "positive": <0-100>, "neutral": <0-100>, "negative": <0-100> },
  "recommendations": [
    { "title": "...", "rationale": "...", "impact": "Low|Medium|High", "effort": "Low|Medium|High", "owner": "...", "timeframe": "0 to 30 days|30 to 90 days|90 plus days" }
  ],
  "priorityMatrix": {
    "highImpactLowEffort": [<recs>],
    "highImpactHighEffort": [<recs>],
    "lowImpactLowEffort": [<recs>],
    "lowImpactHighEffort": [<recs>]
  },
  "quotes": [{ "quote": "...", "location": "...", "service_line": "...", "channel": "...", "rating": <number or null> }],
  "safetyFlags": [{ "category": "...", "severity": "Low|Medium|High", "quote": "..." }],
  "notesAndCaveats": ["Sample size / limits", "Channel bias note", "What to verify"]
}

Rules:
- executiveSummaryBullets: exactly 3 to 5 bullets, leadership tone.
- themes: top 8, each with one evidenceQuote taken or adapted from the input comments.
- painPoints: top 8, each with one evidenceQuote from input.
- sentiment: three numbers must sum to 100.
- recommendations: exactly 6 items; each must have title, rationale, impact, effort, owner, timeframe.
- priorityMatrix: place each of the 6 recommendations into one of the four quadrants by impact/effort.
- quotes: include up to 10 representative quotes from the input (use actual text from comments).
- safetyFlags: up to 5; use real quotes from input where they indicate safety/quality concerns.
- notesAndCaveats: 2-4 short items (sample size limits, channel bias, what to verify with teams).
- Return ONLY the JSON object. No markdown, no preamble.
  `;

  try {
    const completion = await client.chat.completions.create({
      model: settings.model || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "OpenAI API returned an empty response. Try again or adjust the prompt." },
        { status: 502 }
      );
    }

    let jsonText = content.trim();

    // If the model accidentally added surrounding backticks or text, try to salvage the JSON portion.
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    let parsedJson: AnalyzeResponse;
    try {
      parsedJson = JSON.parse(jsonText) as AnalyzeResponse;
    } catch (error: unknown) {
      return NextResponse.json(
        {
          error: "Failed to parse model JSON response.",
          details: error instanceof Error ? error.message : String(error),
          raw: jsonText
        },
        { status: 502 }
      );
    }

    // Normalize: ensure KPIs and bullets when missing
    const locations = new Set(cleanedItems.map((i) => i.location).filter(Boolean));
    if (!parsedJson.kpis) {
      const total = cleanedItems.length;
      const neg = parsedJson.sentiment?.negative ?? 0;
      const topCount = parsedJson.themes?.[0]?.count ?? 0;
      parsedJson.kpis = {
        totalFeedback: total,
        percentNegative: neg,
        topThemeShare: total > 0 ? Math.round((topCount / total) * 100) : 0,
        locationsCovered: locations.size || 1
      };
    }
    if (!parsedJson.executiveSummaryBullets?.length && parsedJson.executiveSummary) {
      parsedJson.executiveSummaryBullets = [parsedJson.executiveSummary];
    }
    if (!parsedJson.notesAndCaveats?.length && parsedJson.notes?.length) {
      parsedJson.notesAndCaveats = parsedJson.notes;
    }

    return NextResponse.json(parsedJson);
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Error while calling OpenAI API.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 502 }
    );
  }
}

