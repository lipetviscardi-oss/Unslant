/**
 * LINHA DE MONTAGEM DA ANÁLISE
 *
 *  1. Identificação  — tipo de texto, país e contexto (1 chamada rápida)
 *  2. Especialistas  — um por grupo da taxonomia + visão geral, em paralelo
 *  3. Conferência    — citações procuradas no texto, notas calculadas
 *  4. Síntese        — resumo final e sugestão de reescrita neutra
 *     + Busca na web  — textos para equilibrar a leitura (ao mesmo tempo)
 *
 * Textos muito longos são divididos em partes (ver config.text.maxWordsPerPart);
 * cada parte passa pelos especialistas e os resultados são consolidados.
 */

import "server-only";
import { randomUUID } from "node:crypto";
import { activeModel, config } from "@/lib/config";
import { AppError } from "@/lib/errors";
import type { Lang } from "@/lib/taxonomy";
import { countWords, splitIntoParts } from "@/lib/text";
import { callStructured, runLimited, UsageTracker } from "@/lib/ai/client";
import { buildDocumentBlock, newBoundary } from "@/lib/prompts/document";
import { triagePrompt } from "@/lib/prompts/triage";
import { specialistPrompt } from "@/lib/prompts/specialist";
import { overviewPrompt } from "@/lib/prompts/overview";
import { synthesisPrompt } from "@/lib/prompts/synthesis";
import { claimCheckPrompt } from "@/lib/prompts/claimCheck";
import { balancePrompt } from "@/lib/prompts/balance";
import { searchBalance } from "@/lib/ai/balance";
import { promptVersion } from "@/lib/prompts/version";
import {
  ClaimCheckSchema,
  OverviewSchema,
  SynthesisSchema,
  TriageSchema,
  specialistSchema,
  type ClaimCheckOutput,
  type SpecialistOutput,
  type SynthesisOutput,
  type TriageOutput,
} from "./schemas";
import {
  activeGroups,
  buildFindings,
  finalizeResult,
  findingsForSynthesis,
  rewriteProblem,
  type RawPart,
} from "./assemble";
import type { BiasGroup } from "@/lib/taxonomy";
import type { AnalysisResult, SourceInfo, StreamEvent } from "./types";

export interface PipelineInput {
  text: string;
  source: SourceInfo;
  lang: Lang;
  signal?: AbortSignal;
  onProgress: (event: StreamEvent) => void;
}

/**
 * Junta os grupos ativos nas chamadas definidas em config.ai.specialistBundles.
 * Grupos que não estiverem em nenhum pacote viram uma chamada própria.
 */
function buildBundles(groups: BiasGroup[]): BiasGroup[][] {
  const used = new Set<string>();
  const bundles: BiasGroup[][] = [];
  for (const ids of config.ai.specialistBundles) {
    const bundle = groups.filter((g) => (ids as readonly string[]).includes(g.id) && !used.has(g.id));
    bundle.forEach((g) => used.add(g.id));
    if (bundle.length) bundles.push(bundle);
  }
  for (const g of groups) if (!used.has(g.id)) bundles.push([g]);
  return bundles;
}

export async function runPipeline(input: PipelineInput): Promise<AnalysisResult> {
  const startedAt = Date.now();
  const { text, source, lang, signal, onProgress } = input;
  const usage = new UsageTracker();
  const wordCount = countWords(text);
  const parts = splitIntoParts(text, config.text.maxWordsPerPart);
  const boundary = newBoundary(); // código aleatório das marcações do documento
  const isClaim = source.type === "claim";

  // 1. Identificação (usa a primeira parte, onde ficam título e resumo)
  onProgress({ type: "stage", stage: "context" });
  const identified = await callStructured({
    label: "identificação",
    schema: TriageSchema,
    documentBlock: buildDocumentBlock(parts[0].text, source, boundary, { index: 0, total: parts.length }),
    task: triagePrompt(lang, isClaim),
    stage: "identificação",
    effort: config.ai.effort.triage,
    maxTokens: config.ai.maxTokens.triage,
    usage,
    signal,
  });

  // Na aba "Afirmação", o tipo é sempre "afirmação" (define os grupos analisados).
  const triage: TriageOutput = isClaim ? { ...identified, contentType: "claim" } : identified;

  // 2. Especialistas (agrupados) + visão geral (+ verificação, para afirmações), em paralelo
  const groups = activeGroups(triage);
  const bundles = buildBundles(groups);
  const perPart = bundles.length + 1;
  const total = parts.length * perPart + (isClaim ? 1 : 0);
  let done = 0;
  onProgress({ type: "stage", stage: "analyzing", done, total });
  const tick = () => {
    done++;
    onProgress({ type: "stage", stage: "analyzing", done, total });
  };

  const tasks: (() => Promise<{ part: number; groupId: string | null; output: unknown }>)[] = [];
  parts.forEach((part, partIndex) => {
    const documentBlock = buildDocumentBlock(part.text, source, boundary, { index: partIndex, total: parts.length });
    for (const bundle of bundles) {
      const ids = bundle.flatMap((g) => g.categories.map((c) => c.id)) as [string, ...string[]];
      tasks.push(async () => {
        const output = await callStructured({
          label: `especialistas ${bundle.map((g) => g.id).join("+")} (parte ${partIndex + 1})`,
          stage: "especialistas",
          schema: specialistSchema(ids),
          documentBlock,
          task: specialistPrompt(bundle, triage, lang),
          effort: config.ai.effort.specialist,
          maxTokens: config.ai.maxTokens.specialist,
          usage,
          signal,
        });
        tick();
        return { part: partIndex, groupId: "__bundle__", output };
      });
    }
    tasks.push(async () => {
      const output = await callStructured({
        label: `visão geral (parte ${partIndex + 1})`,
        stage: "visão geral",
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

  let claimCheck: ClaimCheckOutput | null = null;
  if (isClaim) {
    const documentBlock = buildDocumentBlock(parts[0].text, source, boundary, { index: 0, total: parts.length });
    tasks.push(async () => {
      claimCheck = await callStructured({
        label: "verificação da afirmação",
        stage: "verificação",
        schema: ClaimCheckSchema,
        documentBlock,
        task: claimCheckPrompt(triage, lang),
        effort: config.ai.effort.claimCheck,
        maxTokens: config.ai.maxTokens.claimCheck,
        usage,
        signal,
      });
      tick();
      return { part: -1, groupId: "__claim__", output: null };
    });
  }

  const outputs = await runLimited(tasks, config.ai.maxParallelRequests[config.ai.provider]);

  const rawParts: RawPart[] = parts.map((p, i) => {
    const specialists: Record<string, SpecialistOutput> = {};
    let overview: RawPart["overview"] | undefined;
    for (const o of outputs.filter((x) => x.part === i)) {
      if (o.groupId === "__bundle__") {
        // Separa as categorias de cada chamada agrupada por grupo da taxonomia.
        for (const cat of (o.output as SpecialistOutput).categories) {
          const groupId = groups.find((g) => g.categories.some((c) => c.id === cat.categoryId))?.id;
          if (!groupId) continue;
          (specialists[groupId] ??= { categories: [] }).categories.push(cat);
        }
      } else if (o.groupId === null) {
        overview = o.output as RawPart["overview"];
      }
    }
    if (!overview) throw new AppError("AI_BAD_RESPONSE", "visão geral ausente");
    return { words: countWords(p.text), specialists, overview };
  });

  // 3. Conferência das citações e cálculo das notas
  const findings = buildFindings(text, triage, rawParts, lang);

  // 4. Síntese + busca de textos para equilibrar, ao mesmo tempo
  onProgress({ type: "stage", stage: "balancing" });

  const runSynthesis = (retryNote = "") =>
    callStructured({
      label: "síntese",
      stage: "síntese",
      light: true, // modelo mais barato: só resume o que os especialistas encontraram
      schema: SynthesisSchema,
      task: synthesisPrompt(findingsForSynthesis(triage, findings, text), lang, retryNote),
      effort: config.ai.effort.synthesis,
      maxTokens: config.ai.maxTokens.synthesis,
      usage,
      signal,
    });

  const synthesisTask = (async (): Promise<SynthesisOutput | null> => {
    try {
      let out = await runSynthesis();
      // A versão neutra não pode inventar fontes ou números: confere e, se precisar, refaz uma vez.
      let problem = rewriteProblem(findings, out, text);
      if (problem) {
        console.warn(`[unslant] versão neutra refeita: ${problem}`);
        out = await runSynthesis(`na tentativa anterior a versão neutra ${problem}. Isso é proibido: reescreva usando só o que está no trecho original.`);
        problem = rewriteProblem(findings, out, text);
        if (problem) {
          console.warn(`[unslant] versão neutra descartada: ${problem}`);
          out = { ...out, rewrite: { evidenceId: "", rewritten: "", explanation: "" } };
        }
      }
      return out;
    } catch (err) {
      // Sem a síntese, a análise ainda é útil: mostramos o resto.
      if (!(err instanceof AppError && err.code === "AI_BAD_RESPONSE")) throw err;
      console.warn("[unslant] síntese falhou; seguindo sem resumo final", err.detail);
      return null;
    }
  })();

  const balanceTask = (async (): Promise<NonNullable<AnalysisResult["balance"]>> => {
    if (!config.balance.enabled) return { status: "disabled", data: null };
    try {
      const data = await searchBalance({
        task: balancePrompt({
          triage,
          economic: findings.political.economic,
          social: findings.political.social,
          dispute: findings.political.dispute,
          omissions: findings.omissions.map((o) => o.title),
          originalOutlet: source.outlet,
          lang,
        }),
        countryCode: triage.countryCode,
        originalUrl: source.url,
        usage,
        signal,
      });
      return { status: "ok", data };
    } catch (err) {
      // A busca é um complemento: se falhar, o resto da análise continua valendo.
      if (signal?.aborted) throw err;
      console.warn("[unslant] busca para equilibrar falhou:", err instanceof AppError ? `${err.code} ${err.detail ?? ""}` : err);
      return { status: "unavailable", data: null };
    }
  })();

  const [synthesis, balance] = await Promise.all([synthesisTask, balanceTask]);

  // Mostra no terminal quanto cada etapa custou (para acompanhar e otimizar).
  console.info(
    `[unslant] custo por etapa (US$ ${usage.costUsd().toFixed(4)} no total, ${Math.round((Date.now() - startedAt) / 1000)} s):\n` +
      Object.entries(usage.report())
        .map(([k, v]) => `  - ${k}: US$ ${v.costUsd.toFixed(4)} (${v.calls} chamada(s), ${v.model}, entrada ${v.inputTokens} + cache ${v.cacheReadTokens}/${v.cacheWriteTokens}, saída ${v.outputTokens}${v.webSearches ? `, ${v.webSearches} busca(s)` : ""})`)
        .join("\n"),
  );

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
    claimCheck,
    balance,
    stats: {
      model: activeModel(),
      parts: parts.length,
      durationMs: Date.now() - startedAt,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens,
      cacheWriteTokens: usage.cacheWriteTokens,
      estimatedCostUsd: usage.costUsd(),
      webSearches: usage.webSearches,
      stages: usage.report(),
      fromCache: false,
    },
  });
}
