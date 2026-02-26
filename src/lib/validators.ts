import { z } from "zod";
import type { AnalyzeSettings, PatientFeedbackItem } from "./types";

export const patientFeedbackItemSchema = z.object({
  text: z.string().min(1).max(8000),
  date: z.string().optional(),
  location: z.string().optional(),
  service_line: z.string().optional(),
  channel: z.string().optional(),
  rating: z.number().optional()
}) satisfies z.ZodType<PatientFeedbackItem>;

export const analyzeSettingsSchema = z.object({
  model: z.string().min(1),
  audience: z.enum(["Clinic Executive", "Patient Experience", "Operations", "Nursing Unit"]),
  outputLength: z.enum(["Short", "Standard", "Detailed"]),
  includeQuotes: z.boolean(),
  includePriorityMatrix: z.boolean(),
  includeCharts: z.boolean(),
  includeSafetyFlags: z.boolean()
}) satisfies z.ZodType<AnalyzeSettings>;

export const analyzeRequestBodySchema = z.object({
  items: z.array(patientFeedbackItemSchema).min(1).max(2000),
  settings: analyzeSettingsSchema
});

export type AnalyzeRequestBody = z.infer<typeof analyzeRequestBodySchema>;

