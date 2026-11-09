/**
 * CÁLCULO DAS NOTAS
 *
 * A nota geral é calculada aqui, pelo código, e não pela IA. As regras e os
 * pesos ficam em lib/taxonomy.ts (TAXONOMY e SCORING), para você ajustar.
 */

import { SCORING, TAXONOMY, scoreLabel, type Lang } from "@/lib/taxonomy";
import type { CategoryResult, GroupResult } from "./types";

export function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Nota de um grupo: mistura a pior categoria com a média ponderada do grupo. */
export function scoreGroup(groupId: string, categories: CategoryResult[]): number | null {
  const group = TAXONOMY.find((g) => g.id === groupId);
  const included = categories.filter((c) => c.status !== "not_applicable");
  if (!group || included.length === 0) return null;

  let wSum = 0;
  let wScore = 0;
  let max = 0;
  for (const c of included) {
    const catWeight = group.categories.find((x) => x.id === c.id)?.weight ?? 1;
    const w = catWeight * SCORING.confidenceWeight[c.confidence];
    wSum += w;
    wScore += w * c.score;
    max = Math.max(max, c.score);
  }
  const mean = wSum > 0 ? wScore / wSum : 0;
  return round1(SCORING.groupMaxShare * max + (1 - SCORING.groupMaxShare) * mean);
}

/** Nota geral: média ponderada dos grupos + peso extra para os piores grupos. */
export function scoreOverall(groups: GroupResult[], lang: Lang) {
  const scored = groups.filter((g): g is GroupResult & { score: number } => g.score !== null);
  if (scored.length === 0) {
    const l = scoreLabel(0);
    return { score: 0, label: l[lang], simpleLabel: lang === "pt" ? l.simplePt : l.simpleEn };
  }

  let wSum = 0;
  let wScore = 0;
  for (const g of scored) {
    const w = TAXONOMY.find((t) => t.id === g.id)?.weight ?? 1;
    wSum += w;
    wScore += w * g.score;
  }
  const weightedMean = wSum > 0 ? wScore / wSum : 0;

  const top = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, SCORING.topGroupsCount);
  const topMean = top.reduce((s, g) => s + g.score, 0) / top.length;

  const score = round1(
    clamp((1 - SCORING.topGroupsShare) * weightedMean + SCORING.topGroupsShare * topMean, 0, 10),
  );
  const l = scoreLabel(score);
  return { score, label: l[lang], simpleLabel: lang === "pt" ? l.simplePt : l.simpleEn };
}
