/**
 * LISTA DE REFERÊNCIAS (papers)
 *
 * Separa a lista de referências do fim do texto. Ela não vai para a análise
 * (não tem viés a analisar e encarece bastante os papers) e aparece na tela
 * recolhida, no botão "Mostrar referências".
 *
 * Regra: um parágrafo que começa com o título da seção ("References",
 * "Referências", "Bibliografia"...) na metade final do texto. Dali até o fim
 * é a lista. Se a lista for pequena demais ou grande demais, nada é cortado.
 */

const HEADING =
  /^(references|reference list|bibliography|works cited|literature cited|cited literature|refer[êe]ncias( bibliogr[áa]ficas)?|bibliografia|obras citadas|referencias( bibliogr[áa]ficas)?)\b[:.]?\s*/i;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

export function splitReferences(text: string): { body: string; references?: string } {
  const paragraphs = text.split(/\n{2,}/);
  const total = words(text);
  if (total < 800) return { body: text };
  let seen = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    // Só na metade final do texto, e o parágrafo tem que ser o título (sozinho ou já seguido do item "1.").
    if (seen >= total * 0.5 && HEADING.test(p) && (words(p) <= 4 || /^\S+(\s+\S+)?[:.]?\s+(\[?1[.\])]|[A-Z][\p{L}'-]+,)/u.test(p))) {
      const body = paragraphs.slice(0, i).join("\n\n").trim();
      const references = paragraphs.slice(i).join("\n\n").replace(HEADING, "").trim();
      const refWords = words(references);
      // Lista de verdade: pelo menos umas 40 palavras e no máximo metade do documento.
      if (refWords < 40 || refWords > total * 0.5) return { body: text };
      return { body, references };
    }
    seen += words(p);
  }
  return { body: text };
}
