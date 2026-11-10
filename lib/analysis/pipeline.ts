/**
 * LINHA DE MONTAGEM DA ANÁLISE
 *
 *  1. Identificação  — tipo de texto, país e contexto (1 chamada rápida)
 *  2. Especialistas  — grupos da taxonomia em pacotes, em paralelo; a visão
 *                      geral vai junto do pacote menor (config.ai.overviewWithSpecialists)
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
import { visualPrompt } from "@/lib/prompts/visual";
import { figureLabel, IMAGE_CATEGORY_IDS, toCallImages, visualContext, type VisualInput } from "./visuals";
import { searchBalance } from "@/lib/ai/balance";
import { counterpartsFor, leaningOf } from "@/lib/veiculos";
import { promptVersion } from "@/lib/prompts/version";
import {
  ClaimCheckSchema,
  OverviewSchema,
  SynthesisSchema,
  TriageSchema,
  specialistSchema,
  specialistWithOverviewSchema,
  visualSchema,
  type VisualOutput,
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
  rewriteCandidates,
  rewriteProblem,
  summaryProblem,
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
  /** Imagens do conteúdo (páginas de PDF com figuras, imagens da matéria). */
  visuals?: VisualInput[];
  /** Só para testes: troca o "esforço" dos especialistas (ver npm run teste -- --baixo). */
  specialistEffort?: "low" | "medium" | "high";
  /** Só para testes: especialistas no modelo leve — todos ("haiku") ou menos o da visão geral ("mixed"). */
  specialistModel?: "haiku" | "mixed";
}

/**
 * Junta os grupos ativos nas chamadas definidas em config.ai.specialistBundles.
 * Grupos que não estiverem em nenhum pacote viram uma chamada própria.
 */
const count = (bundle: BiasGroup[]) => bundle.reduce((n, g) => n + g.categories.filter((c) => !c.visualOnly).length, 0);

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
  const specialistEffort = input.specialistEffort ?? config.ai.effort.specialist;
  const usage = new UsageTracker();
  const wordCount = countWords(text);
  const parts = splitIntoParts(text, config.text.maxWordsPerPart);
  const boundary = newBoundary(); // código aleatório das marcações do documento
  const isClaim = source.type === "claim";

  // 1. Identificação (modelo leve)
  onProgress({ type: "stage", stage: "context" });
  const identified = await callStructured({
    label: "identificação",
    stage: "identificação",
    light: true, // tarefa simples: tipo de texto, país e contexto
    schema: TriageSchema,
    documentBlock: buildDocumentBlock(parts[0].text, source, boundary, { index: 0, total: parts.length }),
    task: triagePrompt(lang, isClaim, source.declaredType),
    effort: config.ai.effort.triage,
    maxTokens: config.ai.maxTokens.triage,
    usage,
    signal,
  });

  // Na aba "Afirmação", o tipo é sempre "afirmação" (define os grupos analisados).
  // Se o usuário escolheu o tipo do texto no formulário, ele prevalece.
  const triage: TriageOutput = isClaim
    ? { ...identified, contentType: "claim" }
    : source.declaredType
      ? { ...identified, contentType: source.declaredType, contentTypeReason: "" }
      : identified;

  // 2. Especialistas (agrupados) + visão geral (+ verificação, para afirmações), em paralelo
  const groups = activeGroups(triage);
  const bundles = buildBundles(groups);
  // A visão geral vai junto do pacote com menos categorias (ou numa chamada separada).
  const overviewHost = config.ai.overviewWithSpecialists && bundles.length > 0
    ? bundles.reduce((best, b, i, all) => (count(b) < count(all[best]) ? i : best), 0)
    : -1;
  const perPart = bundles.length + (overviewHost === -1 ? 1 : 0);
  // Imagens só com a Anthropic (o Gemini de testes não recebe imagens aqui).
  const visuals = config.visual.enabled && config.ai.provider === "anthropic" ? (input.visuals ?? []) : [];
  const total = parts.length * perPart + (isClaim ? 1 : 0) + (visuals.length ? 1 : 0);
  let done = 0;
  // Texto longo: as chamadas passam do limite por minuto da IA e vão em fila (mais lento, mas não falha).
  let note: "long" | "waiting" | undefined =
    countWords(text) > config.text.longTextWords ? "long" : undefined;
  onProgress({ type: "stage", stage: "analyzing", done, total, note });
  const tick = () => {
    done++;
    onProgress({ type: "stage", stage: "analyzing", done, total, note });
  };
  const onWait = () => {
    if (note === "waiting") return;
    note = note ?? "waiting";
    onProgress({ type: "stage", stage: "analyzing", done, total, note });
  };

  const tasks: (() => Promise<{ part: number; groupId: string | null; output: unknown }>)[] = [];
  parts.forEach((part, partIndex) => {
    const documentBlock = buildDocumentBlock(part.text, source, boundary, { index: partIndex, total: parts.length });
    bundles.forEach((bundle, bundleIndex) => {
      // Categorias "só de imagem" ficam com a etapa "Imagens e gráficos".
      const ids = bundle.flatMap((g) => g.categories.filter((c) => !c.visualOnly).map((c) => c.id)) as [string, ...string[]];
      const withOverview = bundleIndex === overviewHost;
      tasks.push(async () => {
        const output = await callStructured({
          label: `especialistas ${bundle.map((g) => g.id).join("+")}${withOverview ? " + visão geral" : ""} (parte ${partIndex + 1})`,
          stage: "especialistas",
          schema: withOverview ? specialistWithOverviewSchema(ids) : specialistSchema(ids),
          documentBlock,
          task: specialistPrompt(bundle, triage, lang, withOverview),
          effort: specialistEffort,
          light: input.specialistModel === "haiku" || (input.specialistModel === "mixed" && !withOverview),
          maxTokens: config.ai.maxTokens.specialist + (withOverview ? config.ai.maxTokens.overview : 0), // limitado a 21.000 em client.ts
          usage,
          signal,
          onWait,
        });
        tick();
        return { part: partIndex, groupId: "__bundle__", output };
      });
    });
    if (overviewHost !== -1) return;
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

  // Imagens e gráficos: em paralelo com os especialistas.
  let visualOutput = null as VisualOutput | null;
  if (visuals.length) {
    tasks.push(async () => {
      try {
        const ids = visuals.map((v) => v.id) as [string, ...string[]];
        const active = new Set(activeGroups(triage).flatMap((g) => g.categories.map((c) => c.id)));
        const catIds = IMAGE_CATEGORY_IDS.filter((id) => active.has(id)) as unknown as [string, ...string[]];
        visualOutput = await callStructured({
          label: `imagens e gráficos (${visuals.length})`,
          stage: "imagens",
          schema: visualSchema(ids, catIds),
          documentBlock: buildDocumentBlock(visualContext(text), source, boundary, { index: 0, total: 1 }),
          task: visualPrompt(triage, visuals.map(figureLabel).join("\n"), lang, catIds),
          images: toCallImages(visuals),
          effort: config.visual.effort,
          maxTokens: config.visual.maxTokens,
          usage,
          signal,
          onWait,
        });
      } catch (err) {
        // As imagens são um complemento: se falharem, o resto da análise continua.
        if (signal?.aborted) throw err;
        console.warn("[unslant] imagens e gráficos falhou:", err instanceof AppError ? `${err.code} ${err.detail ?? ""}` : err);
      }
      tick();
      return { part: -1, groupId: "__visual__", output: null };
    });
  }

  const outputs = await runLimited(tasks, config.ai.maxParallelRequests[config.ai.provider]);

  const rawParts: RawPart[] = parts.map((p, i) => {
    const specialists: Record<string, SpecialistOutput> = {};
    let overview: RawPart["overview"] | undefined;
    for (const o of outputs.filter((x) => x.part === i)) {
      if (o.groupId === "__bundle__") {
        const out = o.output as SpecialistOutput & { overview?: RawPart["overview"] };
        if (out.overview) overview = out.overview;
        // Separa as categorias de cada chamada agrupada por grupo da taxonomia.
        for (const cat of out.categories) {
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
  const visual = visuals.length ? { inputs: visuals, output: visualOutput } : null;
  const findings = buildFindings(text, triage, rawParts, lang, visual);

  // 4. Síntese + busca de textos para equilibrar, ao mesmo tempo
  onProgress({ type: "stage", stage: "balancing" });

  const runSynthesis = (retryNote = "") =>
    callStructured({
      label: "síntese",
      stage: "síntese",
      light: true, // modelo mais barato: só resume o que os especialistas encontraram
      schema: SynthesisSchema,
      task: synthesisPrompt(findingsForSynthesis(triage, findings, text, lang), lang, retryNote),
      effort: config.ai.effort.synthesis,
      maxTokens: config.ai.maxTokens.synthesis,
      usage,
      signal,
    });

  // Trechos do próprio autor com problema pelo menos moderado (os únicos que podem ganhar versão neutra).
  const hasRewriteCandidates = rewriteCandidates(findings, text).size > 0;

  const blankRewrite = (out: SynthesisOutput): SynthesisOutput => ({ ...out, rewrite: { evidenceId: "", rewritten: "", explanation: "" } });
  // Confere a síntese: a versão neutra não pode inventar nada e o resumo precisa usar a intensidade certa.
  const synthesisProblem = (out: SynthesisOutput) => {
    const rw = rewriteProblem(findings, out, text);
    if (rw) return { kind: "rewrite" as const, note: `a versão neutra ${rw}. Isso é proibido: reescreva usando só o que está no trecho original.` };
    const sm = summaryProblem(findings, out);
    if (sm) return { kind: "summary" as const, note: `o resumo ${sm}.` };
    return null;
  };
  let rewriteDiscarded = false;

  const synthesisTask = (async (): Promise<SynthesisOutput | null> => {
    try {
      let out = await runSynthesis();
      if (!hasRewriteCandidates) out = blankRewrite(out);
      let problem = synthesisProblem(out);
      if (problem) {
        console.warn(`[unslant] síntese refeita: ${problem.note}`);
        out = await runSynthesis(`na tentativa anterior ${problem.note}`);
        if (!hasRewriteCandidates) out = blankRewrite(out);
        problem = synthesisProblem(out);
        if (problem?.kind === "rewrite") {
          console.warn(`[unslant] versão neutra descartada: ${problem.note}`);
          rewriteDiscarded = true;
          out = blankRewrite(out);
        } else if (problem) {
          console.warn(`[unslant] resumo mantido apesar do aviso: ${problem.note}`);
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
      const promptParams = {
        triage,
        economic: findings.political.economic,
        social: findings.political.social,
        dispute: findings.political.dispute,
        omissions: findings.omissions.map((o) => o.title),
        originalOutlet: source.outlet,
        title: source.title || triage.title,
        lang,
      };
      // Para que lado o texto pende e quais veículos são "do outro lado" (lib/veiculos.ts).
      const cp = counterpartsFor(triage.countryCode, leaningOf(findings.political.economic.position, findings.political.social.position));
      const params = { ...promptParams, counterparts: cp?.names };
      const { data, diagnostics, lineSource } = await searchBalance({
        task: balancePrompt(params),
        retryTask: balancePrompt({ ...params, retry: true }),
        counterpart: cp ? { domains: cp.domains, lines: cp.lines, task: balancePrompt({ ...params, targeted: true }) } : undefined,
        countryCode: triage.countryCode,
        originalUrl: source.url,
        usage,
        signal,
      });
      return { status: "ok", data, diagnostics, lineSource };
    } catch (err) {
      // A busca é um complemento: se falhar, o resto da análise continua valendo.
      if (signal?.aborted) throw err;
      console.warn("[unslant] busca para equilibrar falhou:", err instanceof AppError ? `${err.code} ${err.detail ?? ""}` : err);
      // Para o navegador vai só o código do erro; o detalhe fica no terminal do servidor.
      const reason = err instanceof AppError ? err.code : "UNKNOWN";
      return {
        status: "unavailable",
        data: null,
        diagnostics: { rounds: 0, queries: [], resultsFound: 0, proposed: 0, discarded: [], models: [], notes: [`falhou: ${reason}`] },
      };
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
    rewriteDiscarded,
    visual,
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
      ...(input.specialistEffort ? { specialistEffort: input.specialistEffort } : {}),
      ...(input.specialistModel ? { specialistModel: input.specialistModel } : {}),
      fromCache: false,
    },
  });
}
