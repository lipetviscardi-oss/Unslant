/**
 * ETAPA 2 (em paralelo) — VISÃO GERAL
 * Inclinação política (eixos econômico e social + lado favorecido numa
 * disputa), proporção de fato vs. opinião e "o que o texto pode estar
 * omitindo".
 */

import type { TriageOutput } from "@/lib/analysis/schemas";
import { contextBlock, languageInstruction } from "./document";

/** Instruções da visão geral (reaproveitadas quando ela vai junto de um pacote de especialistas). */
export function overviewInstructions() {
  return `1) EIXOS IDEOLÓGICOS ("economic" e "social")
   Para cada eixo: position, confidence, justification (1 a 3 frases) e quote (trecho EXATO do documento que sustenta a classificação; "" se position não for "left" ou "right").
   position:
   - "not_applicable" quando o TEMA do texto não envolve aquele eixo. O eixo econômico só se aplica se o texto trata de economia, impostos, gasto público, trabalho, mercado, regulação, privatização, renda etc. O eixo social só se aplica se o texto trata de costumes, valores, religião, direitos de minorias, segurança pública/punição, drogas, família etc. Uma disputa eleitoral, um escândalo ou uma briga entre políticos NÃO é, por si só, tema econômico ou social.
   - "unidentified" quando o tema envolve o eixo, mas o texto não toma partido de forma identificável.
   - "left" ou "right" só com evidência clara.

   Eixo econômico — esquerda: mais papel do Estado na economia, redistribuição, proteção trabalhista e social, regulação. Direita: livre mercado, menos impostos e gasto público, privatização, desregulamentação, responsabilidade fiscal como prioridade.
   Eixo social — esquerda: progressismo em costumes, ampliação de direitos de minorias, secularismo, foco em causas estruturais da criminalidade. Direita: conservadorismo em costumes, valores tradicionais e religiosos, ênfase em ordem, punição e segurança.
   Adapte essas definições ao contexto político do país identificado. A inclinação é medida pela forma como o texto trata o tema (o que valoriza, critica, quem trata como herói ou vilão), NÃO pelo tema em si.

2) DISPUTA ("dispute") — viés partidário ou eleitoral
   Use quando o texto envolve uma disputa concreta entre dois lados identificáveis: governo × oposição, candidato A × candidato B, partido X × partido Y, prefeito × câmara etc.
   - sideA: SEMPRE o lado que está no poder ou ocupa o cargo em questão (governo, prefeitura, atual mandatário, quem foi eleito). sideB: SEMPRE o lado de fora (oposição, desafiante, críticos). Em eleições sem mandatário, sideA é o candidato citado primeiro no texto. Escreva nomes curtos e neutros (ex.: "Prefeitura de Vale Verde", "Oposição na Câmara").
   - status: "favors_a" ou "favors_b" sempre que houver QUALQUER inclinação perceptível para um lado, mesmo leve (mais espaço, linguagem mais positiva, versão do outro lado minimizada ou deixada para o fim); "balanced" SOMENTE se os dois lados recebem tratamento realmente equivalente, sem inclinação nenhuma; "unidentified" (há disputa, mas não dá para afirmar); "not_applicable" (não há disputa entre lados identificáveis; deixe sideA e sideB vazios).
   - strength: intensidade do favorecimento — "slight" (leve: o texto é quase equilibrado, mas pende um pouco), "moderate" (moderada: a inclinação é perceptível em vários pontos) ou "strong" (forte: o texto funciona como peça de um dos lados). Se o status não for favors_a/favors_b, use "slight".
   - COERÊNCIA: a justificativa deve descrever exatamente a classificação escolhida. Se você escrever que o texto "pende", "inclina" ou "favorece" algum lado, o status NÃO pode ser "balanced".
   - confidence, justification (1 a 3 frases) e quote (trecho EXATO que sustenta a classificação; "" se status não for "favors_a" ou "favors_b").
   - caveat (ressalva): se o texto favorece um lado mas CRITICA uma parte desse mesmo lado (ex.: defende o governo Lula e o seu eleitorado, mas ataca a equipe econômica do próprio governo), descreva isso em até 15 palavras, começando com "mas" (ex.: "mas critica a equipe econômica do próprio governo"). Se não houver crítica relevante ao lado favorecido, use "". Também use "" se o status não for favors_a/favors_b.
   - Mesma régua para os dois lados: os critérios para "favors_a" e "favors_b" são idênticos. Faça o teste de inversão: com os lados trocados no texto, você daria a classificação oposta com a mesma confiança? Se não, use "unidentified".

3) FATO VS. OPINIÃO: factPercent = estimativa de 0 a 100 da parcela do texto composta por afirmações factuais verificáveis (o restante é opinião, interpretação ou previsão). explanation: 1 a 2 frases.

4) O QUE O TEXTO PODE ESTAR OMITINDO: até 5 itens (omissions), cada um com "title" (curto) e "explanation" (1 a 2 frases). Pense em: dados de comparação, versão de partes envolvidas, contexto histórico, consequências para outros grupos, incertezas. Baseie-se em conhecimento geral amplamente aceito; não invente fatos específicos. Lista vazia se nada relevante faltar.

5) RESPOSTAS DO AUTOR A CRÍTICAS ("rebuttals"): quando o próprio texto rebate uma crítica conhecida ao seu argumento ou ao seu estudo (ex.: "a Monsanto usou o mesmo número de ratos"), avalie a resposta com equilíbrio: até 4 itens, cada um com
   - criticism: a crítica, em 1 frase;
   - authorResponse: o que o autor responde, em 1 frase;
   - verdict: "valid" (a resposta procede), "partly_valid" (procede em parte) ou "not_valid" (não procede);
   - assessment: 1 a 3 frases dizendo ATÉ ONDE a resposta procede e o que ela não resolve (ex.: "Procede como comparação com o estudo de referência, mas não resolve o baixo poder estatístico de 10 ratos por grupo para tumores");
   - quote: trecho EXATO do texto com a resposta do autor.
   Use o conhecimento geral amplamente aceito sobre o tema e a mesma régua para qualquer lado. Lista vazia se o texto não rebate nenhuma crítica.

Muitos textos não têm inclinação em nenhum eixo nem favorecem lado algum. Isso é normal: não force classificações.
`;
}

export function overviewPrompt(triage: TriageOutput, lang: "pt" | "en") {
  return `TAREFA: avaliar a inclinação política do documento acima, a proporção de fato vs. opinião e o que ele pode estar omitindo.

${contextBlock({
    "Tipo de texto": triage.contentType,
    País: triage.country,
    "Contexto político": triage.politicalContext,
    Tema: triage.topic,
  })}

${overviewInstructions()}
${languageInstruction(lang)}`;
}
