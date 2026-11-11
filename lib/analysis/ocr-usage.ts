/**
 * LIMITE DE PÁGINAS TRANSCRITAS (PDFs escaneados)
 *
 * Cada página transcrita custa dinheiro (a IA lê a imagem). Para ninguém
 * gastar o crédito do site, há um limite de páginas por pessoa e no site
 * inteiro, nas últimas 24 horas (config.ocr). A reserva é feita ANTES de
 * chamar a IA: grava, reconta e desfaz se passou do limite (como nas análises).
 * Sem o Supabase configurado, não há limite (como no resto do site).
 */

import "server-only";
import { config } from "@/lib/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Viewer } from "./usage";

const since = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

async function pagesUsed(v: Viewer): Promise<{ mine: number; site: number } | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  let mineQ = db.from("ocr_events").select("pages").gte("created_at", since());
  if (v.userId) mineQ = mineQ.eq("user_id", v.userId);
  else mineQ = mineQ.is("user_id", null).or([v.anonKey && `anon_key.eq.${v.anonKey}`, v.ipKey && `ip_key.eq.${v.ipKey}`].filter(Boolean).join(","));
  const [mine, site] = await Promise.all([mineQ, db.from("ocr_events").select("pages").gte("created_at", since())]);
  if (mine.error || site.error) throw new Error(`limite de transcrição: ${(mine.error ?? site.error)!.message}`);
  const sum = (rows: { pages: number }[] | null) => (rows ?? []).reduce((s, r) => s + r.pages, 0);
  return { mine: sum(mine.data), site: sum(site.data) };
}

/** Reserva `pages` páginas. Devolve o id do registro, "limit" (passou do limite) ou null (sem banco). */
export async function reserveOcrPages(v: Viewer, pages: number): Promise<number | "limit" | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("ocr_events")
    .insert({ user_id: v.userId, anon_key: v.userId ? null : v.anonKey, ip_key: v.userId ? null : v.ipKey, pages })
    .select("id")
    .single();
  if (error) throw new Error(`registrar transcrição: ${error.message}`);
  const used = await pagesUsed(v);
  const limit = v.userId ? config.ocr.pagesPer24h.free : config.ocr.pagesPer24h.anonymous;
  if (used && (used.mine > limit || used.site > config.ocr.sitePagesPer24h)) {
    await db.from("ocr_events").delete().eq("id", data.id);
    return "limit";
  }
  return data.id as number;
}

/** A transcrição falhou: devolve as páginas reservadas. */
export async function releaseOcrPages(id: number | null) {
  const db = supabaseAdmin();
  if (!db || id == null) return;
  await db.from("ocr_events").delete().eq("id", id);
}
