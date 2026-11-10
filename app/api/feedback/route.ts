/**
 * "ENVIAR SUGESTÃO": POST /api/feedback
 *
 * Guarda a sugestão no banco (tabela feedback), para o dono do site ler no
 * painel do Supabase. Cada pessoa pode enviar até 5 por hora (evita spam).
 */

import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { identifyViewer } from "@/lib/analysis/usage";

const Body = z.object({
  message: z.string().trim().min(3).max(3000),
  contact: z.string().trim().max(200).optional(),
  page: z.string().max(300).optional(),
  lang: z.enum(["pt", "en"]).default("pt"),
});

const PER_HOUR = 5;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: "INVALID_INPUT" }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ code: "UNAVAILABLE" }, { status: 503 });
  const { message, contact, page, lang } = parsed.data;

  const viewer = await identifyViewer(undefined);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let q = db.from("feedback").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (viewer.userId) q = q.eq("user_id", viewer.userId);
  else q = q.or([viewer.anonKey && `sender_key.eq.${viewer.anonKey}`, viewer.ipKey && `ip_key.eq.${viewer.ipKey}`].filter(Boolean).join(","));
  const { count, error: countError } = await q;
  if (countError) {
    console.warn("[unslant] sugestões indisponíveis:", countError.message);
    return Response.json({ code: "UNKNOWN" }, { status: 500 });
  }
  if ((count ?? 0) >= PER_HOUR) return Response.json({ code: "RATE_LIMITED" }, { status: 429 });

  const { error } = await db.from("feedback").insert({
    user_id: viewer.userId,
    sender_key: viewer.userId ? null : viewer.anonKey,
    ip_key: viewer.userId ? null : viewer.ipKey,
    contact: contact || null,
    page: page ?? null,
    lang,
    message,
  });
  if (error) {
    console.warn("[unslant] não foi possível guardar a sugestão:", error.message);
    return Response.json({ code: "UNKNOWN" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
