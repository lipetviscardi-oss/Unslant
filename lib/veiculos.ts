/**
 * ============================================================================
 *  LINHA EDITORIAL DOS VEÍCULOS (seção "Para equilibrar sua leitura")
 * ============================================================================
 *  Esta tabela tem prioridade sobre a estimativa da IA. Quando um veículo
 *  sugerido estiver aqui, o site usa a classificação da tabela; quando não
 *  estiver, usa a estimativa da IA e mostra "estimativa".
 *
 *  Vem preenchida só com fontes sem disputa política (governo, tribunais,
 *  Congresso, institutos oficiais, agências de checagem e de notícias).
 *  A classificação política de jornais e sites (esquerda, centro, direita...)
 *  é uma decisão editorial do unslant: acrescente aqui as que você definir.
 *
 *  COMO ACRESCENTAR: copie uma linha e troque o domínio (sem "www.") e a linha.
 *  Um domínio também vale para os subdomínios (ex.: "jus.br" vale para
 *  "stf.jus.br"). Linhas possíveis:
 *    "left" (esquerda), "center_left" (centro-esquerda), "center" (centro),
 *    "center_right" (centro-direita), "right" (direita),
 *    "institutional" (institucional/oficial), "legal" (jurídico),
 *    "fact_check" (checagem), "academic" (acadêmico),
 *    "wire" (agência de notícias), "international" (internacional)
 * ============================================================================
 */

import type { EditorialLine } from "@/lib/analysis/schemas";

export const OUTLETS: Record<string, EditorialLine> = {
  // Governo, Congresso e institutos oficiais
  "gov.br": "institutional",
  "leg.br": "institutional",
  "ibge.gov.br": "institutional",
  "ipea.gov.br": "institutional",
  // Justiça
  "jus.br": "legal",
  "conjur.com.br": "legal",
  "migalhas.com.br": "legal",
  "jota.info": "legal",
  // Checagem de fatos
  "aosfatos.org": "fact_check",
  "lupa.uol.com.br": "fact_check",
  "lupa.news": "fact_check",
  "apublica.org": "fact_check",
  // Agências de notícias
  "agenciabrasil.ebc.com.br": "wire",
  "reuters.com": "wire",
  "apnews.com": "wire",
  "afp.com": "wire",
  // Acadêmico
  "scielo.br": "academic",
  "scielo.org": "academic",
};

/** Procura o domínio (e os domínios "pais") na tabela. */
export function lookupOutlet(host: string): EditorialLine | undefined {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (OUTLETS[candidate]) return OUTLETS[candidate];
  }
  return undefined;
}
