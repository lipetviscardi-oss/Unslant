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
 *  Fontes usadas (todas as páginas reconferidas em 10/11/2026: avaliação, país
 *  e site avaliado; o mês da última atualização da fonte fica em "updated"):
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
  source: { label: string; url?: string; note?: string; updated?: string };
}

/** updated = mês da última atualização da avaliação na fonte ("AAAA-MM"), conferido na página. */
const MBFC = (slug: string, rating: string, updated: string) => ({
  label: "Media Bias/Fact Check",
  url: `https://mediabiasfactcheck.com/${slug}`,
  note: `Avaliação: ${rating}`,
  updated,
});
const WIKI = (article: string, quote: string) => ({
  label: "Wikipédia",
  url: `https://pt.wikipedia.org/wiki/${article}`,
  note: quote,
});
const OFFICIAL = (what: string) => ({ label: "Domínio oficial", note: what });

export const OUTLETS: Record<string, OutletInfo> = {
  /* ----------------------------- Brasil ----------------------------- */
  "folha.uol.com.br": { name: "Folha de S.Paulo", line: "center_left", source: MBFC("folha-de-s-paulo-bias-and-credibility/", "LEFT-CENTER", "2026-08") },
  "oglobo.globo.com": { name: "O Globo", line: "center_right", source: MBFC("globo-bias-and-credibility/", "RIGHT-CENTER (Globo)", "2026-01") },
  "g1.globo.com": { name: "g1", line: "center_right", source: MBFC("globo-bias-and-credibility/", "RIGHT-CENTER (Globo)", "2026-01") },
  "estadao.com.br": {
    name: "O Estado de S. Paulo",
    line: "center_right",
    source: WIKI("O_Estado_de_S._Paulo", "editoriais que unem \"conservadorismo político e liberalismo econômico\""),
  },
  "cartacapital.com.br": { name: "CartaCapital", line: "left", source: MBFC("cartacapital-bias-and-credibility/", "LEFT", "2026-01") },
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
  "nytimes.com": { name: "The New York Times", line: "center_left", source: MBFC("new-york-times/", "LEFT-CENTER", "2024-12") },
  "washingtonpost.com": { name: "The Washington Post", line: "center_left", source: MBFC("washington-post/", "LEFT-CENTER", "2024-12") },
  "wsj.com": { name: "The Wall Street Journal", line: "center_right", source: MBFC("wall-street-journal/", "RIGHT-CENTER", "2025-07") },
  "foxnews.com": { name: "Fox News", line: "right", source: MBFC("fox-news/", "RIGHT", "2026-10") },
  "cnn.com": { name: "CNN", line: "center_left", source: MBFC("cnn/", "LEFT-CENTER", "2026-07") },
  "msnbc.com": { name: "MSNBC", line: "left", source: MBFC("msnbc/", "LEFT", "2025-11") },
  "npr.org": { name: "NPR", line: "center_left", source: MBFC("npr/", "LEFT-CENTER", "2024-12") },
  "abcnews.go.com": { name: "ABC News", line: "center_left", source: MBFC("abc-news/", "LEFT-CENTER", "2026-04") },
  "nbcnews.com": { name: "NBC News", line: "center_left", source: MBFC("nbc-news/", "LEFT-CENTER", "2024-12") },
  "cbsnews.com": { name: "CBS News", line: "center_right", source: MBFC("cbs-news/", "RIGHT-CENTER", "2026-04") },
  "politico.com": { name: "Politico", line: "center_left", source: MBFC("politico/", "LEFT-CENTER", "2024-12") },
  "bloomberg.com": { name: "Bloomberg", line: "center_left", source: MBFC("bloomberg/", "LEFT-CENTER", "2026-04") },
  "vox.com": { name: "Vox", line: "left", source: MBFC("vox/", "LEFT", "2026-09") },
  "nypost.com": { name: "New York Post", line: "center_right", source: MBFC("new-york-post/", "RIGHT-CENTER", "2025-09") },
  "breitbart.com": { name: "Breitbart", line: "right", source: MBFC("breitbart/", "RIGHT", "2026-04") },
  "newsmax.com": { name: "Newsmax", line: "right", source: MBFC("newsmax/", "RIGHT", "2026-10") },
  "nationalreview.com": { name: "National Review", line: "right", source: MBFC("national-review/", "RIGHT", "2025-01") },
  "thedispatch.com": { name: "The Dispatch", line: "center_right", source: MBFC("the-dispatch/", "RIGHT-CENTER", "2026-07") },
  "washingtonexaminer.com": { name: "Washington Examiner", line: "center_right", source: MBFC("washington-examiner/", "RIGHT-CENTER", "2025-07") },
  "dailywire.com": { name: "The Daily Wire", line: "right", source: MBFC("the-daily-wire/", "RIGHT", "2026-07") },
  "foxbusiness.com": { name: "Fox Business", line: "center_right", source: MBFC("fox-business/", "RIGHT-CENTER", "2025-01") },
  "newsweek.com": { name: "Newsweek", line: "center_right", source: MBFC("newsweek/", "RIGHT-CENTER", "2025-02") },
  "thehill.com": { name: "The Hill", line: "center", source: MBFC("the-hill/", "LEAST BIASED", "2025-12") },
  "theatlantic.com": { name: "The Atlantic", line: "center_left", source: MBFC("the-atlantic/", "LEFT-CENTER", "2026-07") },
  "huffpost.com": { name: "HuffPost", line: "left", source: MBFC("huffington-post/", "LEFT", "2026-01") },
  "bbc.com": { name: "BBC", line: "center", source: MBFC("bbc/", "LEAST BIASED", "2026-04") },
  "bbc.co.uk": { name: "BBC", line: "center", source: MBFC("bbc/", "LEAST BIASED", "2026-04") },
  "theguardian.com": { name: "The Guardian", line: "center_left", source: MBFC("the-guardian/", "LEFT-CENTER", "2025-09") },
  "independent.co.uk": { name: "The Independent", line: "center_left", source: MBFC("the-independent/", "LEFT-CENTER", "2026-07") },
  "dailymail.co.uk": { name: "Daily Mail", line: "right", source: MBFC("daily-mail/", "RIGHT", "2026-10") },
  "telegraph.co.uk": { name: "The Telegraph", line: "right", source: MBFC("daily-telegraph/", "RIGHT", "2024-12") },
  "thetimes.com": { name: "The Times", line: "center_right", source: MBFC("the-times-of-london/", "RIGHT-CENTER", "2024-12") },
  "thetimes.co.uk": { name: "The Times", line: "center_right", source: MBFC("the-times-of-london/", "RIGHT-CENTER", "2024-12") },
  "spectator.co.uk": { name: "The Spectator", line: "center_right", source: MBFC("the-spectator/", "RIGHT-CENTER", "2025-01") },
  "standard.co.uk": { name: "Evening Standard", line: "center_right", source: MBFC("london-evening-standard/", "RIGHT-CENTER", "2025-03") },
  "itv.com": { name: "ITV News", line: "center_right", source: MBFC("itv-news/", "RIGHT-CENTER", "2024-02") },
  "gbnews.com": { name: "GB News", line: "right", source: MBFC("gb-news/", "RIGHT", "2026-08") },
  "thesun.co.uk": { name: "The Sun", line: "right", source: MBFC("the-sun/", "RIGHT", "2024-11") },
  "express.co.uk": { name: "Daily Express", line: "right", source: MBFC("daily-express/", "RIGHT", "2025-10") },
  "newstatesman.com": { name: "New Statesman", line: "center_left", source: MBFC("new-statesman/", "LEFT-CENTER", "2025-01") },
  "mirror.co.uk": { name: "Daily Mirror", line: "center_left", source: MBFC("daily-mirror/", "LEFT-CENTER", "2024-11") },
  "inews.co.uk": { name: "The i", line: "center_left", source: MBFC("inews/", "LEFT-CENTER", "2026-07") },
  "channel4.com": { name: "Channel 4 News", line: "center_left", source: MBFC("channel-4-news/", "LEFT-CENTER", "2024-11") },
  "news.sky.com": { name: "Sky News", line: "center", source: MBFC("sky-news/", "LEAST BIASED", "2024-12") },
  "economist.com": { name: "The Economist", line: "center", source: MBFC("the-economist/", "LEAST BIASED", "2024-12") },
  "ft.com": { name: "Financial Times", line: "center", source: MBFC("financial-times/", "LEAST BIASED", "2024-12") },
  "aljazeera.com": { name: "Al Jazeera", line: "center_left", source: MBFC("al-jazeera/", "LEFT-CENTER", "2026-04") },
  "lemonde.fr": { name: "Le Monde", line: "center_left", source: MBFC("le-monde/", "LEFT-CENTER", "2024-11") },
  "elpais.com": { name: "El País", line: "center_left", source: MBFC("el-pais/", "LEFT-CENTER", "2025-01") },
  "clarin.com": { name: "Clarín", line: "center_right", source: MBFC("clarin/", "RIGHT-CENTER", "2026-05") },
  "lanacion.com.ar": { name: "La Nación", line: "center_right", source: MBFC("la-nacion/", "RIGHT-CENTER", "2026-05") },
  "infobae.com": { name: "Infobae", line: "center_left", source: MBFC("infobae/", "LEFT-CENTER", "2026-05") },

  /* ------------------------ Agências de notícias ---------------------- */
  "reuters.com": { name: "Reuters", line: "wire", source: MBFC("reuters/", "LEAST BIASED (agência de notícias)", "2026-04") },
  "apnews.com": { name: "Associated Press", line: "wire", source: MBFC("associated-press/", "LEFT-CENTER (agência de notícias)", "2026-04") },
  "afp.com": { name: "AFP", line: "wire", source: { label: "Tipo de veículo", note: "agência de notícias" } },
  "agenciabrasil.ebc.com.br": { name: "Agência Brasil", line: "wire", source: { label: "Tipo de veículo", note: "agência pública de notícias (EBC)" } },

  /* ------------------------- Checagem de fatos ------------------------ */
  "aosfatos.org": { name: "Aos Fatos", line: "fact_check", source: MBFC("aos-fatos-bias-and-credibility/", "agência de checagem", "2025-08") },
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
