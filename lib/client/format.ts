/** Pequenas funções de apresentação usadas pelos componentes da tela. */

import { NUMBER_LOCALE, type Locale } from "@/lib/i18n/config";
import { scoreLabel } from "@/lib/taxonomy";

export type Severity = "low" | "mid" | "high";

/** Cor de uma nota: vem da faixa em SCORING.labels (lib/taxonomy.ts). */
export function severity(score: number): Severity {
  return scoreLabel(score).tone;
}

export const SEVERITY_TEXT: Record<Severity, string> = {
  low: "text-teal-deep",
  mid: "text-amber-ink",
  high: "text-ember-ink",
};
export const SEVERITY_BG: Record<Severity, string> = {
  low: "bg-teal",
  mid: "bg-amber",
  high: "bg-ember",
};
export const SEVERITY_SOFT: Record<Severity, string> = {
  low: "bg-teal-soft",
  mid: "bg-amber-soft",
  high: "bg-ember-soft",
};

/** Nota com uma casa decimal, no formato do idioma (5,9 / 5.9). */
export function formatScore(n: number, lang: Locale) {
  return n.toLocaleString(NUMBER_LOCALE[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Data por extenso no formato do idioma. */
export function formatDate(raw: string | undefined, lang: Locale) {
  if (!raw) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(NUMBER_LOCALE[lang], { day: "numeric", month: "long", year: "numeric" });
}
