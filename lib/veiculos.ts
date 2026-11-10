/**
 * ============================================================================
 *  LINHA EDITORIAL DOS VEÍCULOS (seção "Para equilibrar sua leitura")
 * ============================================================================
 *  Esta lista tem prioridade sobre a estimativa da IA. Quando um veículo
 *  sugerido estiver aqui, o site usa a classificação da lista e mostra um link
 *  para a fonte; quando não estiver, usa a estimativa da IA e mostra
 *  "estimativa".
 *
 *  REGRA: toda classificação política precisa de uma fonte pública conferida.
 *  Fontes usadas (conferidas em 10/11/2026):
 *   - Media Bias/Fact Check (MBFC), escala: LEFT → "left", LEFT-CENTER →
 *     "center_left", LEAST BIASED → "center", RIGHT-CENTER → "center_right",
 *     RIGHT → "right". A mesma régua para todos os veículos avaliados por ela.
 *   - Wikipédia em português, quando o artigo descreve a linha editorial do
 *     veículo (o trecho usado está em "note").
 *  Veículos sem fonte clara (ex.: UOL, CNN Brasil, Veja, Metrópoles, Poder360)
 *  ficam de fora de propósito: a IA estima e o site avisa que é estimativa.
 *
 *  COMO ACRESCENTAR: copie uma linha, troque o domínio (sem "www."), o nome,
 *  a linha e a fonte. Um domínio também vale para os subdomínios
 *  (ex.: "jus.br" vale para "stf.jus.br"); o domínio mais específico vence.
 *  Linhas possíveis:
 *    "left" (esquerda), "center_left" (centro-esquerda), "center" (centro),
 *    "center_right" (centro-direita), "right" (direita),
 *    "institutional" (oficial: governo, Congresso, tribunais, institutos
 *    públicos), "legal" (veículo jurídico), "fact_check" (checagem),
 *    "academic" (acadêmico), "wire" (agência de notícias),
 *    "international" (internacional)
 * ============================================================================
 */

import type { EditorialLine } from "@/lib/analysis/schemas";

export interface OutletInfo {
  name: string;
  line: EditorialLine;
  /** De onde veio a classificação. */
  source: { label: string; url?: string; note?: string };
}

const MBFC = (slug: string, rating: string) => ({
  label: "Media Bias/Fact Check",
  url: `https://mediabiasfactcheck.com/${slug}`,
  note: `Avaliação: ${rating}`,
});
const WIKI = (article: string, quote: string) => ({
  label: "Wikipédia",
  url: `https://pt.wikipedia.org/wiki/${article}`,
  note: quote,
});
const OFFICIAL = (what: string) => ({ label: "Domínio oficial", note: what });

export const OUTLETS: Record<string, OutletInfo> = {
  /* ----------------------------- Brasil ----------------------------- */
  "folha.uol.com.br": { name: "Folha de S.Paulo", line: "center_left", source: MBFC("folha-de-s-paulo-bias-and-credibility/", "LEFT-CENTER") },
  "oglobo.globo.com": { name: "O Globo", line: "center_right", source: MBFC("globo-bias-and-credibility/", "RIGHT-CENTER (Globo)") },
  "g1.globo.com": { name: "g1", line: "center_right", source: MBFC("globo-bias-and-credibility/", "RIGHT-CENTER (Globo)") },
  "estadao.com.br": {
    name: "O Estado de S. Paulo",
    line: "center_right",
    source: WIKI("O_Estado_de_S._Paulo", "editoriais que unem \"conservadorismo político e liberalismo econômico\""),
  },
  "cartacapital.com.br": { name: "CartaCapital", line: "left", source: MBFC("cartacapital-bias-and-credibility/", "LEFT") },
  "brasildefato.com.br": {
    name: "Brasil de Fato",
    line: "left",
    source: WIKI("Brasil_de_Fato", "\"rede de jornalistas [...] de esquerda, sendo uma das publicações oficiais do MST\""),
  },
  "brasil247.com": {
    name: "Brasil 247",
    line: "left",
    source: WIKI("Brasil_247", "\"linha editorial identificada com a esquerda política\""),
  },
  "diariodocentrodomundo.com.br": {
    name: "Diário do Centro do Mundo",
    line: "left",
    source: WIKI("Diário_do_Centro_do_Mundo", "\"site digital político de esquerda\""),
  },
  "operamundi.uol.com.br": {
    name: "Opera Mundi",
    line: "left",
    source: WIKI("Opera_Mundi", "se identifica como \"à esquerda no espectro político\""),
  },
  "revistaoeste.com": {
    name: "Revista Oeste",
    line: "right",
    source: WIKI("Revista_Oeste", "\"linha editorial alinhada à direita\""),
  },
  "oantagonista.com.br": {
    name: "O Antagonista",
    line: "right",
    source: WIKI("O_Antagonista", "\"Está alinhado à direita política.\""),
  },
  "brasilparalelo.com.br": {
    name: "Brasil Paralelo",
    line: "right",
    source: WIKI("Brasil_Paralelo", "conteúdos \"que defendem valores da direita política\""),
  },

  /* -------------------------- Internacionais ------------------------- */
  "nytimes.com": { name: "The New York Times", line: "center_left", source: MBFC("new-york-times/", "LEFT-CENTER") },
  "washingtonpost.com": { name: "The Washington Post", line: "center_left", source: MBFC("washington-post/", "LEFT-CENTER") },
  "wsj.com": { name: "The Wall Street Journal", line: "center_right", source: MBFC("wall-street-journal/", "RIGHT-CENTER") },
  "foxnews.com": { name: "Fox News", line: "right", source: MBFC("fox-news/", "RIGHT") },
  "cnn.com": { name: "CNN", line: "center_left", source: MBFC("cnn/", "LEFT-CENTER") },
  "msnbc.com": { name: "MSNBC", line: "left", source: MBFC("msnbc/", "LEFT") },
  "npr.org": { name: "NPR", line: "center_left", source: MBFC("npr/", "LEFT-CENTER") },
  "abcnews.go.com": { name: "ABC News", line: "center_left", source: MBFC("abc-news/", "LEFT-CENTER") },
  "nbcnews.com": { name: "NBC News", line: "center_left", source: MBFC("nbc-news/", "LEFT-CENTER") },
  "cbsnews.com": { name: "CBS News", line: "center_right", source: MBFC("cbs-news/", "RIGHT-CENTER") },
  "politico.com": { name: "Politico", line: "center_left", source: MBFC("politico/", "LEFT-CENTER") },
  "bloomberg.com": { name: "Bloomberg", line: "center_left", source: MBFC("bloomberg/", "LEFT-CENTER") },
  "vox.com": { name: "Vox", line: "left", source: MBFC("vox/", "LEFT") },
  "nypost.com": { name: "New York Post", line: "center_right", source: MBFC("new-york-post/", "RIGHT-CENTER") },
  "breitbart.com": { name: "Breitbart", line: "right", source: MBFC("breitbart/", "RIGHT") },
  "bbc.com": { name: "BBC", line: "center", source: MBFC("bbc/", "LEAST BIASED") },
  "bbc.co.uk": { name: "BBC", line: "center", source: MBFC("bbc/", "LEAST BIASED") },
  "theguardian.com": { name: "The Guardian", line: "center_left", source: MBFC("the-guardian/", "LEFT-CENTER") },
  "independent.co.uk": { name: "The Independent", line: "center_left", source: MBFC("the-independent/", "LEFT-CENTER") },
  "dailymail.co.uk": { name: "Daily Mail", line: "right", source: MBFC("daily-mail/", "RIGHT") },
  "news.sky.com": { name: "Sky News", line: "center", source: MBFC("sky-news/", "LEAST BIASED") },
  "economist.com": { name: "The Economist", line: "center", source: MBFC("the-economist/", "LEAST BIASED") },
  "ft.com": { name: "Financial Times", line: "center", source: MBFC("financial-times/", "LEAST BIASED") },
  "aljazeera.com": { name: "Al Jazeera", line: "center_left", source: MBFC("al-jazeera/", "LEFT-CENTER") },
  "lemonde.fr": { name: "Le Monde", line: "center_left", source: MBFC("le-monde/", "LEFT-CENTER") },
  "elpais.com": { name: "El País", line: "center_left", source: MBFC("el-pais/", "LEFT-CENTER") },
  "clarin.com": { name: "Clarín", line: "center_right", source: MBFC("clarin/", "RIGHT-CENTER") },
  "lanacion.com.ar": { name: "La Nación", line: "center_right", source: MBFC("la-nacion/", "RIGHT-CENTER") },
  "infobae.com": { name: "Infobae", line: "center_left", source: MBFC("infobae/", "LEFT-CENTER") },

  /* ------------------------ Agências de notícias ---------------------- */
  "reuters.com": { name: "Reuters", line: "wire", source: MBFC("reuters/", "LEAST BIASED (agência de notícias)") },
  "apnews.com": { name: "Associated Press", line: "wire", source: MBFC("associated-press/", "LEFT-CENTER (agência de notícias)") },
  "afp.com": { name: "AFP", line: "wire", source: { label: "Tipo de veículo", note: "agência de notícias" } },
  "agenciabrasil.ebc.com.br": { name: "Agência Brasil", line: "wire", source: { label: "Tipo de veículo", note: "agência pública de notícias (EBC)" } },

  /* ------------------------- Checagem de fatos ------------------------ */
  "aosfatos.org": { name: "Aos Fatos", line: "fact_check", source: MBFC("aos-fatos-bias-and-credibility/", "agência de checagem") },
  "lupa.uol.com.br": { name: "Agência Lupa", line: "fact_check", source: { label: "Tipo de veículo", note: "agência de checagem" } },
  "lupa.news": { name: "Agência Lupa", line: "fact_check", source: { label: "Tipo de veículo", note: "agência de checagem" } },
  "apublica.org": { name: "Agência Pública", line: "fact_check", source: { label: "Tipo de veículo", note: "jornalismo investigativo e checagem" } },

  /* ------------- Oficial: governo, Congresso, tribunais, institutos ------------- */
  "gov.br": { name: "Governo federal", line: "institutional", source: OFFICIAL("domínio do governo brasileiro (.gov.br)") },
  "leg.br": { name: "Congresso Nacional", line: "institutional", source: OFFICIAL("domínio do Poder Legislativo (.leg.br)") },
  "camara.leg.br": { name: "Câmara dos Deputados", line: "institutional", source: OFFICIAL("domínio do Poder Legislativo (.leg.br)") },
  "senado.leg.br": { name: "Senado Federal", line: "institutional", source: OFFICIAL("domínio do Poder Legislativo (.leg.br)") },
  "jus.br": { name: "Poder Judiciário", line: "institutional", source: OFFICIAL("domínio do Poder Judiciário (.jus.br)") },
  "stf.jus.br": { name: "Supremo Tribunal Federal", line: "institutional", source: OFFICIAL("domínio do Poder Judiciário (.jus.br)") },
  "tse.jus.br": { name: "Tribunal Superior Eleitoral", line: "institutional", source: OFFICIAL("domínio do Poder Judiciário (.jus.br)") },
  "ibge.gov.br": { name: "IBGE", line: "institutional", source: OFFICIAL("instituto oficial de estatística") },
  "ipea.gov.br": { name: "Ipea", line: "institutional", source: OFFICIAL("instituto de pesquisa do governo federal") },

  /* ----------------------------- Jurídico ----------------------------- */
  "conjur.com.br": { name: "Consultor Jurídico", line: "legal", source: { label: "Tipo de veículo", note: "veículo especializado em direito" } },
  "migalhas.com.br": { name: "Migalhas", line: "legal", source: { label: "Tipo de veículo", note: "veículo especializado em direito" } },
  "jota.info": { name: "JOTA", line: "legal", source: { label: "Tipo de veículo", note: "veículo especializado em direito e instituições" } },

  /* ----------------------------- Acadêmico ---------------------------- */
  "scielo.br": { name: "SciELO", line: "academic", source: { label: "Tipo de veículo", note: "biblioteca de revistas científicas" } },
  "scielo.org": { name: "SciELO", line: "academic", source: { label: "Tipo de veículo", note: "biblioteca de revistas científicas" } },
};

/** Procura o domínio (e os domínios "pais") na lista; o mais específico vence. */
export function lookupOutlet(host: string): OutletInfo | undefined {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (OUTLETS[candidate]) return OUTLETS[candidate];
  }
  return undefined;
}
