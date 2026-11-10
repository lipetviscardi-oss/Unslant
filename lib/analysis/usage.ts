/**
 * LIMITES POR PESSOA (Fase 4)
 *
 * Quem está analisando, quantas análises já fez hoje e quantas restam.
 *  - Conta grátis: config.limits.perDay.free (ex.: 3 simples + 1 detalhada;
 *    na fase de testes, 5 por dia somando os dois tipos).
 *  - Visitante sem conta: config.limits.perDay.anonymous (1 simples).
 *  - Conta: o "dia" é o da própria pessoa (zera à meia-noite no fuso dela).
 *    O fuso fica FIXO na conta a partir da primeira análise, para ninguém
 *    trocar de fuso de propósito e ganhar análises extras.
 *  - Visitante: vale uma janela de 24 horas (sem depender do fuso).
 *  - Visitantes são reconhecidos por dois códigos anônimos (um cookie e o
 *    endereço de internet), guardados só como resumo irreversível (HMAC):
 *    o banco nunca recebe o endereço em si.
 *
 * Sem o Supabase configurado, nada disso vale e o site funciona como antes.
 */

import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { config, type DayLimits } from "@/lib/config";
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

/** Fuso horário válido? (ex.: "America/Sao_Paulo") */
function validTz(tz: string | undefined): tz is string {
  if (!tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
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
  const user = await currentUser();
  if (user) {
    // Fuso fixo na conta: o primeiro informado fica guardado; os seguintes são ignorados.
    // Fica em app_metadata, que só o servidor (chave secreta) consegue alterar;
    // user_metadata a própria pessoa poderia mudar pelo navegador.
    let pinned = typeof user.app_metadata?.tz === "string" ? (user.app_metadata.tz as string) : undefined;
    if (!validTz(pinned) && validTz(tz)) {
      pinned = tz;
      await supabaseAdmin()?.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, tz } });
    }
    return { userId: user.id, email: user.email ?? null, anonKey: null, ipKey: null, day: localDay(pinned) };
  }
  const day = localDay(tz);

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

export function limitsFor(v: Viewer): DayLimits {
  return v.userId ? config.limits.perDay.free : config.limits.perDay.anonymous;
}

/** Quantas análises de cada tipo a pessoa já fez hoje (null = banco não configurado). */
export async function usedToday(v: Viewer): Promise<Record<Kind, number> | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  // Usos devolvidos (análise que falhou) não contam para a pessoa.
  let q = db.from("usage_events").select("kind").eq("refunded", false);
  if (v.userId) {
    // Conta: inclui os usos de uma conta apagada hoje com o mesmo e-mail (ver detachUsage).
    const owner = [`user_id.eq.${v.userId}`, v.email && `anon_key.eq.${emailKey(v.email)}`].filter(Boolean).join(",");
    q = q.eq("local_day", v.day).or(owner);
  }
  else {
    // Visitante: últimas 24 horas, pelo cookie OU pelo endereço (apagar o cookie não zera o limite).
    const keys = [v.anonKey && `anon_key.eq.${v.anonKey}`, v.ipKey && `ip_key.eq.${v.ipKey}`].filter(Boolean).join(",");
    q = q.is("user_id", null).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).or(keys);
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
  // Com limite total, o que sobra de cada tipo também não passa do que sobra no total.
  const totalLeft = lim.total != null ? lim.total - used.simple - used.detailed : Infinity;
  return {
    simple: Math.max(0, Math.min(lim.simple - used.simple, totalLeft)),
    detailed: Math.max(0, Math.min(lim.detailed - used.detailed, totalLeft)),
  };
}

/**
 * Reserva um uso ANTES de chamar a IA: grava primeiro e reconta em seguida.
 * Se dois pedidos chegarem ao mesmo tempo e passarem do limite, o registro é
 * desfeito e a função devolve "limit". Sem banco configurado, devolve null.
 */
export async function reserveUsage(v: Viewer, kind: Kind, analysisId?: string): Promise<number | "limit" | null> {
  const id = await recordUsage(v, kind, analysisId);
  if (id === null) return null;
  const used = await usedToday(v);
  const lim = limitsFor(v);
  if (used && (used[kind] > lim[kind] || (lim.total != null && used.simple + used.detailed > lim.total))) {
    await supabaseAdmin()?.from("usage_events").delete().eq("id", id);
    return "limit";
  }
  return id;
}

async function recordUsage(v: Viewer, kind: Kind, analysisId?: string): Promise<number | null> {
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

/**
 * Devolve um uso para a pessoa (a análise falhou por um problema nosso ou da IA).
 * O registro continua no banco, marcado como devolvido: ele ainda conta no
 * limite geral do site (proteção contra gastos), mas não no limite da pessoa.
 */
export async function refundUsage(eventId: number | null) {
  const db = supabaseAdmin();
  if (!db || eventId == null) return;
  await db.from("usage_events").update({ refunded: true }).eq("id", eventId);
}

/** Código anônimo (HMAC) do e-mail, para os usos de uma conta apagada. */
function emailKey(email: string) {
  return anonymize(`e:${email.trim().toLowerCase()}`);
}

/**
 * Antes de apagar uma conta: os registros de uso deixam de apontar para ela
 * (assim não são apagados junto) e passam a ter só um código anônimo do e-mail.
 * Eles continuam contando no limite geral do site e no limite do dia de quem
 * criar a conta de novo com o mesmo e-mail. Somem depois de config.privacy.usageDays.
 */
export async function detachUsage(userId: string, email: string | null) {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db
    .from("usage_events")
    .update({ user_id: null, analysis_id: null, anon_key: email ? emailKey(email) : null })
    .eq("user_id", userId);
  if (error) throw new Error(`separar usos da conta: ${error.message}`);
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
