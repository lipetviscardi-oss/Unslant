/**
 * LIMITE DE USO POR MINUTO DA ANTHROPIC
 *
 * Cada conta tem um limite de "tokens de entrada por minuto" para cada modelo.
 * Uma notícia fica bem abaixo dele, mas um paper longo, mandado em 4 chamadas
 * ao mesmo tempo, pode passar. Este arquivo organiza uma fila: antes de cada
 * chamada, estima quantos tokens ela vai mandar e, se o total do último minuto
 * passar do limite, espera a vez.
 *
 * O limite real da conta é lido das respostas da própria Anthropic (cabeçalho
 * "anthropic-ratelimit-input-tokens-limit"). Até a primeira resposta, vale o
 * valor de config.ai.rateLimit.
 */

import "server-only";
import { config } from "@/lib/config";

const WINDOW_MS = 60_000;

/** Limite aprendido das respostas, por modelo. */
const learned = new Map<string, number>();
/** Chamadas do último minuto, por modelo. */
const windows = new Map<string, { at: number; tokens: number }[]>();

/** Estimativa simples: ~3,2 caracteres por token em português (um pouco acima do real, por segurança). */
export function estimateTokens(...texts: (string | undefined)[]): number {
  return Math.ceil(texts.reduce((n, t) => n + (t?.length ?? 0), 0) / 3.2);
}

function limitFor(model: string): number {
  const fallback = model === config.ai.lightModel ? config.ai.rateLimit.light : config.ai.rateLimit.main;
  return learned.get(model) ?? fallback;
}

/** Guarda o limite informado pela Anthropic (chamado a cada resposta). */
export function learnLimit(model: string, headers: Headers) {
  const value = Number(headers.get("anthropic-ratelimit-input-tokens-limit"));
  if (Number.isFinite(value) && value > 0) learned.set(model, value);
}

/** Espera `ms` milissegundos, interrompendo se o usuário cancelar. */
export function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Reserva espaço na fila para uma chamada de `tokens` tokens. Se o último
 * minuto já estiver cheio, espera (chamando `onWait` uma vez) até caber.
 * Uma chamada maior que o limite inteiro passa quando a fila está vazia.
 */
export async function acquire(model: string, tokens: number, opts: { signal?: AbortSignal; onWait?: () => void } = {}) {
  let warned = false;
  for (;;) {
    const now = Date.now();
    const list = (windows.get(model) ?? []).filter((c) => now - c.at < WINDOW_MS);
    windows.set(model, list);
    const used = list.reduce((n, c) => n + c.tokens, 0);
    if (list.length === 0 || used + tokens <= limitFor(model)) {
      list.push({ at: now, tokens });
      return;
    }
    if (!warned) {
      warned = true;
      opts.onWait?.();
    }
    // Espera até a chamada mais antiga sair da janela de 1 minuto.
    const waitMs = Math.max(500, WINDOW_MS - (now - list[0].at) + 50);
    await sleep(Math.min(waitMs, 5_000), opts.signal);
  }
}
