/**
 * ============================================================================
 *  LIXO QUE SAI DO TEXTO ANTES DA ANÁLISE (você pode ampliar esta lista)
 * ============================================================================
 *  Cada padrão é uma "expressão regular" entre barras: /assim/i (o "i" no fim
 *  ignora maiúsculas e minúsculas). Um parágrafo CURTO (até 60 palavras) que
 *  combinar com algum padrão é retirado. Parágrafos longos nunca saem por
 *  aqui, para não apagar o texto de verdade.
 *
 *  COMO ACRESCENTAR:
 *   - Lixo que aparece em vários sites → LIXO_GERAL.
 *   - Lixo de um site só → LIXO_POR_SITE, na linha do domínio (sem "www.").
 *     Se o site ainda não estiver na lista, copie uma linha e troque o domínio.
 *   - Anúncios de editoras em PDFs de papers → LIXO_DE_EDITORAS.
 *  Dica: ^ quer dizer "começa com"; $ quer dizer "termina com";
 *  \s+ é um ou mais espaços; (a|b) é "a" ou "b"; \. é um ponto de verdade.
 * ============================================================================
 */

/** Lixo comum a muitos sites: newsletter, pedido de apoio/doação, redes sociais. */
export const LIXO_GERAL: RegExp[] = [
  // Newsletter e e-mail
  /^receba (por e-?mail|no (seu )?e-?mail|nossa newsletter)/i,
  /^(boletim|newsletter)\b.{0,40}$/i,
  /\b(cadastre seu e-?mail|inscreva-se (na|em) nossa newsletter|sign up for our newsletter|get our newsletter)\b/i,
  // Pedido de apoio ou doação
  /\b(apoia\.se|catarse\.me|patreon\.com|benfeitoria\.com|buymeacoffee\.com)\b/i,
  /\b(dependemos de (voc[êe]|nossos leitores)|seja (um[a]? )?apoiador|torne-se (um[a]? )?apoiador|fa[çc]a parte do nosso grupo de apoiadores|apoie o jornalismo|contribua com o nosso trabalho)\b/i,
  /\b(support (us|our work)|become a (supporter|member)|make a donation|donate (now|today))\b/i,
  // Redes sociais
  /^(siga[- ]nos|follow us) (no|nas|on)\b/i,
];

/** Lixo de sites específicos. A chave é o domínio sem "www."; vale também para subdomínios. */
export const LIXO_POR_SITE: Record<string, RegExp[]> = {
  "outraspalavras.net": [/^boletim outras palavras$/i, /^receba por e-?mail, diariamente/i, /apoia\.se\/outraspalavras/i],
};

/** Anúncios e rodapés de editoras científicas que aparecem no PDF do paper. */
export const LIXO_DE_EDITORAS: RegExp[] = [
  /submit your (next )?manuscript/i,
  /\b(springeropen\.com|biomedcentral\.com|www\.biomedcentral\.com\/submit)\b/i,
  /convenient online submission|rigorous peer review|immediate publication on acceptance/i,
  /^cite this article as:/i,
];

/** Padrões que valem para um endereço: os gerais, os de editoras e os do site (se houver). */
export function lixoPara(domain?: string): RegExp[] {
  const host = (domain ?? "").toLowerCase().replace(/^www\./, "");
  const site = Object.entries(LIXO_POR_SITE)
    .filter(([d]) => host === d || host.endsWith(`.${d}`))
    .flatMap(([, rules]) => rules);
  return [...LIXO_GERAL, ...LIXO_DE_EDITORAS, ...site];
}
