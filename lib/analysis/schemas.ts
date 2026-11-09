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
  "opinion",
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
    evidence: { quote: string; explanation: string }[];
  }[];
}

/* Etapa 2 (em paralelo) — visão geral */
export const AxisPositionSchema = z.enum(["left", "right", "unidentified"]);
export type AxisPosition = z.infer<typeof AxisPositionSchema>;

const AxisSchema = z.object({
  position: AxisPositionSchema,
  confidence: ConfidenceSchema,
  justification: z.string(),
  quote: z.string(),
});

export const OverviewSchema = z.object({
  economic: AxisSchema,
  social: AxisSchema,
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
});
export type OverviewOutput = z.infer<typeof OverviewSchema>;

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

/* Busca de textos para equilibrar a leitura (Fase 2) */
export const BalanceSchema = z.object({
  articles: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      outlet: z.string(),
      /** Perspectiva ou tipo de fonte (ex.: "visão de centro-direita", "dados oficiais", "checagem"). */
      perspective: z.string(),
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
