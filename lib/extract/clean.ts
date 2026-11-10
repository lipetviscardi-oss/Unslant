/**
 * LIMPEZA DO TEXTO ANTES DA ANÁLISE
 *
 * Remove o que não faz parte da matéria: chamadas de newsletter e assinatura,
 * propaganda do próprio veículo, blocos de "leia também" e listas de tags no
 * fim. A regra é conservadora: só parágrafos CURTOS que começam com essas
 * chamadas (ou listas no fim do texto) saem; frases normais do texto ficam.
 */

/** Chamadas típicas no começo de um parágrafo (inglês e português). */
const PROMO_START =
  /^(sign up|subscribe|get (our|the|a) .{0,40}newsletter|newsletter|join (our|the|us)|support (?:(?:our|independent|nonprofit|local) )+journalism|donate|become a (member|subscriber|patron)|read more|read next|keep reading|continue reading|related( stories| articles| coverage| content)?\b|recommended( for you)?|more from|more stories|you (might|may) also like|also read|see also|share (this|on)|follow us|click here|advertisement|sponsored content|download (our|the) app|listen to (this|our)|watch:|assine|inscreva-se|cadastre-se|receba (as|nossas|a|o|grátis)|leia (também|mais)|veja (também|mais)|saiba mais|relacionad[ao]s|mais lidas|continua (?:após|depois d[ae])\s*(?:a\s+)?publicidade|publicidade|siga (o|a|nos|nosso)|compartilhe|clique aqui|ouça (o|a|este)|assista|baixe o app)\b/i;

/** Chamadas que aparecem no meio de um parágrafo curto ("Sign up for the free X Daily"). */
const PROMO_ANYWHERE =
  /\b(sign up for|subscribe to (our|the)|our (free )?newsletter|in your inbox|inscreva-se (na|em)|nossa newsletter|assine (a|o|já)|receba (as )?not[íi]cias)\b/i;

/** Lista de tags/temas com rótulo ("Tags: …", "Topics: …", "Tópicos: …", "Filed under …"). */
const TAG_LINE = /^(tags?|topics?|filed under|categories|categorias|t[óo]picos|assuntos|temas|palavras-chave|keywords)\s*[:|]/i;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
/** Parágrafo com cara de tag ou título de link: curto e sem pontuação final de frase. */
const looksLikeTag = (p: string) => words(p) <= 6 && !/[.!?:;"”»]$/.test(p.trim()) && !/^["“«]/.test(p.trim());
const looksLikeHeadline = (p: string) => words(p) <= 20 && !/[.!?"”»]$/.test(p.trim());

export function cleanArticleText(text: string): { text: string; removed: string[] } {
  const paragraphs = text.split(/\n{2,}/);
  const keep: boolean[] = paragraphs.map(() => true);
  const removed: string[] = [];
  const drop = (i: number) => {
    if (keep[i]) {
      keep[i] = false;
      removed.push(paragraphs[i].slice(0, 80));
    }
  };

  paragraphs.forEach((raw, i) => {
    const p = raw.trim();
    if (!p) return;
    const short = words(p) <= 40;
    if ((short && PROMO_START.test(p)) || (short && PROMO_ANYWHERE.test(p)) || (words(p) <= 60 && TAG_LINE.test(p))) {
      drop(i);
      // Depois de "Leia também"/"Related", os títulos de links que vêm em seguida também saem (até 6).
      if (/^(read more|read next|related|recommended|more from|more stories|also read|see also|leia (também|mais)|veja (também|mais)|relacionad|mais lidas|saiba mais)/i.test(p)) {
        for (let k = i + 1; k < paragraphs.length && k <= i + 6 && looksLikeHeadline(paragraphs[k]); k++) drop(k);
      }
    }
  });

  // Lista de tags no fim do texto: 3 ou mais parágrafos seguidos com cara de tag.
  let end = paragraphs.length - 1;
  while (end >= 0 && !paragraphs[end].trim()) end--;
  let start = end;
  while (start >= 0 && (looksLikeTag(paragraphs[start]) || !keep[start])) start--;
  const tagRun = paragraphs.slice(start + 1, end + 1).filter((p, k) => keep[start + 1 + k] && looksLikeTag(p));
  if (tagRun.length >= 3 && start >= 0) for (let k = start + 1; k <= end; k++) drop(k);

  // Segurança: se a limpeza fosse tirar quase tudo, devolve o texto original.
  const cleaned = paragraphs.filter((_, i) => keep[i]).join("\n\n");
  if (words(cleaned) < words(text) * 0.5) return { text, removed: [] };
  return { text: cleaned, removed };
}
