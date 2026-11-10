/**
 * Formatos (esquemas) das respostas da IA em cada etapa.
 *
 * A IA é obrigada a responder exatamente nesses formatos (recurso
 * "structured outputs" da Anthropic) e o zod confere cada resposta. Se algo
 * vier fora do formato, a etapa é repetida uma vez.
 *
 * Observação técnica: a API não aceita limites numéricos (mín./máx.) nos
 * esquemas, então notas e percentuais são ajustados para a faixa certa no
 * código (ver clamp em scoring.ts).
 */

import { z } from "zod";

export const ConfidenceSchema = z.enum(["low", "medium", "high"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const ContentTypeSchema = z.enum([
  "news",
  "feature",
  "opinion",
  "editorial",
  "analysis",
  "academic_paper",
  "press_release",
  "blog",
  "other",
  "claim",
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/* Etapa 1 — identificação */
export const TriageSchema = z.object({
  contentType: ContentTypeSchema,
  /** Uma frase explicando por que o texto recebeu esse tipo. */
  contentTypeReason: z.string(),
  country: z.string(),
  countryCode: z.string(),
  politicalContext: z.string(),
  documentLanguage: z.string(),
  topic: z.string(),
  contentSummary: z.string(),
  title: z.string(),
  author: z.string(),
  outlet: z.string(),
  publishedAt: z.string(),
});
export type TriageOutput = z.infer<typeof TriageSchema>;

/* Etapa 2 — especialistas (um esquema por grupo, com os ids das categorias) */
export const CategoryStatusSchema = z.enum(["found", "none_found", "not_applicable"]);
export type CategoryStatus = z.infer<typeof CategoryStatusSchema>;

export function specialistSchema(categoryIds: readonly [string, ...string[]]) {
  return specialistBase(categoryIds);
}

/** Pacote de especialistas que também faz a visão geral (uma chamada a menos). */
export function specialistWithOverviewSchema(categoryIds: readonly [string, ...string[]]) {
  return specialistBase(categoryIds).extend({ overview: OverviewSchema });
}

function specialistBase(categoryIds: readonly [string, ...string[]]) {
  return z.object({
    categories: z.array(
      z.object({
        categoryId: z.enum(categoryIds),
        status: CategoryStatusSchema,
        score: z.number(),
        confidence: ConfidenceSchema,
        summary: z.string(),
        evidence: z.array(
          z.object({
            quote: z.string(),
            explanation: z.string(),
            /** Peso deste trecho: sinal leve, médio ou forte do problema. */
            strength: z.enum(["weak", "medium", "strong"]),
          }),
        ),
      }),
    ),
  });
}
export interface SpecialistOutput {
  categories: {
    categoryId: string;
    status: CategoryStatus;
    score: number;
    confidence: Confidence;
    summary: string;
    evidence: { quote: string; explanation: string; strength?: "weak" | "medium" | "strong" }[];
  }[];
}

/* Etapa 2 (em paralelo) — visão geral */
export const AxisPositionSchema = z.enum(["left", "right", "unidentified", "not_applicable"]);
export type AxisPosition = z.infer<typeof AxisPositionSchema>;

const AxisSchema = z.object({
  position: AxisPositionSchema,
  confidence: ConfidenceSchema,
  justification: z.string(),
  quote: z.string(),
});

export const DisputeStatusSchema = z.enum(["favors_a", "favors_b", "balanced", "unidentified", "not_applicable"]);
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>;

const DisputeSchema = z.object({
  status: DisputeStatusSchema,
  /** Lado que está no poder / ocupa o cargo. */
  sideA: z.string(),
  /** Lado de fora (oposição, desafiante). */
  sideB: z.string(),
  /** Intensidade do favorecimento (só vale para favors_a / favors_b). */
  strength: z.enum(["slight", "moderate", "strong"]),
  confidence: ConfidenceSchema,
  justification: z.string(),
  quote: z.string(),
  /** Ressalva: o texto apoia um lado, mas critica parte dele ("" se não houver). */
  caveat: z.string(),
});

/** O autor rebate uma crítica conhecida: a resposta procede? */
const RebuttalSchema = z.object({
  criticism: z.string(),
  authorResponse: z.string(),
  verdict: z.enum(["valid", "partly_valid", "not_valid"]),
  assessment: z.string(),
  quote: z.string(),
});

export const OverviewSchema = z.object({
  economic: AxisSchema,
  social: AxisSchema,
  dispute: DisputeSchema,
  factOpinion: z.object({
    factPercent: z.number(),
    explanation: z.string(),
  }),
  omissions: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
    }),
  ),
  rebuttals: z.array(RebuttalSchema),
});
export type OverviewOutput = z.infer<typeof OverviewSchema>;

/* Etapa 2 (em paralelo) — imagens e gráficos */
export const FigureKindSchema = z.enum(["chart", "table", "photo", "illustration", "diagram", "map", "infographic", "other"]);
export type FigureKind = z.infer<typeof FigureKindSchema>;

/** Os ids das figuras viram uma lista fechada: a IA só pode citar figuras que recebeu. */
export function visualSchema(figureIds: readonly [string, ...string[]], categoryIds: readonly [string, ...string[]]) {
  return z.object({
    figures: z.array(
      z.object({
        figureId: z.enum(figureIds),
        kind: FigureKindSchema,
        /** O que a figura mostra, em 1 a 2 frases. */
        description: z.string(),
        /** false = decorativa ou sem relação com o assunto. */
        relevant: z.boolean(),
      }),
    ),
    findings: z.array(
      z.object({
        categoryId: z.enum(categoryIds),
        figureId: z.enum(figureIds),
        score: z.number(),
        confidence: ConfidenceSchema,
        explanation: z.string(),
        /** Trecho EXATO do texto que a figura contradiz ou ilustra ("" se nenhum). */
        textQuote: z.string(),
      }),
    ),
  });
}
export interface VisualOutput {
  figures: { figureId: string; kind: FigureKind; description: string; relevant: boolean }[];
  findings: {
    categoryId: string;
    figureId: string;
    score: number;
    confidence: Confidence;
    explanation: string;
    textQuote: string;
  }[];
}

/* Etapa 3 — síntese */
export const SynthesisSchema = z.object({
  summary: z.string(),
  summarySimple: z.string(),
  rewrite: z.object({
    evidenceId: z.string(),
    rewritten: z.string(),
    explanation: z.string(),
  }),
});
export type SynthesisOutput = z.infer<typeof SynthesisSchema>;

/* Verificação de afirmação (só na aba "Afirmação") */
export const ClaimCheckSchema = z.object({
  claimType: z.enum(["factual", "opinion", "prediction", "value_judgment", "mixed"]),
  verifiability: z.enum(["verifiable", "partially_verifiable", "not_verifiable"]),
  assessment: z.enum(["consistent", "partially_consistent", "inconsistent", "insufficient_evidence", "not_applicable"]),
  confidence: ConfidenceSchema,
  whatIsKnown: z.string(),
  possibleOrigins: z.string(),
  howToVerify: z.array(z.string()),
  moreAccurateVersion: z.string(),
});
export type ClaimCheckOutput = z.infer<typeof ClaimCheckSchema>;

/* Linha editorial dos veículos sugeridos */
export const EditorialLineSchema = z.enum([
  "left",
  "center_left",
  "center",
  "center_right",
  "right",
  "institutional",
  "legal",
  "fact_check",
  "academic",
  "wire",
  "international",
  "specialized",
  "unknown",
]);
export type EditorialLine = z.infer<typeof EditorialLineSchema>;

/* Busca de textos para equilibrar a leitura (Fase 2) */
export const BalanceSchema = z.object({
  articles: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      outlet: z.string(),
      /** Perspectiva ou tipo de fonte (ex.: "visão de centro-direita", "dados oficiais", "checagem"). */
      perspective: z.string(),
      /** Linha editorial do veículo (estimativa da IA; a tabela lib/veiculos.ts tem prioridade). */
      editorialLine: EditorialLineSchema,
      /** Por que este texto equilibra ou complementa o original. */
      why: z.string(),
    }),
  ),
  suggestions: z.array(
    z.object({
      title: z.string(),
      explanation: z.string(),
    }),
  ),
});
export type BalanceOutput = z.infer<typeof BalanceSchema>;
