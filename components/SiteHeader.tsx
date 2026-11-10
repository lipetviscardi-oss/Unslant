"use client";

/**
 * Topo do site: logo, links das páginas e seletor de idioma.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { useDict, useLang } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { AccountMenu } from "@/components/AccountMenu";

/** Mesmo endereço, no outro idioma (ex.: /pt/methodology → /en/methodology). */
function swapLocale(pathname: string, target: Locale) {
  const parts = pathname.split("/");
  parts[1] = target;
  return parts.join("/") || `/${target}`;
}

export function LanguageSwitch() {
  const lang = useLang();
  const t = useDict();
  const pathname = usePathname() ?? `/${lang}`;
  const target: Locale = lang === "pt" ? "en" : "pt";
  return (
    <Link
      href={swapLocale(pathname, target)}
      hrefLang={target === "pt" ? "pt-BR" : "en"}
      aria-label={t.nav.otherLanguageAria}
      onClick={() => {
        // Lembra a escolha por 1 ano (usado ao abrir o site sem /pt ou /en).
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-medium hover:border-ink"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="text-muted">
        <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 8h13M8 1.5c2 2 2.6 4.2 2.6 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.4 5.7 5.4 8S6 12.5 8 14.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {t.nav.otherLanguage}
    </Link>
  );
}

export function NavLinks({ className = "" }: { className?: string }) {
  const lang = useLang();
  const t = useDict();
  const pathname = usePathname();
  const links = [
    { href: `/${lang}/methodology`, label: t.nav.methodology },
    { href: `/${lang}/glossary`, label: t.nav.glossary },
    { href: `/${lang}/privacy`, label: t.nav.privacy },
    { href: `/${lang}/about`, label: t.nav.about },
  ];
  return (
    <ul className={className}>
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            aria-current={pathname === l.href ? "page" : undefined}
            className="rounded-md px-1 hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:underline-offset-4"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader() {
  const lang = useLang();
  const t = useDict();
  return (
    <header className="px-4 pt-5 pb-2 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href={`/${lang}`} aria-label={t.nav.home} className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label={t.nav.menu} className="flex items-center gap-5">
          <NavLinks className="hidden items-center gap-5 text-[15px] text-muted md:flex" />
          <LanguageSwitch />
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
