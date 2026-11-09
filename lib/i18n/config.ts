/**
 * Idiomas do site. Para adicionar um idioma no futuro: crie o dicionário
 * em lib/i18n/ (copiando pt.ts), registre-o em lib/i18n/index.ts e
 * acrescente o código abaixo.
 */

export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt";

/** Cookie que guarda o idioma escolhido pelo visitante. */
export const LOCALE_COOKIE = "unslant-lang";

/** Código usado no HTML e na formatação de números e datas. */
export const HTML_LANG: Record<Locale, string> = { pt: "pt-BR", en: "en" };
export const NUMBER_LOCALE: Record<Locale, string> = { pt: "pt-BR", en: "en-US" };

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
