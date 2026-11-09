/**
 * ETAPA 2 — ESPECIALISTAS
 * Cada grupo da taxonomia (linguagem, fontes, dados...) vira um
 * "especialista" que olha o texto apenas sob aquele ângulo. Todos rodam ao
 * mesmo tempo. As categorias e orientações vêm de lib/taxonomy.ts.
 */

import type { BiasGroup } from "@/lib/taxonomy";
import type { TriageOutput } from "@/lib/analysis/schemas";
import { config } from "@/lib/config";
import { languageInstruction } from "./document";

export function specialistPrompt(group: BiasGroup, triage: TriageOutput, lang: "pt" | "en") {
  const categories = group.categories
    .map((c) => `- ${c.id} — ${c.name.pt}: ${c.description.pt} O que procurar: ${c.aiHint}`)
    .join("\n");

  return `TAREFA: analise o documento acima SOMENTE quanto ao grupo "${group.name.pt}" (${group.description.pt}).

Contexto identificado na etapa anterior:
- Tipo de texto: ${triage.contentType}
- País: ${triage.country}
- Contexto político: ${triage.politicalContext}
- Tema: ${triage.topic}

Categorias deste grupo:
${categories}

Para CADA categoria acima, devolva exatamente uma entrada em "categories", com:
- categoryId: o id da categoria.
- status: "found" (há evidência), "none_found" (aplica-se, mas não há problema) ou "not_applicable" (não faz sentido para este tipo de texto).
- score: nota de 0 a 10 conforme a escala das regras (use 0 se status não for "found").
- confidence: "low", "medium" ou "high".
- summary: 1 a 2 frases dizendo o que foi encontrado, ou por que não há problema / não se aplica.
- evidence: até ${config.ai.maxEvidencePerCategory} trechos, os mais representativos. Cada um com "quote" (cópia EXATA do documento, 2 a 40 palavras) e "explanation" (por que o trecho mostra o problema e, quando útil, como seria uma versão neutra). Lista vazia se status não for "found".

Lembre-se: notas altas exigem evidências fortes e recorrentes. Um único caso leve merece nota baixa.

${languageInstruction(lang)}`;
}
