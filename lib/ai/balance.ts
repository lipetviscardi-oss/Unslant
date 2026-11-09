/**
 * BUSCA NA WEB para a seção "Para equilibrar sua leitura".
 *
 * 1. A IA faz buscas com a ferramenta de busca da Anthropic.
 * 2. Guardamos a lista de TODOS os resultados que a busca devolveu.
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

export async function searchBalance(opts: {
  task: string;
  countryCode?: string;
  /** Endereço do texto original (o veículo dele fica de fora). */
  originalUrl?: string;
  usage: UsageTracker;
  signal?: AbortSignal;
}): Promise<BalanceOutput> {
  const anthropic = getClient();
  const blockedHost = opts.originalUrl ? hostOf(opts.originalUrl) : null;
  const country = /^[A-Za-z]{2}$/.test(opts.countryCode ?? "") ? opts.countryCode!.toUpperCase() : undefined;

  const tool: Anthropic.Beta.BetaWebSearchTool20260209 = {
    type: "web_search_20260209",
    name: "web_search",
    max_uses: config.balance.maxSearches,
    ...(blockedHost ? { blocked_domains: [blockedHost] } : {}),
    ...(country ? { user_location: { type: "approximate" as const, country } } : {}),
  };

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.task }];
  const found = new Map<string, { url: string; title: string }>();
  let finalText = "";

  // A busca pode "pausar" no meio (pause_turn); nesse caso continuamos de onde parou.
  for (let round = 0; round < 4; round++) {
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await anthropic.beta.messages.create(
        {
          model: config.ai.model,
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

  // Conferência: só links que vieram da busca, sem repetir e sem o veículo original.
  const seen = new Set<string>();
  const articles = data.articles
    .map((a) => {
      const key = normalizeUrl(a.url);
      const real = key ? found.get(key) : undefined;
      if (!key || !real || seen.has(key)) return null;
      if (blockedHost && hostOf(real.url) === blockedHost) return null;
      seen.add(key);
      return { ...a, url: real.url, title: a.title.trim() || real.title };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .slice(0, config.balance.maxArticles);

  const discarded = data.articles.length - articles.length;
  if (discarded > 0) console.warn(`[unslant] busca: ${discarded} link(s) descartado(s) por não virem da busca`);

  return { articles, suggestions: data.suggestions.slice(0, 4) };
}
