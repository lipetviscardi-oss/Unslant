/**
 * Índice das evidências e divisão do texto em "segmentos" para destacar.
 */

import type { AnalysisResult, CategoryResult, Evidence, GroupResult } from "@/lib/analysis/types";
import { scoreLabel, TAXONOMY, type BiasCategory, type BiasGroup } from "@/lib/taxonomy";

type Tone = "low" | "mid" | "high";
const TONES: Tone[] = ["low", "mid", "high"];
const STRENGTH_RANK = { weak: 0, medium: 1, strong: 2 } as const;

/**
 * Cor de um trecho: o peso do próprio trecho (leve, médio, forte), mas nunca
 * acima da faixa da nota da categoria. Resultados antigos (sem peso) usam a
 * cor da categoria.
 */
function evidenceRank(e: Evidence, categoryScore: number): number {
  const cat = TONES.indexOf(scoreLabel(categoryScore).tone);
  return e.strength ? Math.min(cat, STRENGTH_RANK[e.strength]) : cat;
}

export interface EvidenceRef {
  evidence: Evidence;
  category: CategoryResult;
  group: GroupResult;
  categoryDef?: BiasCategory;
  groupDef?: BiasGroup;
}

export function buildEvidenceIndex(result: AnalysisResult): Map<string, EvidenceRef> {
  const map = new Map<string, EvidenceRef>();
  for (const group of result.groups) {
    const groupDef = TAXONOMY.find((g) => g.id === group.id);
    for (const category of group.categories) {
      const categoryDef = groupDef?.categories.find((c) => c.id === category.id);
      for (const evidence of category.evidence) {
        map.set(evidence.id, { evidence, category, group, categoryDef, groupDef });
      }
    }
  }
  return map;
}

/** Um pedaço do texto: comum ou destacado. */
export interface Segment {
  start: number;
  end: number;
  /** Evidências deste destaque (vazio = texto comum). */
  ids: string[];
  /** Maior nota entre as categorias do destaque (usada no filtro de nota mínima). */
  maxScore: number;
  /** Cor do destaque: o peso do trecho, limitado pela nota da categoria. */
  tone: Tone;
}

/**
 * Divide o texto em pedaços. Trechos apontados que se sobrepõem (inclusive o
 * mesmo trecho em várias categorias) viram UM destaque só, com todas as
 * explicações. `hideMild` esconde os destaques de sinal leve (cor clara).
 */
export function buildSegments(textLength: number, index: Map<string, EvidenceRef>, hideMild = false): Segment[] {
  const evs = [...index.values()]
    .filter((r) => r.evidence.start >= 0) // evidências em imagens não têm posição no texto
    .map((r) => ({ id: r.evidence.id, start: r.evidence.start, end: r.evidence.end, score: r.category.score, rank: evidenceRank(r.evidence, r.category.score) }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  // Agrupa trechos que se sobrepõem.
  const clusters: { start: number; end: number; ids: string[]; maxScore: number; rank: number }[] = [];
  for (const e of evs) {
    const last = clusters[clusters.length - 1];
    if (last && e.start < last.end) {
      last.end = Math.max(last.end, e.end);
      last.ids.push(e.id);
      last.maxScore = Math.max(last.maxScore, e.score);
      last.rank = Math.max(last.rank, e.rank);
    } else {
      clusters.push({ start: e.start, end: e.end, ids: [e.id], maxScore: e.score, rank: e.rank });
    }
  }

  const visible = clusters.filter((c) => !hideMild || c.rank >= 1);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const c of visible) {
    if (c.start > cursor) segments.push({ start: cursor, end: c.start, ids: [], maxScore: 0, tone: "low" });
    segments.push({ start: c.start, end: c.end, ids: c.ids, maxScore: c.maxScore, tone: TONES[c.rank] });
    cursor = c.end;
  }
  if (cursor < textLength) segments.push({ start: cursor, end: textLength, ids: [], maxScore: 0, tone: "low" });
  return segments;
}

/** Quantos destaques existem (todos e só os de sinal médio ou forte). */
export function countHighlights(index: Map<string, EvidenceRef>) {
  const all = buildSegments(Number.MAX_SAFE_INTEGER, index).filter((s) => s.ids.length > 0);
  return { total: all.length, visible: all.filter((s) => s.tone !== "low").length };
}
