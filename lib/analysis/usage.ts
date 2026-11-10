/**
 * LIMITES POR PESSOA (Fase 4)
 *
 * Quem está analisando, quantas análises já fez hoje e quantas restam.
 *  - Conta grátis: config.limits.perDay.free (3 simples + 1 detalhada).
 *  - Visitante sem conta: config.limits.perDay.anonymous (1 simples).
 *  - O "dia" é o da própria pessoa: zera à meia-noite no fuso horário dela,
 *    informado pelo navegador.
 *  - Visitantes são reconhecidos por dois códigos anônimos (um cookie e o
 *    endereço de internet), guardados só como resumo irreversível (HMAC):
 *    o banco nunca recebe o endereço em si.
 *
 * Sem o Supabase configurado, nada disso vale e o site funciona como antes.
 */

import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { config } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUser } from "@/lib/supabase/server";

export type Kind = "simple" | "detailed";

export interface Viewer {
  userId: string | null;
  email: string | null;
  /** Visitante sem conta: resumo do cookie anônimo. */
  anonKey: string | null;
  /** Visitante sem conta: resumo do endereço de internet. */
  ipKey: string | null;
  /** Dia no horário da pessoa, no formato AAAA-MM-DD. */
  day: string;
}

const ANON_COOKIE = "unslant-anon";
const FALLBACK_TZ = "America/Sao_Paulo";

/** Data de hoje no fuso horário informado (se o fuso for inválido, usa o de Brasília). */
export function localDay(tz: string | undefined): string {
  const fmt = (zone: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  try {
    return fmt(tz && tz.length <= 64 ? tz : FALLBACK_TZ);
  } catch {
    return fmt(FALLBACK_TZ);
  }
}

/** Resumo irreversível (HMAC) de um identificador: o mesmo valor sempre dá o mesmo código. */
function anonymize(value: string): string {
  const salt = process.env.UNSLANT_ANON_SALT || process.env.SUPABASE_SECRET_KEY || "unslant";
  return createHmac("sha256", salt).update(value).digest("hex").slice(0, 32);
}

/** Quem está pedindo a análise. Cria o cookie anônimo do visitante, se ainda não existir. */
export async function identifyViewer(tz: string | undefined): Promise<Viewer> {
  const day = localDay(tz);
  const user = await currentUser();
  if (user) return { userId: user.id, email: user.email ?? null, anonKey: null, ipKey: null, day };

  const jar = await cookies();
  let anonId = jar.get(ANON_COOKIE)?.value;
  if (!anonId || !/^[0-9a-f-]{36}$/.test(anonId)) {
    anonId = randomUUID();
    jar.set(ANON_COOKIE, anonId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "";
  return { userId: null, email: null, anonKey: anonymize(`c:${anonId}`), ipKey: ip ? anonymize(`i:${ip}`) : null, day };
}

export function limitsFor(v: Viewer) {
  return v.userId ? config.limits.perDay.free : config.limits.perDay.anonymous;
}

/** Quantas análises de cada tipo a pessoa já fez hoje (null = banco não configurado). */
export async function usedToday(v: Viewer): Promise<Record<Kind, number> | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  let q = db.from("usage_events").select("kind").eq("local_day", v.day);
  if (v.userId) q = q.eq("user_id", v.userId);
  else {
    // Visitante: conta pelo cookie OU pelo endereço (apagar o cookie não zera o limite).
    const keys = [v.anonKey && `anon_key.eq.${v.anonKey}`, v.ipKey && `ip_key.eq.${v.ipKey}`].filter(Boolean).join(",");
    q = q.is("user_id", null).or(keys);
  }
  const { data, error } = await q;
  if (error) throw new Error(`uso diário: ${error.message}`);
  const used = { simple: 0, detailed: 0 };
  for (const row of data ?? []) used[row.kind as Kind]++;
  return used;
}

/** Quantas restam hoje (null = sem limites, banco não configurado). */
export async function remainingToday(v: Viewer): Promise<Record<Kind, number> | null> {
  const used = await usedToday(v);
  if (!used) return null;
  const lim = limitsFor(v);
  return { simple: Math.max(0, lim.simple - used.simple), detailed: Math.max(0, lim.detailed - used.detailed) };
}

/** Registra um uso (antes de chamar a IA, para dois pedidos ao mesmo tempo não passarem do limite). */
export async function recordUsage(v: Viewer, kind: Kind, analysisId?: string): Promise<number | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("usage_events")
    .insert({ user_id: v.userId, anon_key: v.anonKey, ip_key: v.ipKey, local_day: v.day, kind, analysis_id: analysisId ?? null })
    .select("id")
    .single();
  if (error) throw new Error(`registrar uso: ${error.message}`);
  return data.id as number;
}

/** Devolve um uso (a análise falhou por um problema nosso ou da IA, não da pessoa). */
export async function refundUsage(eventId: number | null) {
  const db = supabaseAdmin();
  if (!db || eventId == null) return;
  await db.from("usage_events").delete().eq("id", eventId);
}

/** Liga um uso já registrado à análise salva. */
export async function linkUsage(eventId: number | null, analysisId: string) {
  const db = supabaseAdmin();
  if (!db || eventId == null) return;
  await db.from("usage_events").update({ analysis_id: analysisId }).eq("id", eventId);
}

/** Análises novas (que chamaram a IA) no site inteiro nas últimas 24 horas (null = banco não configurado). */
export async function siteUsageLast24h(): Promise<number | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await db.from("usage_events").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (error) throw new Error(`uso do site: ${error.message}`);
  return count ?? 0;
}
