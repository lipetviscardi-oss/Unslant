/**
 * ETAPA 3 — SÍNTESE
 * Recebe o resultado de todos os especialistas (não o texto inteiro) e
 * escreve o resumo geral e a sugestão de reescrita neutra de um trecho.
 */

import { languageInstruction } from "./document";

export function synthesisPrompt(findingsJson: string, lang: "pt" | "en") {
  return `TAREFA: você recebe abaixo os resultados de uma análise de viés já feita por especialistas. Escreva a síntese final.

<resultados>
${findingsJson}
</resultados>

Preencha:
- summary: resumo da análise em 3 a 5 frases, para um leitor exigente: principais problemas encontrados (ou a ausência deles), em quais aspectos o texto é sólido, e a inclinação política se houver. Seja equilibrado e específico; não repita números de notas.
- summarySimple: o mesmo em 2 a 3 frases curtas, em linguagem bem simples, para alguém sem familiaridade com o tema.
- rewrite: escolha UM trecho entre as evidências listadas (use o "id" dela em evidenceId) que melhor ilustra o problema principal e que possa ser reescrito de forma neutra. Em "rewritten", escreva a versão neutra (mesmo idioma do trecho original, mantendo os fatos). Em "explanation", diga em 1 a 2 frases o que mudou e por quê. Se não houver nenhuma evidência, use evidenceId "" e deixe os outros campos vazios.

Mantenha a mesma imparcialidade das regras: o objetivo é ajudar o leitor, não condenar o autor.

${languageInstruction(lang)}`;
}
