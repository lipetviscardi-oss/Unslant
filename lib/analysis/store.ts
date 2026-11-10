/**
 * "MINHAS ANÁLISES": guarda cada análise de quem tem conta.
 *
 * Numa análise simples ainda não liberada, guardamos a VERSÃO SIMPLES do
 * resultado (o navegador consegue ler as próprias análises). A análise
 * completa fica só no cache do servidor (tabela results_cache, que o
 * navegador não acessa) e é copiada para cá quando a pessoa usa a
 * "análise detalhada do dia".
 */

import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toSimplePayload } from "./access";
import type { AnalysisResult } from "./types";
import type { Kind, Viewer } from "./usage";

export async function saveAnalysis(params: {
  viewer: Viewer;
  kind: Kind;
  result: AnalysisResult;
  cacheKey: string;
  /** false = resultado reaproveitado (não contou no limite). */
  counted: boolean;
}): Promise<string | null> {
  const db = supabaseAdmin();
  const { viewer, kind, result } = params;
  if (!db || !viewer.userId) return null;
  const stored = kind === "simple" ? toSimplePayload(result) : result;
  const { data, error } = await db
    .from("analyses")
    .insert({
      user_id: viewer.userId,
      local_day: viewer.day,
      kind,
      counted: params.counted,
      status: "done",
      title: result.source.title ?? result.context.topic ?? null,
      source_url: result.source.url ?? null,
      content_type: result.context.contentType,
      score: result.overall.score,
      language: result.language,
      cache_key: params.cacheKey,
      result: stored,
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[unslant] não foi possível salvar em Minhas análises:", error.message);
    return null;
  }
  return data.id as string;
}

export interface StoredAnalysis {
  id: string;
  user_id: string;
  kind: Kind;
  detailed_unlocked: boolean;
  cache_key: string | null;
  result: AnalysisResult | null;
}

/** Lê uma análise (com a chave secreta: quem chama confere se ela é da pessoa). */
export async function loadAnalysis(id: string): Promise<StoredAnalysis | null> {
  const db = supabaseAdmin();
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await db.from("analyses").select("id, user_id, kind, detailed_unlocked, cache_key, result").eq("id", id).maybeSingle();
  return (data as StoredAnalysis | null) ?? null;
}

/** Libera a análise completa: copia o resultado completo do cache para a análise da pessoa. */
export async function unlockAnalysis(id: string, full: AnalysisResult) {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.from("analyses").update({ detailed_unlocked: true, result: full }).eq("id", id);
  if (error) throw new Error(`liberar análise: ${error.message}`);
}

/**
 * ANÁLISE EM SEGUNDO PLANO: a linha é criada como "em andamento" antes de a
 * IA começar. Assim, se a pessoa fechar a página, a análise continua e o
 * resultado aparece em "Minhas análises" quando ficar pronto.
 */
export async function createRunning(params: {
  viewer: Viewer;
  kind: Kind;
  cacheKey: string;
  title?: string;
  sourceUrl?: string;
  language: string;
}): Promise<string | null> {
  const db = supabaseAdmin();
  if (!db || !params.viewer.userId) return null;
  const { data, error } = await db
    .from("analyses")
    .insert({
      user_id: params.viewer.userId,
      local_day: params.viewer.day,
      kind: params.kind,
      counted: true,
      status: "running",
      title: params.title ?? null,
      source_url: params.sourceUrl ?? null,
      language: params.language,
      cache_key: params.cacheKey,
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[unslant] não foi possível criar a análise em andamento:", error.message);
    return null;
  }
  return data.id as string;
}

/** A análise terminou: guarda o resultado (na simples, a versão simples). */
export async function completeAnalysis(id: string, kind: Kind, result: AnalysisResult) {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db
    .from("analyses")
    .update({
      status: "done",
      title: result.source.title ?? result.context.topic ?? null,
      source_url: result.source.url ?? null,
      content_type: result.context.contentType,
      score: result.overall.score,
      language: result.language,
      result: kind === "simple" ? toSimplePayload(result) : result,
    })
    .eq("id", id);
  if (error) console.warn("[unslant] não foi possível concluir a análise:", error.message);
}

/** A análise falhou: marca o erro (o uso do dia é devolvido em outro lugar). */
export async function failAnalysis(id: string, code: string) {
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("analyses").update({ status: "error", error_code: code }).eq("id", id);
}
