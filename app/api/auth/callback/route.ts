/**
 * VOLTA DO LINK DE LOGIN
 *
 * A pessoa clica no link que chegou no e-mail e cai aqui. Trocamos o código do
 * link por uma sessão (gravada em cookies) e a mandamos de volta para o site.
 */

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";

/** Só aceita voltar para páginas do próprio site (evita redirecionar para sites de fora). */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const lang = next.startsWith("/en") ? "en" : "pt";
  const fail = NextResponse.redirect(new URL(`/${lang}/login?erro=link`, origin));

  const supabase = await supabaseServer();
  if (!supabase) return fail;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("link sem código") };

  if (error) {
    console.warn("[unslant] login: link inválido ou expirado:", error.message);
    return fail;
  }
  return NextResponse.redirect(new URL(next, origin));
}
