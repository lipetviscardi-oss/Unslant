/**
 * Formato do RESULTADO FINAL de uma análise — o que o site mostra na tela.
 * Este formato também é o que será salvo no banco de dados na Fase 4.
 */

import type {
  AxisPosition,
  BalanceOutput,
  CategoryStatus,
  ClaimCheckOutput,
  Confidence,
  ContentType,
  DisputeStatus,
  FigureKind,
} from "./schemas";
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
  /** Seção/editoria indicada pela própria página (ex.: "Opinião", "Política"). */
  section?: string;
  /** Tipo de texto escolhido pelo usuário no formulário (se escolheu). */
  declaredType?: ContentType;
  /** Lista de referências do paper, separada do texto (não vai para a análise; aparece recolhida na tela). */
  references?: string;
}

export interface Evidence {
  /** Identificador único dentro da análise (ex.: "loaded_language-2"). */
  id: string;
  quote: string;
  explanation: string;
  /** Posição do trecho no texto analisado (para destacar). */
  start: number;
  end: number;
  /** true = o trecho está entre aspas: é fala de alguém citado, não do autor. */
  quoted?: boolean;
  /** Evidência numa imagem (não no texto): id da figura; start/end ficam -1. */
  figureId?: string;
}

/** Uma imagem, gráfico ou tabela analisada pela etapa "Imagens e gráficos". */
export interface FigureResult {
  id: string;
  /** Rótulo para o leitor (ex.: "Página 7", "Imagem 2"). */
  label: string;
  kind: FigureKind;
  description: string;
  relevant: boolean;
  /** Miniatura para a tela: endereço da imagem (links) ou imagem pequena embutida (PDF). */
  thumb?: string;
  /** Legenda encontrada perto da figura, se houver. */
  caption?: string;
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

export interface DisputeResult {
  status: DisputeStatus;
  sideA: string;
  sideB: string;
  /** Intensidade do favorecimento (pode faltar em resultados antigos). */
  strength?: "slight" | "moderate" | "strong";
  confidence: Confidence;
  justification: string;
  quote: string;
  start: number | null;
  end: number | null;
  /** Ressalva: apoia um lado, mas critica parte dele (pode faltar em resultados antigos). */
  caveat?: string;
}

/** Diagnóstico da busca "Para equilibrar sua leitura". */
export interface BalanceDiagnostics {
  rounds: number;
  queries: string[];
  resultsFound: number;
  proposed: number;
  discarded: { url: string; reason: string }[];
  models: string[];
  notes: string[];
}

/** Custo e tokens de cada etapa (para medir onde o dinheiro vai). */
export interface StageCost {
  calls: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
  costUsd: number;
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
    /** Por que o texto recebeu esse tipo (pode faltar em resultados antigos). */
    contentTypeReason?: string;
    /** "user" = escolhido pelo usuário; "ai" = identificado pela IA. */
    contentTypeSource?: "user" | "ai";
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
  /** dispute pode faltar em resultados antigos (antes da versão com disputa). */
  political: { economic: AxisResult; social: AxisResult; dispute?: DisputeResult };
  factOpinion: { factPercent: number; explanation: string };
  summary: string;
  summarySimple: string;
  omissions: { title: string; explanation: string }[];
  /** O autor rebate críticas conhecidas: a resposta procede? (pode faltar em resultados antigos). */
  rebuttals?: RebuttalResult[];
  rewrite: {
    evidenceId: string;
    original: string;
    rewritten: string;
    explanation: string;
    start: number;
    end: number;
  } | null;
  /** true = nenhum trecho do autor precisava de reescrita (mostra "Nenhum trecho precisa de reescrita"). */
  rewriteNone?: boolean;
  /**
   * true = versão da análise simples: só o que o modo simples mostra. A
   * análise completa fica no servidor até a pessoa usar a detalhada do dia.
   */
  partial?: boolean;
  /** Imagens, gráficos e tabelas analisados (só quando o conteúdo tinha imagens). */
  figures?: FigureResult[];
  groups: GroupResult[];
  /** Só para afirmações: o que se sabe, de onde a ideia vem, como verificar. */
  claimCheck?: ClaimCheckOutput | null;
  /**
   * "Para equilibrar sua leitura": textos reais encontrados na web + outras
   * sugestões. status: "ok", "unavailable" (a busca falhou), "disabled"
   * (desligada em config) ou "demo" (exemplo pronto, sem busca).
   */
  balance?: {
    status: "ok" | "unavailable" | "disabled" | "demo";
    data: BalanceOutput | null;
    /** De onde veio a linha editorial de cada link (mesma ordem de data.articles). */
    lineSource?: ("table" | "ai")[];
    /** Detalhes da busca (para entender resultados vazios). */
    diagnostics?: BalanceDiagnostics;
  };

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
    /** Custo por etapa (identificação, especialistas, busca...). */
    stages?: Record<string, StageCost>;
    discardedEvidence: number;
    /** Só em testes: "esforço" usado nos especialistas, se diferente do padrão. */
    specialistEffort?: string;
    /** Só em testes: modelo leve nos especialistas ("haiku" ou "mixed"). */
    specialistModel?: string;
    fromCache: boolean;
  };
}

/** Eventos enviados ao navegador durante a análise (barra de progresso). */
export type ProgressStage = "extracting" | "context" | "analyzing" | "synthesizing" | "balancing";

export type StreamEvent =
  | {
      type: "stage";
      stage: ProgressStage;
      done?: number;
      total?: number;
      /** "long" = texto longo, analisado em etapas; "waiting" = esperando o limite por minuto da IA. */
      note?: "long" | "waiting";
    }
  | { type: "result"; result: AnalysisResult; access?: ResultAccess }
  /** Quem tem conta: a análise foi criada em "Minhas análises" e continua mesmo se a página for fechada. */
  | { type: "job"; analysisId: string }
  | { type: "error"; code: string; message: string };

/**
 * O que a pessoa pode ver desta análise (Fase 4). Vai junto com o resultado,
 * mas nunca é guardado no cache.
 */
export interface ResultAccess {
  /** false = limites desligados (Supabase não configurado ou exemplo pronto): pode ver tudo. */
  limitsOn: boolean;
  loggedIn: boolean;
  /** Análise salva em "Minhas análises" (só para quem tem conta). */
  analysisId?: string;
  /** Tipo escolhido no formulário. */
  kind: "simple" | "detailed";
  /** Numa simples: a pessoa já usou a "detalhada do dia" para ver tudo? */
  unlocked: boolean;
  /** Quantas restam hoje (null = sem limites). */
  remaining: { simple: number; detailed: number } | null;
}

export interface RebuttalResult {
  criticism: string;
  authorResponse: string;
  verdict: "valid" | "partly_valid" | "not_valid";
  assessment: string;
  /** Trecho do texto com a resposta do autor (conferido; null se não encontrado). */
  quote: string;
  start: number | null;
  end: number | null;
}
