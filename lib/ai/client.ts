/**
 * Conversa com a IA (Anthropic). Este arquivo só roda no servidor: a chave
 * da API nunca chega ao navegador.
 *
 * Cada chamada:
 *  - pede a resposta num formato fixo (structured outputs + zod);
 *  - se a resposta vier fora do formato ou incompleta, tenta mais UMA vez;
 *  - soma os tokens usados, para estimar o custo da análise.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { config, type Effort } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

let client: Anthropic | null = null;

export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AppError("MISSING_API_KEY");
  // maxRetries: a própria biblioteca repete automaticamente erros temporários
  // (sobrecarga, limite de velocidade, falha de conexão).
  client ??= new Anthropic({ maxRetries: 3 });
  return client;
}

/** Soma os tokens de todas as chamadas de uma análise. */
export class UsageTracker {
  inputTokens = 0;
  outputTokens = 0;
  cacheReadTokens = 0;
  cacheWriteTokens = 0;
  webSearches = 0;

  add(usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
    server_tool_use?: { web_search_requests?: number | null } | null;
  }) {
    this.webSearches += usage.server_tool_use?.web_search_requests ?? 0;
    this.inputTokens += usage.input_tokens ?? 0;
    this.outputTokens += usage.output_tokens ?? 0;
    this.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
    this.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
  }

  costUsd(model: string) {
    const p = config.pricing[model];
    if (!p) return 0;
    const cost =
      (this.inputTokens * p.input +
        this.outputTokens * p.output +
        this.cacheReadTokens * p.cacheRead +
        this.cacheWriteTokens * p.cacheWrite) /
        1_000_000 +
      this.webSearches * config.webSearchPrice;
    return Math.round(cost * 10000) / 10000;
  }
}

export interface StructuredCallOptions<T extends z.ZodType> {
  /** Nome da etapa, só para mensagens no terminal. */
  label: string;
  schema: T;
  /** Bloco do documento (fica em cache entre as etapas). Omitir na síntese. */
  documentBlock?: string;
  /** Instruções específicas da etapa. */
  task: string;
  effort: Effort;
  maxTokens: number;
  usage: UsageTracker;
  signal?: AbortSignal;
}

export async function callStructured<T extends z.ZodType>(opts: StructuredCallOptions<T>): Promise<z.infer<T>> {
  const anthropic = getClient();

  const content: Anthropic.Beta.BetaTextBlockParam[] = [];
  if (opts.documentBlock) {
    // cache_control: guarda o documento por alguns minutos; as próximas
    // etapas pagam ~10% do preço normal por essa parte.
    content.push({ type: "text", text: opts.documentBlock, cache_control: { type: "ephemeral" } });
  }
  content.push({ type: "text", text: opts.task });

  const maxAttempts = 2; // a tentativa original + 1 nova tentativa
  let lastProblem = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response;
    try {
      response = await anthropic.beta.messages.parse(
        {
          model: config.ai.model,
          max_tokens: opts.maxTokens,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
          output_config: {
            effort: opts.effort,
            format: betaZodOutputFormat(opts.schema),
          },
          // Se o modelo recusar por regra de segurança, a Anthropic tenta
          // automaticamente com o modelo alternativo recomendado.
          ...(config.ai.useRefusalFallback
            ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
            : {}),
        },
        { signal: opts.signal },
      );
    } catch (err) {
      // Resposta fora do formato combinado: o zod recusou.
      if (err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError)) {
        lastProblem = `formato inválido: ${err.message.slice(0, 300)}`;
        console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
        continue;
      }
      throw mapApiError(err);
    }

    opts.usage.add(response.usage);

    if (response.stop_reason === "refusal") {
      throw new AppError("AI_REFUSAL", `${opts.label}: ${response.stop_details?.category ?? "sem categoria"}`);
    }
    if (response.stop_reason === "max_tokens") {
      lastProblem = "resposta cortada (limite de tamanho atingido)";
      console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
      continue;
    }
    if (response.parsed_output == null) {
      lastProblem = "resposta vazia";
      console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
      continue;
    }
    return response.parsed_output as z.infer<T>;
  }

  throw new AppError("AI_BAD_RESPONSE", `${opts.label}: ${lastProblem}`);
}

/** Traduz erros da biblioteca da Anthropic para mensagens do unslant. */
export function mapApiError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Anthropic.APIUserAbortError) return new AppError("AI_ERROR", "cancelado pelo usuário");
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new AppError("AI_AUTH", err.message);
  }
  if (err instanceof Anthropic.RateLimitError) return new AppError("AI_RATE_LIMIT", err.message);
  if (err instanceof Anthropic.BadRequestError) {
    // Única exceção à regra de não comparar textos de erro: a falta de
    // créditos chega como erro genérico e merece uma mensagem própria.
    if (/credit balance/i.test(err.message)) return new AppError("AI_NO_CREDIT", err.message);
    return new AppError("AI_ERROR", `400: ${err.message}`);
  }
  if (err instanceof Anthropic.InternalServerError) return new AppError("AI_OVERLOADED", err.message);
  if (err instanceof Anthropic.APIConnectionError) return new AppError("AI_ERROR", `conexão: ${err.message}`);
  if (err instanceof Anthropic.APIError) return new AppError("AI_ERROR", `${err.status}: ${err.message}`);
  return new AppError("AI_ERROR", err instanceof Error ? err.message : String(err));
}

/** Executa tarefas com no máximo `limit` ao mesmo tempo. */
export async function runLimited<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
