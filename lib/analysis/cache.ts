/**
 * CACHE DE ANÁLISES
 *
 * Guarda o resultado de cada análise, identificado por uma "impressão
 * digital" do texto + idioma + versão dos prompts. Se o mesmo texto for
 * analisado de novo, o resultado volta na hora e sem custo.
 *
 * No computador de desenvolvimento, o cache fica na pasta .cache/ do projeto.
 * Com o Supabase configurado, ele também fica no banco (tabela results_cache),
 * compartilhado entre todos: um texto já analisado sai na hora para qualquer um.
 */

import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AnalysisResult } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "analyses");
const enabled = () => config.cache.enabled && process.env.NODE_ENV === "development";

export function cacheKey(text: string, lang: string, version: string) {
  return createHash("sha256").update(`${version}\n${lang}\n${text}`).digest("hex").slice(0, 32);
}

/** Lê da pasta .cache (no computador de desenvolvimento) e, se não achar, do banco (Supabase). */
export async function readCache(key: string): Promise<AnalysisResult | null> {
  if (!config.cache.enabled) return null;
  if (enabled()) {
    try {
      const raw = await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
      return JSON.parse(raw) as AnalysisResult;
    } catch {
      /* não está na pasta: tenta o banco */
    }
  }
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("results_cache")
    .select("result")
    .eq("cache_key", key)
    .gte("created_at", new Date(Date.now() - config.privacy.cacheDays * 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle();
  if (error) console.warn("[unslant] cache do banco indisponível:", error.message);
  return (data?.result as AnalysisResult | undefined) ?? null;
}

/** Grava na pasta .cache (desenvolvimento; usada por npm run comparar e teste:salvar) e no banco, se configurado. */
export async function writeCache(key: string, result: AnalysisResult) {
  if (!config.cache.enabled) return;
  if (enabled()) {
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(result));
    } catch (err) {
      console.warn("[unslant] não foi possível gravar o cache:", err);
    }
  }
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.from("results_cache").upsert({ cache_key: key, result, created_at: new Date().toISOString() });
  if (error) console.warn("[unslant] não foi possível gravar o cache no banco:", error.message);
  await cleanupOldData();
}

let lastCleanup = 0;

/**
 * Apaga o que passou do prazo (config.privacy): resultados guardados e
 * registros de uso antigos. Roda no máximo uma vez por hora.
 */
export async function cleanupOldData() {
  const db = supabaseAdmin();
  if (!db || Date.now() - lastCleanup < 60 * 60 * 1000) return;
  lastCleanup = Date.now();
  const before = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const [cache, usage] = await Promise.all([
    db.from("results_cache").delete().lt("created_at", before(config.privacy.cacheDays)),
    db.from("usage_events").delete().lt("created_at", before(config.privacy.usageDays)),
  ]);
  if (cache.error || usage.error) console.warn("[unslant] limpeza de dados antigos falhou:", cache.error?.message ?? usage.error?.message);
}
