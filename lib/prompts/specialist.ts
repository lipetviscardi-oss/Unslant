/**
 * ETAPA 2 — ESPECIALISTAS
 * Cada chamada analisa alguns grupos da taxonomia de uma vez (ver
 * config.ai.specialistBundles). Todas as chamadas rodam ao mesmo tempo.
 * As categorias e orientações vêm de lib/taxonomy.ts.
 */

import type { BiasGroup } from "@/lib/taxonomy";
import type { TriageOutput } from "@/lib/analysis/schemas";
import { config } from "@/lib/config";
import { contextBlock, languageInstruction } from "./document";
import { overviewInstructions } from "./overview";

export function specialistPrompt(groups: BiasGroup[], triage: TriageOutput, lang: "pt" | "en", withOverview = false) {
  const sections = groups
    .map((group) => {
      const categories = group.categories
        .filter((c) => !c.visualOnly) // essas são avaliadas pela etapa "Imagens e gráficos"
        .map((c) => `- ${c.id} — ${c.name.pt}: ${c.description.pt} O que procurar: ${c.aiHint}`)
        .join("\n");
      return `GRUPO "${group.name.pt}" (${group.description.pt})\n${categories}`;
    })
    .join("\n\n");

  return `TAREFA: analise o documento acima SOMENTE quanto aos grupos de viés listados abaixo${withOverview ? " e, depois, faça a visão geral descrita no fim" : ""}.

${contextBlock({
    "Tipo de texto": triage.contentType,
    País: triage.country,
    "Contexto político": triage.politicalContext,
    Época: triage.era ? `${triage.era}${triage.historical ? " (texto histórico: analise com o contexto DESSA época)" : ""}` : "não identificada",
    Tema: triage.topic,
  })}

${sections}

Para CADA categoria acima (de todos os grupos), devolva exatamente uma entrada em "categories", com:
- categoryId: o id da categoria.
- status: "found" (há evidência de problema), "none_found" (o texto tem material para esta categoria e o trata bem) ou "not_applicable" (o texto não tem material para esta categoria). Reveja a regra 2 antes de escolher entre "none_found" e "not_applicable".
- score: nota de 0 a 10 conforme a escala e as referências das regras (use 0 se status não for "found").
- confidence: "low", "medium" ou "high".
- summary: se "found", 1 a 2 frases dizendo o que foi encontrado; se "none_found" ou "not_applicable", no máximo 12 palavras.
- evidence: até ${config.ai.maxEvidencePerCategory} trechos, só os mais representativos. Cada um com "quote" (cópia EXATA do documento, 2 a 40 palavras), "explanation" (por que o trecho mostra o problema e, quando útil, como seria uma versão neutra) e "strength" (o peso DESTE trecho: "weak" = sinal leve, "medium" = sinal claro, "strong" = exemplo intenso e inequívoco). Seja proporcional à nota da categoria: numa categoria com nota moderada, a maioria dos trechos deve ser "weak" ou "medium"; "strong" é para os poucos trechos mais graves. Lista vazia se status não for "found".

Lembre-se: notas altas exigem evidências fortes e recorrentes. Um único caso leve merece nota baixa.
${
  triage.historical
    ? `
TEXTO HISTÓRICO (época: ${triage.era || "não identificada"}): LINGUAGEM DA ÉPOCA
- Cada evidência tem também "eraUsage": "period_norm" se o termo ou a expressão era o uso corrente e comum na época (hoje pode soar ofensivo ou carregado, mas era a forma normal de escrever então); "loaded_then" se era carregado, ofensivo ou propagandístico MESMO para os padrões daquela época; "none" quando a questão não se aplica (não é um problema de vocabulário).
- Na "explanation", diga explicitamente qual dos dois casos é ("linguagem comum na época" ou "uso carregado mesmo para a época") e por quê.
- Isso NÃO significa ignorar o viés: propaganda, desumanização, estereótipos e manipulação continuam sendo apontados normalmente. "period_norm" só diferencia vocabulário de época de uma escolha carregada do autor; um termo "period_norm" deve ter "strength" "weak".
- Julgue com o contexto DAQUELA época: nunca compare com partidos, pessoas ou disputas posteriores.`
    : `- Em "eraUsage", use sempre "none" (o texto é atual).`
}
${withOverview ? `
SEGUNDA PARTE — VISÃO GERAL (campo "overview")
Depois das categorias, avalie o documento inteiro quanto à inclinação política, à proporção de fato vs. opinião e ao que ele pode estar omitindo. Esta parte é independente das categorias acima: avalie-a com o mesmo cuidado.

${overviewInstructions(triage)}` : ""}
${languageInstruction(lang)}`;
}
