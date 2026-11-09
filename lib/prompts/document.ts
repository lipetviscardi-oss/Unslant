/**
 * Monta o "bloco do documento": o texto analisado e seus dados (título,
 * veículo...). Esse bloco é igual em todas as etapas da mesma análise, o que
 * permite à Anthropic reaproveitá-lo ("cache") e cobrar ~90% menos por ele
 * a partir da segunda etapa.
 */

import type { SourceInfo } from "@/lib/analysis/types";

export function buildDocumentBlock(text: string, source: SourceInfo, part?: { index: number; total: number }) {
  const meta: string[] = [];
  if (source.title) meta.push(`Título informado: ${source.title}`);
  if (source.outlet) meta.push(`Veículo: ${source.outlet}`);
  if (source.author) meta.push(`Autor: ${source.author}`);
  if (source.publishedAt) meta.push(`Data: ${source.publishedAt}`);
  if (source.url) meta.push(`Endereço: ${source.url}`);
  meta.push(`Origem: ${source.type === "url" ? "página da web" : source.type === "pdf" ? "arquivo PDF" : "texto colado pelo usuário"}`);
  if (part && part.total > 1) {
    meta.push(`Atenção: este é o trecho ${part.index + 1} de ${part.total} de um documento longo. Analise apenas este trecho.`);
  }

  return `<metadados>
${meta.join("\n")}
</metadados>

<documento>
${text}
</documento>`;
}

export function languageInstruction(lang: "pt" | "en") {
  return lang === "pt"
    ? "Escreva todos os textos da resposta (explicações, resumos, justificativas) em português do Brasil. As citações (campo de trecho/quote) devem permanecer no idioma original do documento, copiadas exatamente."
    : "Write every text field of your answer (explanations, summaries, justifications) in English. Quotes (the quote fields) must stay in the document's original language, copied exactly.";
}
