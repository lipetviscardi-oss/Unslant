/**
 * Direciona quem acessa sem idioma no endereço (ex.: "/") para /pt ou /en.
 *  1. Se a pessoa já escolheu um idioma antes (cookie), usa esse.
 *  2. Senão, usa o idioma do navegador: português → /pt; outros → /en.
 */

import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, hasLocale, type Locale } from "@/lib/i18n/config";

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasPrefix) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Não mexe em arquivos internos, na API nem em arquivos com extensão (ícone, PDFs de exemplo).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
