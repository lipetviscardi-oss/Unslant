/**
 * Roda antes de cada página:
 *  - direciona quem acessa sem idioma no endereço (ex.: "/") para /pt ou /en
 *    (1. idioma escolhido antes, guardado em cookie; 2. idioma do navegador);
 *  - renova a sessão de login do Supabase, quando ele está configurado.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, hasLocale, type Locale } from "@/lib/i18n/config";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";

function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;

  const header = request.headers.get("accept-language");
  if (!header) return DEFAULT_LOCALE;
  // Idiomas do navegador em ordem de preferência (ex.: "pt-BR,pt;q=0.9,en;q=0.8").
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of preferred) {
    if (tag.startsWith("pt")) return "pt";
    if (tag.startsWith("en")) return "en";
  }
  return "en"; // outros idiomas: inglês costuma ser mais útil
}

/** Renova a sessão de login (o "token" expira de tempos em tempos) e devolve a resposta com os cookies novos. */
async function refreshSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  if (!supabaseConfigured()) return response;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });
  // Só renova a sessão se ela existir; sem login, não faz nada.
  await supabase.auth.getClaims();
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasPrefix) return refreshSession(request);

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Não mexe em arquivos internos, na API nem em arquivos com extensão (ícone, PDFs de exemplo).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
