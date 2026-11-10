/**
 * ============================================================================
 *  TEXTOS HISTÓRICOS: TRAVA CONTRA ANACRONISMO (você pode ampliar esta lista)
 * ============================================================================
 *  Num texto histórico, a análise NÃO pode falar de pessoas, partidos ou
 *  disputas que só ficaram relevantes DEPOIS da época do texto (ex.: falar
 *  de Lula × Bolsonaro ao analisar um discurso de 1964).
 *
 *  Cada item tem o nome (como aparece num texto) e o ano a partir do qual
 *  ele passa a fazer sentido. Se a análise de um texto de antes desse ano
 *  citar o nome, e o próprio documento não citar, isso é anacronismo: a
 *  análise é refeita (ou o trecho é retirado).
 *
 *  COMO ACRESCENTAR: copie uma linha e troque o nome e o ano. Use nomes
 *  específicos (ex.: "Boris Johnson", não "Johnson", que também pode ser o
 *  presidente Lyndon Johnson, dos anos 1960).
 * ============================================================================
 */

export const FIGURAS_ATUAIS: { nome: string; desde: number }[] = [
  // Brasil
  { nome: "Lula", desde: 1978 },
  { nome: "Bolsonaro", desde: 1988 },
  { nome: "bolsonarismo", desde: 2018 },
  { nome: "bolsonarista", desde: 2018 },
  { nome: "lulismo", desde: 2003 },
  { nome: "petismo", desde: 1990 },
  { nome: "petista", desde: 1980 },
  { nome: "Dilma", desde: 2005 },
  { nome: "Temer", desde: 1990 },
  { nome: "Haddad", desde: 2005 },
  { nome: "Tarcísio", desde: 2019 },
  { nome: "Alexandre de Moraes", desde: 2016 },
  { nome: "Lava Jato", desde: 2014 },
  { nome: "Centrão", desde: 1987 },
  { nome: "PSDB", desde: 1988 },
  { nome: "Partido dos Trabalhadores", desde: 1980 },
  { nome: "PT", desde: 1980 },
  { nome: "PSOL", desde: 2004 },
  { nome: "Partido Novo", desde: 2011 },
  // Estados Unidos
  { nome: "Trump", desde: 2015 },
  { nome: "MAGA", desde: 2015 },
  { nome: "Obama", desde: 2004 },
  { nome: "Biden", desde: 1973 },
  { nome: "Kamala Harris", desde: 2016 },
  { nome: "Tea Party", desde: 2009 },
  // Reino Unido
  { nome: "Starmer", desde: 2015 },
  { nome: "Sunak", desde: 2015 },
  { nome: "Boris Johnson", desde: 2001 },
  { nome: "Brexit", desde: 2012 },
  { nome: "Farage", desde: 1999 },
  { nome: "Reform UK", desde: 2019 },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Nomes atuais que aparecem em `analysisText` e não fazem sentido para um
 * texto do ano `eraYear` (e que o próprio documento não cita).
 */
export function anachronisms(analysisText: string, documentText: string, eraYear: number): string[] {
  if (!eraYear) return [];
  const found: string[] = [];
  for (const f of FIGURAS_ATUAIS) {
    if (eraYear >= f.desde) continue;
    // Siglas curtas (PT, MAGA) só em maiúsculas; nomes, sem diferenciar maiúsculas.
    const re = new RegExp(`(?<![\\p{L}\\d])${escape(f.nome)}(?![\\p{L}\\d])`, /^[A-Z]{2,5}$/.test(f.nome) ? "u" : "iu");
    if (re.test(analysisText) && !re.test(documentText)) found.push(f.nome);
  }
  return found;
}
