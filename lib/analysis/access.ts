/**
 * VERSÃO SIMPLES DE UM RESULTADO
 *
 * Numa análise simples (com limites ligados), o navegador recebe só o que o
 * modo simples mostra: nota, inclinação, os 3 principais problemas (com os
 * trechos), a versão neutra e os textos para equilibrar. O resto (todas as
 * outras categorias, explicações e o resumo detalhado) fica no servidor até a
 * pessoa usar a "análise detalhada do dia".
 */

import type { AnalysisResult } from "./types";

/** Quantos problemas o modo simples mostra (precisa bater com components/result/SimpleView.tsx). */
export const SIMPLE_TOP = 3;

export function toSimplePayload(result: AnalysisResult): AnalysisResult {
  const top = new Set(
    result.groups
      .flatMap((g) => g.categories)
      .filter((c) => c.status === "found" && c.evidence.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, SIMPLE_TOP)
      .map((c) => c.id),
  );
  const figureIds = new Set<string>();
  const groups = result.groups.map((g) => ({
    ...g,
    categories: g.categories.map((c) => {
      if (top.has(c.id)) {
        c.evidence.forEach((e) => e.figureId && figureIds.add(e.figureId));
        return c;
      }
      // Fora dos 3 principais: só a nota, sem explicações nem trechos.
      return { ...c, summary: "", evidence: [], discarded: 0 };
    }),
  }));
  return {
    ...result,
    partial: true,
    summary: "",
    groups,
    figures: result.figures?.filter((f) => figureIds.has(f.id)),
  };
}
