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

export interface Segment {
  start: number;
  end: number;
  /** Evidências que cobrem este pedaço do texto. */
  ids: string[];
  /** Evidências que COMEÇAM neste pedaço (para rolar a tela até elas). */
  starts: string[];
}

/** Divide o texto em pedaços; cada pedaço sabe quais evidências o cobrem. */
export function buildSegments(textLength: number, index: Map<string, EvidenceRef>): Segment[] {
  const evidences = [...index.values()].map((r) => r.evidence);
  const cuts = new Set<number>([0, textLength]);
  for (const e of evidences) {
    cuts.add(e.start);
    cuts.add(e.end);
  }
  const points = [...cuts].filter((p) => p >= 0 && p <= textLength).sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (end <= start) continue;
    const ids = evidences.filter((e) => e.start < end && e.end > start).map((e) => e.id);
    const starts = evidences.filter((e) => e.start === start).map((e) => e.id);
    segments.push({ start, end, ids, starts });
  }
  return segments;
}
