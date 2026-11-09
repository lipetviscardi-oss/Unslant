/**
 * ETAPA 2 (em paralelo) — VISÃO GERAL
 * Inclinação política nos dois eixos (econômico e social), proporção de fato
 * vs. opinião e "o que o texto pode estar omitindo".
 */

import type { TriageOutput } from "@/lib/analysis/schemas";
import { contextBlock, languageInstruction } from "./document";

export function overviewPrompt(triage: TriageOutput, lang: "pt" | "en") {
  return `TAREFA: avaliar a inclinação política do documento acima, a proporção de fato vs. opinião e o que ele pode estar omitindo.

${contextBlock({
    "Tipo de texto": triage.contentType,
    País: triage.country,
    "Contexto político": triage.politicalContext,
    Tema: triage.topic,
  })}

1) INCLINAÇÃO POLÍTICA em dois eixos independentes ("economic" e "social").
   Para cada eixo: position ("left", "right" ou "unidentified"), confidence, justification (1 a 3 frases) e quote (um trecho EXATO do documento que sustenta a classificação; "" se position for "unidentified").

   Eixo econômico — esquerda: mais papel do Estado na economia, redistribuição, proteção trabalhista e social, regulação de mercados. Direita: livre mercado, menos impostos e gasto público, privatização, desregulamentação, responsabilidade fiscal como prioridade.
   Eixo social — esquerda: progressismo em costumes, ampliação de direitos de minorias, secularismo, foco em causas estruturais da criminalidade. Direita: conservadorismo em costumes, valores tradicionais e religiosos, ênfase em ordem, punição e segurança.
   Adapte essas definições ao contexto político do país identificado.

   Regras importantes:
   - A inclinação é medida pela forma como o texto trata o tema (o que valoriza, critica, quem trata como herói ou vilão), NÃO pelo tema em si. Uma notícia equilibrada sobre uma política de esquerda não é de esquerda.
   - Use "unidentified" sempre que não houver evidência suficiente. Muitos textos não têm inclinação clara em um ou nos dois eixos — isso é normal e esperado. Não force uma classificação.
   - Aplique o teste de inversão: você classificaria um texto espelhado, com os lados trocados, com a mesma confiança?

2) FATO VS. OPINIÃO: factPercent = estimativa de 0 a 100 da parcela do texto composta por afirmações factuais verificáveis (o restante é opinião, interpretação ou previsão). explanation: 1 a 2 frases.

3) O QUE O TEXTO PODE ESTAR OMITINDO: até 5 itens (omissions), cada um com "title" (curto) e "explanation" (1 a 2 frases). Pense em: dados de comparação, versão de partes envolvidas, contexto histórico, consequências para outros grupos, incertezas. Baseie-se em conhecimento geral amplamente aceito; não invente fatos específicos. Lista vazia se nada relevante faltar.

${languageInstruction(lang)}`;
}
