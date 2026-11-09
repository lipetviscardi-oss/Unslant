/**
 * BUSCA NA WEB para a seção "Para equilibrar sua leitura".
 *
 * 1. A IA faz buscas (Anthropic: ferramenta web_search; Gemini: Google Search).
 * 2. Guardamos a lista de TODOS os resultados reais que a busca devolveu.
 * 3. A IA escolhe os melhores e explica por que equilibram a leitura.
 * 4. Conferência: só ficam links que estavam nos resultados reais da busca
 *    (a IA não consegue "inventar" um link) e nunca o veículo original.
 * 5. Se sobrarem menos de 2 textos, fazemos uma segunda rodada de buscas com
 *    termos mais objetivos (nomes dos envolvidos + o fato principal).
 *
 * Cada análise guarda um diagnóstico da busca (termos buscados, resultados,
 * links descartados), que aparece no comando "npm run comparar".
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { BalanceSchema, type BalanceOutput } from "@/lib/analysis/schemas";
import type { BalanceDiagnostics } from "@/lib/analysis/types";
import { callStructured, getClient, mapApiError, type UsageTracker } from "./client";
import { addGeminiUsage, geminiModel, getGemini, isBlocked, withRetry } from "./gemini";

type Found = Map<string, { url: string; title: string }>;

interface SearchOptions {
  /** Instruções da primeira rodada. */
  task: string;
  /** Instruções da segunda rodada (termos mais objetivos), usada se a primeira render pouco. */
  retryTask: string;
  countryCode?: string;
  /** Endereço do texto original (o veículo dele fica de fora). */
  originalUrl?: string;
  usage: UsageTracker;
  signal?: AbortSignal;
}

interface RoundResult {
  text: string;
  queries: string[];
  model: string;
}

/** Parâmetros de rastreamento que não mudam a página (ignorados na comparação). */
const TRACKING_PARAMS = /^(utm_\w+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|cmpid|origin|amp|outputType)$/i;

/**
 * Forma padronizada de um link, para comparar: sem "www."/"m."/"amp.", sem
 * "#…", sem parâmetros de rastreamento, sem versão AMP e sem "/" final.
 */
function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/^(www|m|amp)\./, "");
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !TRACKING_PARAMS.test(k))
      .sort(([a], [b]) => a.localeCompare(b));
    const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";
    const path = u.pathname.replace(/\/amp\/?$/i, "").replace(/\.amp(\.html)?$/i, "$1").replace(/\/+$/, "");
    return `${host}${path}${query}`;
  } catch {
    return null;
  }
}

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^(www|m|amp)\./, "");
  } catch {
    return null;
  }
}

/** Extrai o primeiro objeto JSON de um texto. */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ Anthropic */

/** Uma rodada de buscas com um modelo específico. */
async function anthropicRound(
  task: string,
  model: string,
  opts: SearchOptions,
  blockedHost: string | null,
  found: Found,
): Promise<RoundResult> {
  const anthropic = getClient();
  const country = /^[A-Za-z]{2}$/.test(opts.countryCode ?? "") ? opts.countryCode!.toUpperCase() : undefined;
  const isLight = model === config.ai.lightModel;
  // O Haiku usa a versão básica da ferramenta; os modelos maiores, a versão com filtragem.
  const tool = {
    type: isLight ? ("web_search_20250305" as const) : ("web_search_20260209" as const),
    name: "web_search" as const,
    max_uses: config.balance.maxSearches,
    ...(blockedHost ? { blocked_domains: [blockedHost] } : {}),
    ...(country ? { user_location: { type: "approximate" as const, country } } : {}),
  } as Anthropic.Beta.BetaWebSearchTool20250305 | Anthropic.Beta.BetaWebSearchTool20260209;

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: task }];
  const queries: string[] = [];
  let finalText = "";

  // A busca pode "pausar" no meio (pause_turn); nesse caso continuamos de onde parou.
  for (let round = 0; round < 4; round++) {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await anthropic.beta.messages.create(
        {
          model,
          max_tokens: config.balance.maxTokens,
          // cache_control: as instruções fixas ficam guardadas entre análises
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages,
          tools: [tool],
          output_config: { effort: config.balance.effort },
          ...(config.ai.useRefusalFallback && !isLight
            ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
            : {}),
        },
        { signal: opts.signal },
      );
    } catch (err) {
      throw mapApiError(err);
    }
    opts.usage.add(response.usage, "busca", model);

    for (const block of response.content) {
      if (block.type === "server_tool_use" && block.name === "web_search") {
        const q = (block.input as { query?: unknown })?.query;
        if (typeof q === "string") queries.push(q);
      }
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content) {
          const key = normalizeUrl(r.url);
          if (key) found.set(key, { url: r.url, title: r.title });
        }
      }
      if (block.type === "text") finalText += block.text;
    }

    if (response.stop_reason === "refusal") throw new AppError("AI_REFUSAL", "busca");
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      finalText = "";
      continue;
    }
    break;
  }
  return { text: finalText, queries, model };
}

/** Rodada de busca na Anthropic: tenta o modelo leve; se ele for recusado, usa o principal. */
async function searchWithAnthropic(
  task: string,
  opts: SearchOptions,
  blockedHost: string | null,
  found: Found,
  diag: BalanceDiagnostics,
): Promise<RoundResult> {
  if (config.balance.useLightModel) {
    try {
      return await anthropicRound(task, config.ai.lightModel, opts, blockedHost, found);
    } catch (err) {
      // Só voltamos ao modelo principal em erros de configuração (não em cancelamento ou falta de crédito).
      if (!(err instanceof AppError) || err.code !== "AI_ERROR" || opts.signal?.aborted) throw err;
      diag.notes.push("modelo leve recusado; usando o principal (detalhes no terminal do servidor)");
      console.warn("[unslant] busca: modelo leve recusado, usando o principal:", err.detail);
    }
  }
  return anthropicRound(task, config.ai.models.anthropic, opts, blockedHost, found);
}

/* --------------------------------------------------------------- Gemini */

/**
 * O Gemini devolve links "de passagem" do Google. Abrimos cada um (sem
 * baixar a página) só para descobrir o endereço real para onde ele leva.
 */
const GOOGLE_REDIRECT_HOST = "vertexaisearch.cloud.google.com";

async function resolveRedirect(uri: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }
  // Segurança: só abrimos o endereço de redirecionamento do Google, nunca outro.
  if (parsed.protocol !== "https:" || parsed.hostname !== GOOGLE_REDIRECT_HOST) {
    // Um link comum é guardado como está, sem ser acessado.
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  }
  try {
    const res = await fetch(parsed, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(6_000) });
    const location = res.headers.get("location");
    await res.body?.cancel();
    if (location) return new URL(location, uri).toString();
    return res.ok ? uri : null;
  } catch {
    return null;
  }
}

async function searchWithGemini(task: string, opts: SearchOptions, found: Found): Promise<RoundResult> {
  const ai = getGemini();
  const res = await withRetry(
    () =>
      ai.models.generateContent({
        model: geminiModel(),
        contents: task,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
          maxOutputTokens: config.balance.maxTokens,
          abortSignal: opts.signal,
        },
      }),
    opts.signal,
  );
  const meta = res.candidates?.[0]?.groundingMetadata;
  addGeminiUsage(opts.usage, res, "busca", meta?.webSearchQueries?.length ?? 0);
  if (isBlocked(res)) throw new AppError("AI_REFUSAL", "busca (Gemini)");

  const chunks = (meta?.groundingChunks ?? [])
    .map((c) => c.web)
    .filter((w): w is { uri: string; title?: string } => Boolean(w?.uri))
    .slice(0, 20);
  const resolved = await Promise.all(chunks.map((w) => resolveRedirect(w.uri)));
  resolved.forEach((url, i) => {
    if (!url) return;
    const key = normalizeUrl(url);
    if (key && hostOf(url) !== GOOGLE_REDIRECT_HOST) {
      found.set(key, { url, title: chunks[i].title ?? "" });
    }
  });
  return { text: res.text ?? "", queries: meta?.webSearchQueries ?? [], model: geminiModel() };
}

/* ------------------------------------------------- busca + conferência */

/** Lê a resposta da IA; se veio fora do formato, uma chamada barata (sem busca) organiza. */
async function parseProposal(text: string, found: Found, opts: SearchOptions): Promise<BalanceOutput> {
  const parsed = BalanceSchema.safeParse(extractJson(text));
  if (parsed.success) return parsed.data;
  const list = [...found.values()].map((r) => `- ${r.title} | ${r.url}`).join("\n");
  return callStructured({
    label: "formatar busca",
    stage: "formatar busca",
    light: true,
    schema: BalanceSchema,
    task: `Organize a resposta abaixo no formato pedido. Use SOMENTE links desta lista de resultados reais:\n<resultados>\n${list.replace(/</g, "‹")}\n</resultados>\n\nResposta a organizar:\n<resultados>\n${text.slice(0, 8000).replace(/</g, "‹")}\n</resultados>`,
    effort: "low",
    maxTokens: 4_000,
    usage: opts.usage,
    signal: opts.signal,
  });
}

/** Confere os links propostos contra os resultados reais da busca. */
function verifyArticles(
  proposal: BalanceOutput,
  found: Found,
  blockedHost: string | null,
  seen: Set<string>,
  diag: BalanceDiagnostics,
): BalanceOutput["articles"] {
  // Índice por site, para quando a IA cita o site certo com o endereço levemente diferente.
  const byHost = new Map<string, { url: string; title: string }[]>();
  for (const r of found.values()) {
    const h = hostOf(r.url);
    if (h) byHost.set(h, [...(byHost.get(h) ?? []), r]);
  }

  const kept: BalanceOutput["articles"] = [];
  for (const a of proposal.articles) {
    diag.proposed++;
    const key = normalizeUrl(a.url);
    let real = key ? found.get(key) : undefined;
    if (!real) {
      // Aceita só se aquele site tiver exatamente UM resultado real na busca.
      const sameHost = byHost.get(hostOf(a.url) ?? "") ?? [];
      if (sameHost.length === 1) real = sameHost[0];
    }
    if (!real) {
      diag.discarded.push({ url: a.url, reason: "não veio da busca" });
      continue;
    }
    const realKey = normalizeUrl(real.url)!;
    if (seen.has(realKey)) {
      diag.discarded.push({ url: a.url, reason: "repetido" });
      continue;
    }
    if (blockedHost && hostOf(real.url) === blockedHost) {
      diag.discarded.push({ url: a.url, reason: "mesmo veículo do texto original" });
      continue;
    }
    seen.add(realKey);
    kept.push({ ...a, url: real.url, title: a.title.trim() || real.title });
  }
  return kept;
}

export async function searchBalance(opts: SearchOptions): Promise<{ data: BalanceOutput; diagnostics: BalanceDiagnostics }> {
  const blockedHost = opts.originalUrl ? hostOf(opts.originalUrl) : null;
  const found: Found = new Map();
  const seen = new Set<string>();
  const diag: BalanceDiagnostics = { rounds: 0, queries: [], resultsFound: 0, proposed: 0, discarded: [], models: [], notes: [] };

  const runRound = async (task: string) => {
    diag.rounds++;
    const r =
      config.ai.provider === "gemini"
        ? await searchWithGemini(task, opts, found)
        : await searchWithAnthropic(task, opts, blockedHost, found, diag);
    diag.queries.push(...r.queries);
    if (!diag.models.includes(r.model)) diag.models.push(r.model);
    return r;
  };

  // 1ª rodada
  const first = await runRound(opts.task);
  const proposal1 = await parseProposal(first.text, found, opts);
  let articles = verifyArticles(proposal1, found, blockedHost, seen, diag);
  let suggestions = proposal1.suggestions;

  // 2ª rodada, com termos mais objetivos, se a primeira rendeu pouco
  if (articles.length < 2) {
    diag.notes.push(`1ª rodada rendeu ${articles.length} texto(s); fazendo 2ª rodada`);
    const second = await runRound(opts.retryTask);
    const proposal2 = await parseProposal(second.text, found, opts);
    articles = [...articles, ...verifyArticles(proposal2, found, blockedHost, seen, diag)];
    if (suggestions.length === 0) suggestions = proposal2.suggestions;
  }

  diag.resultsFound = found.size;
  if (diag.discarded.length) {
    console.warn(`[unslant] busca: ${diag.discarded.length} link(s) descartado(s):`, diag.discarded);
  }
  return {
    data: { articles: articles.slice(0, config.balance.maxArticles), suggestions: suggestions.slice(0, 4) },
    diagnostics: diag,
  };
}
