/**
 * ETAPA 3 — SÍNTESE
 * Recebe o resultado de todos os especialistas (não o texto inteiro) e
 * escreve o resumo geral e a sugestão de reescrita neutra de um trecho.
 */

import { languageInstruction } from "./document";

export function synthesisPrompt(findingsJson: string, lang: "pt" | "en", retryNote = "") {
  return `TAREFA: você recebe abaixo os resultados de uma análise de viés já feita por especialistas. Escreva a síntese final.

<resultados>
${findingsJson}
</resultados>

Preencha:
- COERÊNCIA OBRIGATÓRIA: ao mencionar a disputa política, descreva exatamente a classificação recebida em "inclinacao.disputa" (situacao + intensidade: "slight" = leve, "clear" = clara, "strong" = forte). Se a situação for "balanced", diga que o texto é equilibrado entre os lados; se for "favors_a"/"favors_b", diga qual lado e com qual intensidade. Nunca contradiga essa classificação nem as dos eixos.
- summary: resumo da análise em 3 a 5 frases, para um leitor exigente: principais problemas encontrados (ou a ausência deles), em quais aspectos o texto é sólido, e a inclinação política se houver. Seja equilibrado e específico; não repita números de notas.
- summarySimple: o mesmo em 2 a 3 frases curtas, em linguagem bem simples, para alguém sem familiaridade com o tema.
- rewrite: escolha UM trecho SOMENTE entre as evidências marcadas com "podeReescrever": true (use o "id" dela em evidenceId): o que melhor ilustra o problema principal. Em "rewritten", escreva a versão neutra (mesmo idioma do trecho original). Em "explanation", diga em 1 a 2 frases o que mudou e por quê. Se nenhuma evidência estiver marcada com "podeReescrever", ou se nenhuma tiver um problema real na voz do autor, use evidenceId "" e deixe os outros campos vazios: é melhor não sugerir nada do que reescrever um trecho que não precisa.
  REGRAS DA VERSÃO NEUTRA (obrigatórias):
  - Escolha um trecho escrito pelo próprio jornalista. NUNCA escolha uma evidência marcada como "citacaoDeTerceiro" (fala de alguém entre aspas) nem uma frase que relata o que alguém disse ("disse", "afirmou", "segundo" etc.).
  - Escreva como um trecho de NOTÍCIA neutra, no mesmo estilo e com o mesmo assunto do original: frases afirmativas, objetivas, que poderiam estar publicadas num jornal. NUNCA escreva um comentário sobre o texto: é proibido começar com "O texto", "O autor", "A reportagem" ou equivalentes.
  - Use SOMENTE informações que estão no trecho e no seu "contexto". Não acrescente fontes, números, datas, nomes, estudos ou fatos.
  - Quando a afirmação não tiver fonte, atribua-a a quem a fez, conforme o contexto mostra (ex.: "Flávio afirmou que a medida não tinha precedentes"). Nunca invente uma fonte ("segundo levantamento", "dados mostram", "especialistas dizem").
  - Se a afirmação sem fonte for do próprio autor, reescreva-a de forma descritiva e não categórica, sem transformá-la em fato (ex.: trocar "é a primeira vez na história" por "a medida seria inédita, de acordo com a campanha" apenas se o contexto disser quem defende isso; caso contrário, retire a parte não sustentada).
  - Neutralizar = trocar adjetivos e verbos carregados por termos descritivos, separar fato de opinião e atribuir opiniões a quem as emite.${retryNote ? `
  ATENÇÃO: ${retryNote}` : ""}

Mantenha a mesma imparcialidade das regras: o objetivo é ajudar o leitor, não condenar o autor.

${languageInstruction(lang)}`;
}
