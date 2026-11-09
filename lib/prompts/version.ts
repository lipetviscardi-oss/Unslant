/**
 * Calcula uma "impressão digital" dos prompts, da taxonomia e das
 * configurações da IA. Se qualquer um mudar, a impressão muda e os
 * resultados antigos guardados em cache deixam de ser usados.
 */

import "server-only";
import { createHash } from "node:crypto";
import { config } from "@/lib/config";
import { SCORING, TAXONOMY } from "@/lib/taxonomy";
import type { TriageOutput } from "@/lib/analysis/schemas";
import { SYSTEM_PROMPT } from "./system";
import { triagePrompt } from "./triage";
import { specialistPrompt } from "./specialist";
import { overviewPrompt } from "./overview";
import { synthesisPrompt } from "./synthesis";

const SAMPLE_TRIAGE: TriageOutput = {
  contentType: "news",
  country: "X",
  countryCode: "X",
  politicalContext: "X",
  documentLanguage: "X",
  topic: "X",
  contentSummary: "X",
  title: "",
  author: "",
  outlet: "",
  publishedAt: "",
};

let cached: string | null = null;

export function promptVersion(): string {
  if (cached) return cached;
  const h = createHash("sha256");
  h.update(SYSTEM_PROMPT);
  h.update(JSON.stringify(TAXONOMY));
  h.update(JSON.stringify(SCORING));
  h.update(JSON.stringify(config.ai));
  for (const lang of ["pt", "en"] as const) {
    h.update(triagePrompt(lang));
    for (const g of TAXONOMY) h.update(specialistPrompt(g, SAMPLE_TRIAGE, lang));
    h.update(overviewPrompt(SAMPLE_TRIAGE, lang));
    h.update(synthesisPrompt("{}", lang));
  }
  cached = h.digest("hex").slice(0, 12);
  return cached;
}
