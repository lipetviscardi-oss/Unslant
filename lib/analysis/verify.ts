/**
 * CONFERÊNCIA DE CITAÇÕES
 *
 * Cada trecho que a IA cita como evidência é procurado no texto original.
 * Se não for encontrado, a evidência é DESCARTADA. Isso impede que a IA
 * "invente" citações e permite destacar os trechos na tela.
 *
 * A busca tolera pequenas diferenças que não mudam o sentido: aspas curvas
 * vs. retas, travessões vs. hífens, espaços e quebras de linha, e
 * maiúsculas/minúsculas (como último recurso).
 */

interface Normalized {
  /** Texto normalizado. */
  text: string;
  /** Para cada caractere do texto normalizado, sua posição no original. */
  map: number[];
}

function normChar(ch: string): string {
  switch (ch) {
    case "“": case "”": case "„": case "‟": case "«": case "»": case "″":
      return '"';
    case "‘": case "’": case "‚": case "‛": case "′": case "`": case "´":
      return "'";
    case "–": case "—": case "‒": case "―": case "−":
      return "-";
    case " ":
      return " ";
    default:
      return ch;
  }
}

function normalize(input: string): Normalized {
  const out: string[] = [];
  const map: number[] = [];
  let prevSpace = true; // remove espaços do início
  for (let i = 0; i < input.length; i++) {
    let ch = input[i];
    if (ch === "…") {
      // reticências como caractere único -> "..."
      for (let k = 0; k < 3; k++) {
        out.push(".");
        map.push(i);
      }
      prevSpace = false;
      continue;
    }
    ch = normChar(ch);
    if (/\s/.test(ch)) {
      if (prevSpace) continue;
      out.push(" ");
      map.push(i);
      prevSpace = true;
      continue;
    }
    out.push(ch);
    map.push(i);
    prevSpace = false;
  }
  // remove espaço final
  if (out.length && out[out.length - 1] === " ") {
    out.pop();
    map.pop();
  }
  return { text: out.join(""), map };
}

function cleanQuote(quote: string): string {
  let q = quote.trim();
  // remove aspas que a IA às vezes coloca em volta do trecho
  q = q.replace(/^["'“”‘’«»]+/, "").replace(/["'“”‘’«»]+$/, "");
  return q.trim();
}

export interface QuoteMatcher {
  find(quote: string): { start: number; end: number } | null;
}

export function createQuoteMatcher(original: string): QuoteMatcher {
  const norm = normalize(original);
  const lower = norm.text.toLowerCase();
  // Só usamos a busca sem maiúsculas se o tamanho não mudar (vale para quase todos os idiomas).
  const lowerSafe = lower.length === norm.text.length;

  function toOriginal(nStart: number, nLen: number) {
    const start = norm.map[nStart];
    const lastIdx = norm.map[nStart + nLen - 1];
    return { start, end: lastIdx + 1 };
  }

  function search(q: string): { start: number; end: number } | null {
    const nq = normalize(q).text;
    if (nq.length < 3) return null;
    let idx = norm.text.indexOf(nq);
    if (idx === -1 && lowerSafe) idx = lower.indexOf(nq.toLowerCase());
    if (idx === -1) return null;
    return toOriginal(idx, nq.length);
  }

  return {
    find(rawQuote: string) {
      const quote = cleanQuote(rawQuote);
      if (!quote) return null;

      const direct = search(quote);
      if (direct) return direct;

      // A IA juntou partes com reticências: aceita se TODAS as partes
      // existirem no texto, na ordem, próximas umas das outras.
      const pieces = quote.split(/\s*(?:\.\.\.|…|\[\.\.\.\])\s*/).filter((p) => p.trim().length >= 3);
      if (pieces.length >= 2) {
        let cursor = 0;
        let first: { start: number; end: number } | null = null;
        let last: { start: number; end: number } | null = null;
        for (const piece of pieces) {
          const nq = normalize(piece).text;
          let idx = norm.text.indexOf(nq, cursor);
          if (idx === -1 && lowerSafe) idx = lower.indexOf(nq.toLowerCase(), cursor);
          if (idx === -1) return null;
          const pos = toOriginal(idx, nq.length);
          if (!first) first = pos;
          if (last && pos.start - last.end > 400) return null; // partes distantes demais
          last = pos;
          cursor = idx + nq.length;
        }
        if (first && last) return { start: first.start, end: last.end };
      }
      return null;
    },
  };
}
