/**
 * LINHA DE MONTAGEM DA ANÁLISE
 *
 *  1. Identificação  — tipo de texto, país e contexto (1 chamada rápida)
 *  2. Especialistas  — um por grupo da taxonomia + visão geral, em paralelo
 *  3. Conferência    — citações procuradas no texto, notas calculadas
 *  4. Síntese        — resumo final e sugestão de reescrita neutra
 *
 * Textos muito longos são divididos em partes (ver config.text.maxWordsPerPart);
 * cada parte passa pelos especialistas e os resultados são consolidados.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { Lang } from "@/lib/taxonomy";
import { countWords, splitIntoParts } from "@/lib/text";
import { callStructured, runLimited, UsageTracker } from "@/lib/ai/client";
import { buildDocumentBlock } from "@/lib/prompts/document";
import { triagePrompt } from "@/lib/prompts/triage";
import { specialistPrompt } from "@/lib/prompts/specialist";
import { overviewPrompt } from "@/lib/prompts/overview";
import { synthesisPrompt } from "@/lib/prompts/synthesis";
import { promptVersion } from "@/lib/prompts/version";
import {
  OverviewSchema,
  SynthesisSchema,
  TriageSchema,
  specialistSchema,
  type SpecialistOutput,
  type SynthesisOutput,
} from "./schemas";
import { activeGroups, buildFindings, finalizeResult, findingsForSynthesis, type RawPart } from "./assemble";
import type { AnalysisResult, SourceInfo, StreamEvent } from "./types";

export interface PipelineInput {
  text: string;
  source: SourceInfo;
  lang: Lang;
  signal?: AbortSignal;
  onProgress: (event: StreamEvent) => void;
}

export async function runPipeline(input: PipelineInput): Promise<AnalysisResult> {
  const startedAt = Date.now();
  const { text, source, lang, signal, onProgress } = input;
  const usage = new UsageTracker();
  const wordCount = countWords(text);
  const parts = splitIntoParts(text, config.text.maxWordsPerPart);

  // 1. Identificação (usa a primeira parte, onde ficam título e resumo)
  onProgress({ type: "stage", stage: "context" });
  const triage = await callStructured({
    label: "identificação",
    schema: TriageSchema,
    documentBlock: buildDocumentBlock(parts[0].text, source, { index: 0, total: parts.length }),
    task: triagePrompt(lang),
    effort: config.ai.effort.triage,
    maxTokens: config.ai.maxTokens.triage,
    usage,
    signal,
  });

  // 2. Especialistas + visão geral, em paralelo
  const groups = activeGroups(triage);
  const perPart = groups.length + 1;
  const total = parts.length * perPart;
  let done = 0;
  onProgress({ type: "stage", stage: "analyzing", done, total });
  const tick = () => {
    done++;
    onProgress({ type: "stage", stage: "analyzing", done, total });
  };

  const tasks: (() => Promise<{ part: number; groupId: string | null; output: unknown }>)[] = [];
  parts.forEach((part, partIndex) => {
    const documentBlock = buildDocumentBlock(part.text, source, { index: partIndex, total: parts.length });
    for (const group of groups) {
      const ids = group.categories.map((c) => c.id) as [string, ...string[]];
      tasks.push(async () => {
        const output = await callStructured({
          label: `especialista ${group.id} (parte ${partIndex + 1})`,
          schema: specialistSchema(ids),
          documentBlock,
          task: specialistPrompt(group, triage, lang),
          effort: config.ai.effort.specialist,
          maxTokens: config.ai.maxTokens.specialist,
          usage,
          signal,
        });
        tick();
        return { part: partIndex, groupId: group.id, output };
      });
    }
    tasks.push(async () => {
      const output = await callStructured({
        label: `visão geral (parte ${partIndex + 1})`,
        schema: OverviewSchema,
        documentBlock,
        task: overviewPrompt(triage, lang),
        effort: config.ai.effort.overview,
        maxTokens: config.ai.maxTokens.overview,
        usage,
        signal,
      });
      tick();
      return { part: partIndex, groupId: null, output };
    });
  });

  const outputs = await runLimited(tasks, config.ai.maxParallelRequests);

  const rawParts: RawPart[] = parts.map((p, i) => {
    const specialists: Record<string, SpecialistOutput> = {};
    let overview: RawPart["overview"] | undefined;
    for (const o of outputs.filter((x) => x.part === i)) {
      if (o.groupId) specialists[o.groupId] = o.output as SpecialistOutput;
      else overview = o.output as RawPart["overview"];
    }
    if (!overview) throw new AppError("AI_BAD_RESPONSE", "visão geral ausente");
    return { words: countWords(p.text), specialists, overview };
  });

  // 3. Conferência das citações e cálculo das notas
  const findings = buildFindings(text, triage, rawParts, lang);

  // 4. Síntese
  onProgress({ type: "stage", stage: "synthesizing" });
  let synthesis: SynthesisOutput | null = null;
  try {
    synthesis = await callStructured({
      label: "síntese",
      schema: SynthesisSchema,
      task: synthesisPrompt(findingsForSynthesis(triage, findings), lang),
      effort: config.ai.effort.synthesis,
      maxTokens: config.ai.maxTokens.synthesis,
      usage,
      signal,
    });
  } catch (err) {
    // Sem a síntese, a análise ainda é útil: mostramos o resto.
    if (!(err instanceof AppError && err.code === "AI_BAD_RESPONSE")) throw err;
    console.warn("[unslant] síntese falhou; seguindo sem resumo final", err.detail);
  }

  return finalizeResult({
    id: randomUUID(),
    text,
    source,
    wordCount,
    lang,
    promptVersion: promptVersion(),
    demo: false,
    triage,
    findings,
    synthesis,
    stats: {
      model: config.ai.model,
      parts: parts.length,
      durationMs: Date.now() - startedAt,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens,
      cacheWriteTokens: usage.cacheWriteTokens,
      estimatedCostUsd: usage.costUsd(config.ai.model),
      fromCache: false,
    },
  });
}
