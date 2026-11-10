/**
 * APAGAR MINHA CONTA: DELETE /api/account
 *
 * Apaga a conta da pessoa logada. O banco apaga junto, automaticamente, as
 * análises dela ("Minhas análises") e os registros de uso ligados à conta.
 */

import { errorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { currentUser, supabaseServer } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "pt";
  const user = await currentUser();
  if (!user) return Response.json({ code: "LOGIN_REQUIRED", message: errorMessage("LOGIN_REQUIRED", lang) }, { status: 401 });
  const db = supabaseAdmin();
  if (!db) return Response.json({ code: "UNKNOWN", message: errorMessage("UNKNOWN", lang) }, { status: 500 });
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    console.warn("[unslant] não foi possível apagar a conta:", error.message);
    return Response.json({ code: "UNKNOWN", message: errorMessage("UNKNOWN", lang) }, { status: 500 });
  }
  // Sai da conta neste navegador (apaga os cookies de sessão).
  await (await supabaseServer())?.auth.signOut({ scope: "local" }).catch(() => undefined);
  return Response.json({ ok: true });
}
