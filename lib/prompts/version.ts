/**
 * VERSÃO DA ANÁLISE
 *
 * Calcula uma "impressão digital" dos prompts, da taxonomia (com pesos), das
 * configurações da IA (modelos incluídos), da lista de veículos e do número
 * ANALYSIS_VERSION abaixo. Se qualquer um mudar, a impressão muda e os
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
import { claimCheckPrompt } from "./claimCheck";
import { balancePrompt } from "./balance";
import { OUTLETS } from "@/lib/veiculos";

/**
 * Aumente este número sempre que mudar a parte da análise feita pelo próprio
 * site (conferência das citações, regras das aspas, cálculo das notas, versão
 * neutra etc.). Assim os resultados guardados com a lógica antiga são refeitos.
 */
export const ANALYSIS_VERSION = 5;

const SAMPLE_TRIAGE: TriageOutput = {
  contentType: "news",
  contentTypeReason: "X",
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
  h.update(`análise v${ANALYSIS_VERSION}`);
  h.update(JSON.stringify(OUTLETS));
  h.update(SYSTEM_PROMPT);
  h.update(JSON.stringify(TAXONOMY));
  h.update(JSON.stringify(SCORING));
  h.update(JSON.stringify(config.ai));
  h.update(JSON.stringify(config.balance));
  for (const lang of ["pt", "en"] as const) {
    h.update(triagePrompt(lang));
    h.update(triagePrompt(lang, true));
    h.update(claimCheckPrompt(SAMPLE_TRIAGE, lang));
    for (const g of TAXONOMY) h.update(specialistPrompt([g], SAMPLE_TRIAGE, lang));
    h.update(overviewPrompt(SAMPLE_TRIAGE, lang));
    h.update(synthesisPrompt("{}", lang));
    const axis = { position: "unidentified", confidence: "low", justification: "", quote: "", start: null, end: null } as const;
    h.update(balancePrompt({ triage: SAMPLE_TRIAGE, economic: axis, social: axis, omissions: [], lang }));
  }
  cached = `v${ANALYSIS_VERSION}-${h.digest("hex").slice(0, 8)}`;
  return cached;
}
