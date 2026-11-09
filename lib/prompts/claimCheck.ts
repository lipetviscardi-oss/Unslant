/**
 * VERIFICAÇÃO DE AFIRMAÇÃO (só na aba "Afirmação")
 *
 * Roda junto com os especialistas. Avalia o que se sabe sobre a afirmação,
 * de onde esse tipo de ideia costuma vir e como a pessoa pode conferir.
 *
 * Importante: nesta fase a IA usa apenas o próprio conhecimento (sem busca
 * na web). Por isso ela é orientada a ser cautelosa e a preferir
 * "evidência insuficiente" quando não tiver segurança.
 */

import type { TriageOutput } from "@/lib/analysis/schemas";
import { contextBlock, languageInstruction } from "./document";

export function claimCheckPrompt(triage: TriageOutput, lang: "pt" | "en") {
  return `TAREFA: o documento acima é uma AFIRMAÇÃO curta que alguém fez ou viu circular (não é um artigo). Avalie a fundamentação dela.

${contextBlock({
    País: triage.country,
    "Contexto político": triage.politicalContext,
    Tema: triage.topic,
  })}

Preencha:
- claimType: "factual" (afirma algo verificável sobre o mundo), "opinion" (opinião), "prediction" (previsão), "value_judgment" (juízo moral ou de valor) ou "mixed".
- verifiability: "verifiable", "partially_verifiable" ou "not_verifiable".
- assessment — o que as evidências disponíveis indicam:
    "consistent" (bate com as evidências conhecidas),
    "partially_consistent" (tem um fundo de verdade, mas é exagerada, simplificada ou generaliza demais),
    "inconsistent" (contradiz as evidências conhecidas),
    "insufficient_evidence" (não há base suficiente para dizer, ou você não tem segurança),
    "not_applicable" (é opinião ou juízo de valor puro, que não se verifica como verdadeiro ou falso).
- confidence: sua confiança nessa avaliação.
- whatIsKnown: 2 a 4 frases com o que se sabe sobre o tema, em termos gerais e amplamente aceitos. NUNCA invente números, estudos, datas ou citações. Se mencionar um dado, ele deve ser amplamente conhecido; na dúvida, descreva a tendência sem número. Lembre que seu conhecimento tem data de corte: se o tema muda rápido, diga isso.
- possibleOrigins: 1 a 3 frases sobre por que essa ideia circula e que tipo de conteúdo costuma reforçá-la (ex.: casos muito noticiados, bordões de um campo político, vídeos virais, experiências pessoais). Nunca julgue nem ridicularize quem acredita nela; aplique a mesma régua a qualquer lado político.
- howToVerify: 2 a 4 fontes ou tipos de dado que a pessoa pode consultar para conferir (ex.: institutos oficiais de estatística do país, agências de checagem, revisões científicas). Prefira instituições reais e reconhecidas; não invente links.
- moreAccurateVersion: reescreva a afirmação de um jeito mais preciso e justo, com as ressalvas necessárias. Se ela já for precisa, repita-a.

Seja cauteloso: em caso de dúvida, use "insufficient_evidence" com confiança "low". É melhor admitir incerteza do que errar com convicção.

${languageInstruction(lang)}`;
}
