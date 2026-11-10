/**
 * Conversa com a IA. Por padrão, com a Anthropic; se config.ai.provider for
 * "gemini", as chamadas vão para lib/ai/gemini.ts. Este arquivo só roda no servidor: a chave
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
import { callStructuredGemini } from "./gemini";
import type { StageCost } from "@/lib/analysis/types";

let client: Anthropic | null = null;


/** Maior limite de resposta aceito pela biblioteca sem streaming (128.000 ÷ 6, arredondado para baixo). */
const MAX_NONSTREAMING_TOKENS = 21_000;
export function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AppError("MISSING_API_KEY");
  // maxRetries: a própria biblioteca repete automaticamente erros temporários
  // (sobrecarga, limite de velocidade, falha de conexão).
  client ??= new Anthropic({ maxRetries: 3 });
  return client;
}

/** Soma os tokens e o custo de cada etapa de uma análise. */
export class UsageTracker {
  stages: Record<string, StageCost> = {};

  /** Registra uso já convertido (usado pelo Gemini e pela busca). */
  addRaw(
    stage: string,
    model: string,
    u: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number; webSearches?: number },
  ) {
    const s = (this.stages[stage] ??= {
      calls: 0,
      model,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      webSearches: 0,
      costUsd: 0,
    });
    s.calls++;
    // Uma etapa pode usar mais de um modelo (ex.: busca que cai do Haiku para o Sonnet).
    if (!s.model.split(" + ").includes(model)) s.model += ` + ${model}`;
    s.inputTokens += u.input ?? 0;
    s.outputTokens += u.output ?? 0;
    s.cacheReadTokens += u.cacheRead ?? 0;
    s.cacheWriteTokens += u.cacheWrite ?? 0;
    s.webSearches += u.webSearches ?? 0;
    // Custo somado chamada a chamada, cada uma com o preço do seu modelo.
    const p = config.pricing[model];
    s.costUsd +=
      (p
        ? ((u.input ?? 0) * p.input + (u.output ?? 0) * p.output + (u.cacheRead ?? 0) * p.cacheRead + (u.cacheWrite ?? 0) * p.cacheWrite) /
          1_000_000
        : 0) + (u.webSearches ?? 0) * config.webSearchPrice;
  }

  /** Registra o uso devolvido pela API da Anthropic. */
  add(
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number | null;
      cache_creation_input_tokens?: number | null;
      server_tool_use?: { web_search_requests?: number | null } | null;
    },
    stage: string,
    model: string,
  ) {
    this.addRaw(stage, model, {
      input: usage.input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      cacheRead: usage.cache_read_input_tokens ?? 0,
      cacheWrite: usage.cache_creation_input_tokens ?? 0,
      webSearches: usage.server_tool_use?.web_search_requests ?? 0,
    });
  }

  private sum(key: keyof Omit<StageCost, "model">) {
    return Object.values(this.stages).reduce((t, s) => t + (s[key] as number), 0);
  }
  get inputTokens() { return this.sum("inputTokens"); }
  get outputTokens() { return this.sum("outputTokens"); }
  get cacheReadTokens() { return this.sum("cacheReadTokens"); }
  get cacheWriteTokens() { return this.sum("cacheWriteTokens"); }
  get webSearches() { return this.sum("webSearches"); }

  /** Custo total estimado, em dólares. */
  costUsd() {
    return Math.round(this.sum("costUsd") * 10000) / 10000;
  }

  /** Resumo por etapa, para guardar no resultado e mostrar no terminal. */
  report(): Record<string, StageCost> {
    const out: Record<string, StageCost> = {};
    for (const [k, v] of Object.entries(this.stages)) out[k] = { ...v, costUsd: Math.round(v.costUsd * 10000) / 10000 };
    return out;
  }
}

export interface StructuredCallOptions<T extends z.ZodType> {
  /** Nome da chamada, só para mensagens no terminal. */
  label: string;
  /** Etapa à qual o custo é somado (ex.: "especialistas"). */
  stage: string;
  /** true = usa o modelo mais barato (config.ai.lightModel). Só Anthropic. */
  light?: boolean;
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

/** Chamada estruturada: vai para a IA escolhida em config.ai.provider. */
export async function callStructured<T extends z.ZodType>(opts: StructuredCallOptions<T>): Promise<z.infer<T>> {
  if (config.ai.provider === "gemini") return callStructuredGemini(opts);
  return callStructuredAnthropic(opts);
}

async function callStructuredAnthropic<T extends z.ZodType>(opts: StructuredCallOptions<T>): Promise<z.infer<T>> {
  const anthropic = getClient();
  const model = opts.light ? config.ai.lightModel : config.ai.models.anthropic;
  // O modelo leve (Haiku) não tem troca automática em caso de recusa.
  const useFallback = config.ai.useRefusalFallback && !opts.light;

  const content: Anthropic.Beta.BetaTextBlockParam[] = [];
  if (opts.documentBlock) {
    // cache_control: guarda o documento por alguns minutos; as próximas
    // etapas pagam ~10% do preço normal por essa parte.
    content.push(
      config.ai.cacheDocument
        ? { type: "text", text: opts.documentBlock, cache_control: { type: "ephemeral" } }
        : { type: "text", text: opts.documentBlock },
    );
  }
  content.push({ type: "text", text: opts.task });

  // A biblioteca da Anthropic recusa pedidos sem "streaming" acima de ~21.333
  // tokens de resposta (antes mesmo de enviar). Nossas respostas são bem
  // menores do que isso, então o limite fica logo abaixo.
  const maxTokens = Math.min(opts.maxTokens, MAX_NONSTREAMING_TOKENS);

  const maxAttempts = 2; // a tentativa original + 1 nova tentativa
  let lastProblem = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let response;
    try {
      response = await anthropic.beta.messages.parse(
        {
          model,
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
          output_config: {
            effort: opts.effort,
            format: betaZodOutputFormat(opts.schema),
          },
          // Se o modelo recusar por regra de segurança, a Anthropic tenta
          // automaticamente com o modelo alternativo recomendado.
          ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        },
        { signal: opts.signal },
      );
    } catch (err) {
      // Resposta fora do formato combinado: o zod recusou. A biblioteca não tem
      // uma classe própria para esse erro, então ele é reconhecido pelo texto.
      // Qualquer outro erro vira AI_ERROR com o motivo real (no terminal).
      if (
        err instanceof Anthropic.AnthropicError &&
        !(err instanceof Anthropic.APIError) &&
        err.message.startsWith("Failed to parse structured output")
      ) {
        lastProblem = `formato inválido: ${err.message.slice(0, 300)}`;
        console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
        continue;
      }
      throw mapApiError(err);
    }

    opts.usage.add(response.usage, opts.stage, model);

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
