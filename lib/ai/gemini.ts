/**
 * CONVERSA COM O GOOGLE GEMINI (usado quando config.ai.provider = "gemini").
 *
 * Faz o mesmo papel de client.ts, mas com a IA do Google: pede a resposta
 * num formato fixo (JSON), confere com o zod e tenta de novo uma vez se vier
 * errada. O plano grátis aceita poucas chamadas por minuto, então, quando o
 * limite é atingido, esperamos um pouco e tentamos de novo automaticamente.
 */

import "server-only";
import { ApiError, FinishReason, GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { z } from "zod";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import type { StructuredCallOptions, UsageTracker } from "./client";

let client: GoogleGenAI | null = null;

export function getGemini() {
  if (!process.env.GEMINI_API_KEY) throw new AppError("MISSING_API_KEY", "GEMINI_API_KEY");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export function geminiModel() {
  return config.ai.models.gemini;
}

/** Traduz erros do Google para mensagens do unslant. */
export function mapGeminiError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error && err.name === "AbortError") return new AppError("AI_ERROR", "cancelado pelo usuário");
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403 || (err.status === 400 && /api key/i.test(err.message))) {
      return new AppError("AI_AUTH", err.message);
    }
    if (err.status === 429) return new AppError("AI_RATE_LIMIT", err.message);
    if (err.status >= 500) return new AppError("AI_OVERLOADED", err.message);
    return new AppError("AI_ERROR", `${err.status}: ${err.message}`);
  }
  return new AppError("AI_ERROR", err instanceof Error ? err.message : String(err));
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      reject(new AppError("AI_ERROR", "cancelado pelo usuário"));
    });
  });

/** Repete a chamada quando o limite por minuto é atingido ou o serviço oscila. */
export async function withRetry<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  const delays = [10_000, 25_000, 50_000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof ApiError && (err.status === 429 || err.status >= 500);
      if (!retryable || attempt >= delays.length || signal?.aborted) throw mapGeminiError(err);
      console.warn(`[unslant] Gemini: limite ou instabilidade (${(err as ApiError).status}); nova tentativa em ${delays[attempt] / 1000}s`);
      await wait(delays[attempt], signal);
    }
  }
}

/** Registra os tokens usados (no plano grátis o custo é zero, mas é útil saber). */
export function addGeminiUsage(usage: UsageTracker, res: GenerateContentResponse) {
  const m = res.usageMetadata;
  if (!m) return;
  const cached = m.cachedContentTokenCount ?? 0;
  usage.inputTokens += Math.max(0, (m.promptTokenCount ?? 0) - cached) + (m.toolUsePromptTokenCount ?? 0);
  usage.cacheReadTokens += cached;
  usage.outputTokens += (m.candidatesTokenCount ?? 0) + (m.thoughtsTokenCount ?? 0);
}

/** Recusa por segurança? */
export function isBlocked(res: GenerateContentResponse) {
  if (res.promptFeedback?.blockReason) return true;
  const fr = res.candidates?.[0]?.finishReason;
  return (
    fr === FinishReason.SAFETY ||
    fr === FinishReason.PROHIBITED_CONTENT ||
    fr === FinishReason.BLOCKLIST ||
    fr === FinishReason.SPII
  );
}

/** Esquema JSON a partir do zod (formato que o Gemini entende). */
function jsonSchemaFor(schema: z.ZodType) {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  delete js.$schema;
  return js;
}

export async function callStructuredGemini<T extends z.ZodType>(opts: StructuredCallOptions<T>): Promise<z.infer<T>> {
  const ai = getGemini();
  const contents = [opts.documentBlock, opts.task].filter(Boolean).join("\n\n");
  const responseJsonSchema = jsonSchemaFor(opts.schema);
  let lastProblem = "";

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await withRetry(
      () =>
        ai.models.generateContent({
          model: geminiModel(),
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseJsonSchema,
            maxOutputTokens: opts.maxTokens,
            abortSignal: opts.signal,
          },
        }),
      opts.signal,
    );
    addGeminiUsage(opts.usage, res);

    if (isBlocked(res)) throw new AppError("AI_REFUSAL", `${opts.label}: bloqueado pelo Gemini`);
    if (res.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS) {
      lastProblem = "resposta cortada (limite de tamanho atingido)";
      console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(res.text ?? "");
    } catch {
      lastProblem = "resposta não é JSON";
      console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
      continue;
    }
    const parsed = opts.schema.safeParse(json);
    if (parsed.success) return parsed.data as z.infer<T>;
    lastProblem = `formato inválido: ${parsed.error.message.slice(0, 300)}`;
    console.warn(`[unslant] ${opts.label}: tentativa ${attempt} — ${lastProblem}`);
  }
  throw new AppError("AI_BAD_RESPONSE", `${opts.label}: ${lastProblem}`);
}
