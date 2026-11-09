/**
 * EXEMPLO DE DEMONSTRAÇÃO (sem IA, sem custo)
 *
 * Usa um resultado escrito à mão (lib/demo/noticia-pt.ts), mas passa pelas
 * mesmas regras de uma análise real: conferência das citações e cálculo das
 * notas. As etapas de progresso são simuladas para a tela se comportar como
 * numa análise de verdade.
 */

import "server-only";
import { AppError } from "@/lib/errors";
import { countWords, normalizeText } from "@/lib/text";
import { buildFindings, activeGroups, finalizeResult } from "@/lib/analysis/assemble";
import { promptVersion } from "@/lib/prompts/version";
import type { AnalysisResult, StreamEvent } from "@/lib/analysis/types";
import type { Lang } from "@/lib/taxonomy";
import * as noticiaPt from "./noticia-pt";
import * as afirmacaoPt from "./afirmacao-pt";

const DEMOS = {
  "noticia-pt": noticiaPt,
  "afirmacao-pt": afirmacaoPt,
} as const;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runDemo(id: string, _lang: Lang, send: (e: StreamEvent) => void): Promise<AnalysisResult> {
  const demo = DEMOS[id as keyof typeof DEMOS];
  if (!demo) throw new AppError("INVALID_INPUT", `demo inexistente: ${id}`);

  // Os exemplos prontos estão escritos em português.
  const lang: Lang = "pt";
  const text = normalizeText(demo.text);

  send({ type: "stage", stage: "extracting" });
  await wait(300);
  send({ type: "stage", stage: "context" });
  await wait(500);
  const total = activeGroups(demo.triage).length + 1;
  for (let done = 0; done <= total; done++) {
    send({ type: "stage", stage: "analyzing", done, total });
    await wait(90);
  }
  send({ type: "stage", stage: "synthesizing" });
  await wait(400);

  const findings = buildFindings(
    text,
    demo.triage,
    [{ words: countWords(text), specialists: demo.specialists, overview: demo.overview }],
    lang,
  );

  return finalizeResult({
    id: `demo-${id}`,
    text,
    source: demo.source,
    wordCount: countWords(text),
    lang,
    promptVersion: promptVersion(),
    demo: true,
    triage: demo.triage,
    findings,
    synthesis: demo.synthesis,
    claimCheck: demo.claimCheck,
    stats: {
      model: "demo",
      parts: 1,
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      estimatedCostUsd: 0,
      fromCache: false,
    },
  });
}
