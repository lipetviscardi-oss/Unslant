/**
 * APAGAR MINHA CONTA: DELETE /api/account
 *
 * Apaga a conta da pessoa logada. O banco apaga junto, automaticamente, as
 * análises dela ("Minhas análises"). Os registros de uso NÃO são apagados:
 * ficam só com um código anônimo do e-mail (senão, apagar e recriar a conta
 * zeraria o limite do dia e o limite geral do site). Somem em 30 dias.
 */

import { errorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUser, supabaseServer } from "@/lib/supabase/server";
import { detachUsage } from "@/lib/analysis/usage";

export async function DELETE(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "pt";
  const user = await currentUser();
  if (!user) return Response.json({ code: "LOGIN_REQUIRED", message: errorMessage("LOGIN_REQUIRED", lang) }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ code: "UNKNOWN", message: errorMessage("UNKNOWN", lang) }, { status: 500 });
  try {
    await detachUsage(user.id, user.email ?? null);
  } catch (err) {
    console.warn("[unslant] não foi possível apagar a conta:", err);
    return Response.json({ code: "UNKNOWN", message: errorMessage("UNKNOWN", lang) }, { status: 500 });
  }
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    console.warn("[unslant] não foi possível apagar a conta:", error.message);
    return Response.json({ code: "UNKNOWN", message: errorMessage("UNKNOWN", lang) }, { status: 500 });
  }
  // Sai da conta neste navegador (apaga os cookies de sessão).
  await (await supabaseServer())?.auth.signOut({ scope: "local" }).catch(() => undefined);
  return Response.json({ ok: true });
}
