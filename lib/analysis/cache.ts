/**
 * CACHE DE ANÁLISES
 *
 * Guarda o resultado de cada análise, identificado por uma "impressão
 * digital" do texto + idioma + versão dos prompts. Se o mesmo texto for
 * analisado de novo, o resultado volta na hora e sem custo.
 *
 * Por enquanto o cache fica na pasta .cache/ do projeto (só no seu
 * computador, durante o desenvolvimento). Na Fase 4 ele passa para o banco
 * de dados.
 */

import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "@/lib/config";
import type { AnalysisResult } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "analyses");
const enabled = () => config.cache.enabled && process.env.NODE_ENV === "development";

export function cacheKey(text: string, lang: string, version: string) {
  return createHash("sha256").update(`${version}\n${lang}\n${text}`).digest("hex").slice(0, 32);
}

export async function readCache(key: string): Promise<AnalysisResult | null> {
  if (!enabled()) return null;
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, result: AnalysisResult) {
  if (!enabled()) return;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(result));
  } catch (err) {
    console.warn("[unslant] não foi possível gravar o cache:", err);
  }
}
