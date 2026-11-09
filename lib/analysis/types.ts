/**
 * Formato do RESULTADO FINAL de uma análise — o que o site mostra na tela.
 * Este formato também é o que será salvo no banco de dados na Fase 4.
 */

import type { AxisPosition, BalanceOutput, CategoryStatus, ClaimCheckOutput, Confidence, ContentType } from "./schemas";
import type { Lang } from "@/lib/taxonomy";

export type SourceType = "url" | "text" | "pdf" | "claim";

export interface SourceInfo {
  type: SourceType;
  url?: string;
  title?: string;
  author?: string;
  /** Nome do veículo/site. */
  outlet?: string;
  publishedAt?: string;
  /** Afirmações: onde a pessoa viu ou ouviu (informado pelo usuário). */
  claimContext?: string;
}

export interface Evidence {
  /** Identificador único dentro da análise (ex.: "loaded_language-2"). */
  id: string;
  quote: string;
  explanation: string;
  /** Posição do trecho no texto analisado (para destacar). */
  start: number;
  end: number;
}

export interface CategoryResult {
  id: string;
  status: CategoryStatus;
  score: number;
  confidence: Confidence;
  summary: string;
  evidence: Evidence[];
  /** Evidências descartadas porque o trecho não foi encontrado no texto. */
  discarded: number;
}

export interface GroupResult {
  id: string;
  /** null quando nenhuma categoria do grupo se aplica. */
  score: number | null;
  categories: CategoryResult[];
}

export interface AxisResult {
  position: AxisPosition;
  confidence: Confidence;
  justification: string;
  quote: string;
  start: number | null;
  end: number | null;
}

export interface AnalysisResult {
  /** Versão do formato, para compatibilidade futura. */
  schemaVersion: 1;
  id: string;
  createdAt: string;
  /** Idioma do relatório. */
  language: Lang;
  /** Identifica a versão dos prompts/taxonomia usada. */
  promptVersion: string;
  /** true quando é um exemplo pronto (sem chamar a IA). */
  demo: boolean;

  source: SourceInfo & { wordCount: number };
  context: {
    contentType: ContentType;
    country: string;
    countryCode: string;
    politicalContext: string;
    topic: string;
    contentSummary: string;
    documentLanguage: string;
  };

  /** O texto exatamente como foi analisado (os destaques apontam para ele). */
  text: string;

  overall: { score: number; label: string; simpleLabel: string };
  political: { economic: AxisResult; social: AxisResult };
  factOpinion: { factPercent: number; explanation: string };
  summary: string;
  summarySimple: string;
  omissions: { title: string; explanation: string }[];
  rewrite: {
    evidenceId: string;
    original: string;
    rewritten: string;
    explanation: string;
    start: number;
    end: number;
  } | null;
  groups: GroupResult[];
  /** Só para afirmações: o que se sabe, de onde a ideia vem, como verificar. */
  claimCheck?: ClaimCheckOutput | null;
  /**
   * "Para equilibrar sua leitura": textos reais encontrados na web + outras
   * sugestões. status: "ok", "unavailable" (a busca falhou), "disabled"
   * (desligada em config) ou "demo" (exemplo pronto, sem busca).
   */
  balance?: { status: "ok" | "unavailable" | "disabled" | "demo"; data: BalanceOutput | null };

  stats: {
    model: string;
    parts: number;
    durationMs: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    estimatedCostUsd: number;
    webSearches?: number;
    discardedEvidence: number;
    fromCache: boolean;
  };
}

/** Eventos enviados ao navegador durante a análise (barra de progresso). */
export type ProgressStage = "extracting" | "context" | "analyzing" | "synthesizing" | "balancing";

export type StreamEvent =
  | { type: "stage"; stage: ProgressStage; done?: number; total?: number }
  | { type: "result"; result: AnalysisResult }
  | { type: "error"; code: string; message: string };
