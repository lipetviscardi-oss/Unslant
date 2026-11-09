/**
 * Índice das evidências e divisão do texto em "segmentos" para destacar.
 */

import type { AnalysisResult, CategoryResult, Evidence, GroupResult } from "@/lib/analysis/types";
import { TAXONOMY, type BiasCategory, type BiasGroup } from "@/lib/taxonomy";

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
  /** Maior nota entre as categorias do destaque (define a cor). */
  maxScore: number;
}

/**
 * Divide o texto em pedaços. Trechos apontados que se sobrepõem (inclusive o
 * mesmo trecho em várias categorias) viram UM destaque só, com todas as
 * explicações. `minScore` esconde destaques cuja nota máxima seja menor.
 */
export function buildSegments(textLength: number, index: Map<string, EvidenceRef>, minScore = 0): Segment[] {
  const evs = [...index.values()]
    .map((r) => ({ id: r.evidence.id, start: r.evidence.start, end: r.evidence.end, score: r.category.score }))
    .sort((a, b) => a.start - b.start || b.end - a.end);

  // Agrupa trechos que se sobrepõem.
  const clusters: { start: number; end: number; ids: string[]; maxScore: number }[] = [];
  for (const e of evs) {
    const last = clusters[clusters.length - 1];
    if (last && e.start < last.end) {
      last.end = Math.max(last.end, e.end);
      last.ids.push(e.id);
      last.maxScore = Math.max(last.maxScore, e.score);
    } else {
      clusters.push({ start: e.start, end: e.end, ids: [e.id], maxScore: e.score });
    }
  }

  const visible = clusters.filter((c) => c.maxScore >= minScore);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const c of visible) {
    if (c.start > cursor) segments.push({ start: cursor, end: c.start, ids: [], maxScore: 0 });
    segments.push({ start: c.start, end: c.end, ids: c.ids, maxScore: c.maxScore });
    cursor = c.end;
  }
  if (cursor < textLength) segments.push({ start: cursor, end: textLength, ids: [], maxScore: 0 });
  return segments;
}

/** Quantos destaques existem (com e sem o filtro de nota mínima). */
export function countHighlights(index: Map<string, EvidenceRef>, minScore: number) {
  const all = buildSegments(Number.MAX_SAFE_INTEGER, index).filter((s) => s.ids.length > 0);
  return { total: all.length, visible: all.filter((s) => s.maxScore >= minScore).length };
}
