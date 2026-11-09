/**
 * Funções de texto usadas no navegador e no servidor.
 */

/**
 * Limpa o texto para análise: quebras de linha padronizadas, sem espaços
 * duplicados, no máximo uma linha em branco entre parágrafos.
 * O texto resultante é exatamente o que a IA lê e o que aparece na tela,
 * por isso os destaques batem com as posições certas.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[​-‍﻿­]/g, "") // caracteres invisíveis e hífen "suave"
    .replace(/ /g, " ") // espaço não separável
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(text: string): number {
  const m = text.match(/\S+/g);
  return m ? m.length : 0;
}

/**
 * Divide textos longos em partes de até `maxWords` palavras, sempre cortando
 * entre parágrafos. Retorna também onde cada parte começa no texto original,
 * para os destaques continuarem na posição certa.
 */
export function splitIntoParts(text: string, maxWords: number): { text: string; offset: number }[] {
  if (countWords(text) <= maxWords) return [{ text, offset: 0 }];

  const parts: { text: string; offset: number }[] = [];
  const paragraphRe = /[^\n]+(\n\n|\n|$)/g;
  let partStart = 0;
  let partWords = 0;
  let lastEnd = 0;
  let m: RegExpExecArray | null;

  while ((m = paragraphRe.exec(text)) !== null) {
    if (m[0].length === 0) {
      paragraphRe.lastIndex++;
      continue;
    }
    const words = countWords(m[0]);
    if (partWords > 0 && partWords + words > maxWords) {
      parts.push({ text: text.slice(partStart, lastEnd).trimEnd(), offset: partStart });
      partStart = m.index;
      partWords = 0;
    }
    partWords += words;
    lastEnd = m.index + m[0].length;
  }
  if (partStart < text.length) {
    parts.push({ text: text.slice(partStart).trimEnd(), offset: partStart });
  }
  return parts;
}
