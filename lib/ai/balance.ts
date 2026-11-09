/**
 * BUSCA NA WEB para a seção "Para equilibrar sua leitura".
 *
 * 1. A IA faz buscas (Anthropic: ferramenta web_search; Gemini: Google Search).
 * 2. Guardamos a lista de TODOS os resultados reais que a busca devolveu.
 * 3. A IA escolhe os melhores e explica por que equilibram a leitura.
 * 4. Conferência: só ficam links que estavam nos resultados reais da busca
 *    (a IA não consegue "inventar" um link) e nunca o veículo original.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { BalanceSchema, type BalanceOutput } from "@/lib/analysis/schemas";
import { callStructured, getClient, mapApiError, type UsageTracker } from "./client";
import { addGeminiUsage, geminiModel, getGemini, isBlocked, withRetry } from "./gemini";

type Found = Map<string, { url: string; title: string }>;

interface SearchOptions {
  task: string;
  countryCode?: string;
  /** Endereço do texto original (o veículo dele fica de fora). */
  originalUrl?: string;
  usage: UsageTracker;
  signal?: AbortSignal;
}

/** Forma padronizada de um link, para comparar (sem "www", "#…" e "/" final). */
function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    return `${host}${u.pathname.replace(/\/+$/, "")}${u.search}`;
  } catch {
    return null;
  }
}

function hostOf(raw: string): string | null {
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
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

async function searchWithAnthropic(opts: SearchOptions, blockedHost: string | null, found: Found): Promise<string> {
  const anthropic = getClient();
  const country = /^[A-Za-z]{2}$/.test(opts.countryCode ?? "") ? opts.countryCode!.toUpperCase() : undefined;
  const tool: Anthropic.Beta.BetaWebSearchTool20260209 = {
    type: "web_search_20260209",
    name: "web_search",
    max_uses: config.balance.maxSearches,
    ...(blockedHost ? { blocked_domains: [blockedHost] } : {}),
    ...(country ? { user_location: { type: "approximate" as const, country } } : {}),
  };

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.task }];
  let finalText = "";

  // A busca pode "pausar" no meio (pause_turn); nesse caso continuamos de onde parou.
  for (let round = 0; round < 4; round++) {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await anthropic.beta.messages.create(
        {
          model: config.ai.models.anthropic,
          max_tokens: config.balance.maxTokens,
          system: SYSTEM_PROMPT,
          messages,
          tools: [tool],
          output_config: { effort: config.balance.effort },
          ...(config.ai.useRefusalFallback
            ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
            : {}),
        },
        { signal: opts.signal },
      );
    } catch (err) {
      throw mapApiError(err);
    }
    opts.usage.add(response.usage);

    for (const block of response.content) {
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
  return finalText;
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

async function searchWithGemini(opts: SearchOptions, found: Found): Promise<string> {
  const ai = getGemini();
  const res = await withRetry(
    () =>
      ai.models.generateContent({
        model: geminiModel(),
        contents: opts.task,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ googleSearch: {} }],
          maxOutputTokens: config.balance.maxTokens,
          abortSignal: opts.signal,
        },
      }),
    opts.signal,
  );
  addGeminiUsage(opts.usage, res);
  if (isBlocked(res)) throw new AppError("AI_REFUSAL", "busca (Gemini)");

  const meta = res.candidates?.[0]?.groundingMetadata;
  opts.usage.webSearches += meta?.webSearchQueries?.length ?? 0;

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
  return res.text ?? "";
}

/* ------------------------------------------------- busca + conferência */

export async function searchBalance(opts: SearchOptions): Promise<BalanceOutput> {
  const blockedHost = opts.originalUrl ? hostOf(opts.originalUrl) : null;
  const found: Found = new Map();

  const finalText =
    config.ai.provider === "gemini"
      ? await searchWithGemini(opts, found)
      : await searchWithAnthropic(opts, blockedHost, found);

  // Lê a resposta. Se veio fora do formato, uma chamada barata (sem busca) organiza.
  const parsed = BalanceSchema.safeParse(extractJson(finalText));
  let data: BalanceOutput;
  if (parsed.success) {
    data = parsed.data;
  } else {
    const list = [...found.values()].map((r) => `- ${r.title} | ${r.url}`).join("\n");
    data = await callStructured({
      label: "formatar busca",
      schema: BalanceSchema,
      task: `Organize a resposta abaixo no formato pedido. Use SOMENTE links desta lista de resultados reais:\n<resultados>\n${list.replace(/</g, "‹")}\n</resultados>\n\nResposta a organizar:\n<resultados>\n${finalText.slice(0, 8000).replace(/</g, "‹")}\n</resultados>`,
      effort: "low",
      maxTokens: 4_000,
      usage: opts.usage,
      signal: opts.signal,
    });
  }

  // Índice por site, para quando a IA cita o site certo com o endereço levemente diferente.
  const byHost = new Map<string, { url: string; title: string }[]>();
  for (const r of found.values()) {
    const h = hostOf(r.url);
    if (h) byHost.set(h, [...(byHost.get(h) ?? []), r]);
  }

  // Conferência: só links que vieram da busca, sem repetir e sem o veículo original.
  const seen = new Set<string>();
  const articles = data.articles
    .map((a) => {
      const key = normalizeUrl(a.url);
      let real = key ? found.get(key) : undefined;
      if (!real) {
        // Aceita só se aquele site tiver exatamente UM resultado real na busca.
        const sameHost = byHost.get(hostOf(a.url) ?? "") ?? [];
        if (sameHost.length === 1) real = sameHost[0];
      }
      const realKey = real ? normalizeUrl(real.url) : null;
      if (!real || !realKey || seen.has(realKey)) return null;
      if (blockedHost && hostOf(real.url) === blockedHost) return null;
      seen.add(realKey);
      return { ...a, url: real.url, title: a.title.trim() || real.title };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .slice(0, config.balance.maxArticles);

  const discarded = data.articles.length - articles.length;
  if (discarded > 0) console.warn(`[unslant] busca: ${discarded} link(s) descartado(s) por não virem da busca`);

  return { articles, suggestions: data.suggestions.slice(0, 4) };
}
