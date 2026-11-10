/**
 * VOLTA DO LINK DE LOGIN
 *
 * A pessoa clica no link que chegou no e-mail e cai aqui. Trocamos o código do
 * link por uma sessão (gravada em cookies) e a mandamos de volta para o site.
 */

import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Só aceita voltar para páginas do próprio site (evita mandar a pessoa para um
 * site de fora depois do login). Monta o endereço completo e confere a origem:
 * isso pega também truques como barras invertidas e caracteres invisíveis.
 */
function safeNext(next: string | null, origin: string): string {
  if (!next || /[\x00-\x1f\\]/.test(next)) return "/";
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), origin);
  const lang = next.startsWith("/en") ? "en" : "pt";
  const fail = NextResponse.redirect(new URL(`/${lang}/login?erro=link`, origin));

  const supabase = await supabaseServer();
  if (!supabase) return fail;

  // Só o formato PKCE: o código só funciona no mesmo navegador que pediu o link
  // (ele guarda um segredo em cookie). Isso impede que alguém mande um link que
  // faça a pessoa entrar na conta de outra pessoa sem perceber.
  const code = searchParams.get("code");
  const { error } = code ? await supabase.auth.exchangeCodeForSession(code) : { error: new Error("link sem código") };

  if (error) {
    console.warn("[unslant] login: link inválido ou expirado:", error.message);
    return fail;
  }
  return NextResponse.redirect(new URL(next, origin));
}
