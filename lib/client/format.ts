/** Pequenas funções de apresentação usadas pelos componentes da tela. */

import type { ContentType } from "@/lib/analysis/schemas";

export type Severity = "low" | "mid" | "high";

/** Faixa de severidade de uma nota (define a cor). */
export function severity(score: number): Severity {
  if (score < 3.5) return "low";
  if (score < 6.5) return "mid";
  return "high";
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

export function formatScore(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  news: "Notícia",
  opinion: "Opinião",
  analysis: "Análise",
  academic_paper: "Artigo acadêmico",
  press_release: "Comunicado de imprensa",
  blog: "Blog",
  other: "Outro tipo de texto",
};

export const CONFIDENCE_LABEL = { low: "confiança baixa", medium: "confiança média", high: "confiança alta" } as const;

export const POSITION_LABEL = { left: "Esquerda", right: "Direita", unidentified: "Não identificado" } as const;

export function formatDate(raw?: string) {
  if (!raw) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!m) return raw;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
