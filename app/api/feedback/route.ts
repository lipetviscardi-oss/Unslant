/**
 * "ENVIAR SUGESTÃO": POST /api/feedback
 *
 * Guarda a sugestão no banco (tabela feedback), para o dono do site ler no
 * painel do Supabase. Contra spam: cada pessoa pode enviar até 5 por hora e,
 * somando todos os visitantes sem conta, até 60 por hora. A contagem é feita
 * DEPOIS de gravar (se passou do limite, a sugestão é desfeita), para que
 * vários envios ao mesmo tempo não escapem do limite.
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
/** Visitantes sem conta, todos somados. */
const ANON_PER_HOUR = 60;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: "INVALID_INPUT" }, { status: 400 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ code: "UNAVAILABLE" }, { status: 503 });
  const { message, contact, page, lang } = parsed.data;

  const viewer = await identifyViewer(undefined);
  const fail = (code: string, status: number) => Response.json({ code }, { status });

  const { data: row, error } = await db
    .from("feedback")
    .insert({
      user_id: viewer.userId,
      sender_key: viewer.userId ? null : viewer.anonKey,
      ip_key: viewer.userId ? null : viewer.ipKey,
      contact: contact || null,
      page: page ?? null,
      lang,
      message,
    })
    .select("id")
    .single();
  if (error) {
    console.warn("[unslant] não foi possível guardar a sugestão:", error.message);
    return fail("UNKNOWN", 500);
  }

  // Reconta, já incluindo esta sugestão.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const count = (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => build(base()).then((r) => (r.error ? Infinity : (r.count ?? 0)));
  const base = () => db.from("feedback").select("id", { count: "exact", head: true }).gte("created_at", since);
  const mine = viewer.userId
    ? await count((q) => q.eq("user_id", viewer.userId!))
    : await count((q) =>
        q.is("user_id", null).or([viewer.anonKey && `sender_key.eq.${viewer.anonKey}`, viewer.ipKey && `ip_key.eq.${viewer.ipKey}`].filter(Boolean).join(",")),
      );
  const allAnon = viewer.userId ? 0 : await count((q) => q.is("user_id", null));
  if (mine > PER_HOUR || allAnon > ANON_PER_HOUR) {
    await db.from("feedback").delete().eq("id", row.id);
    return fail("RATE_LIMITED", 429);
  }
  return Response.json({ ok: true });
}
