/**
 * ETAPA 1 — IDENTIFICAÇÃO
 * Descobre o tipo de texto (notícia, opinião, paper...), o país e o contexto
 * político. Essas informações orientam todos os "especialistas" seguintes.
 */

import { languageInstruction } from "./document";

export function triagePrompt(lang: "pt" | "en") {
  return `TAREFA: identificar o tipo e o contexto do documento acima, antes da análise de viés.

Preencha:
- contentType: um de "news" (notícia/reportagem), "opinion" (artigo de opinião, coluna, editorial), "analysis" (análise/explicativo assinado), "academic_paper" (artigo científico ou acadêmico, preprint, relatório de pesquisa), "press_release" (comunicado de imprensa), "blog" (post pessoal ou de blog), "other".
- country: país cuja política/sociedade o texto trata principalmente, escrito por extenso no idioma pedido (ex.: "Brasil", "Estados Unidos", "Reino Unido"). Use "Internacional" se não for um país específico e "Não identificado" se não der para saber.
- countryCode: código ISO de 2 letras do país (ex.: "BR", "US") ou "" se não houver.
- politicalContext: 1 a 3 frases sobre o contexto político relevante para interpretar este texto naquele país (ex.: quem governa, quais são os polos do debate sobre o tema). Use conhecimento geral; não invente fatos específicos e recentes que você não pode verificar.
- documentLanguage: idioma do documento (ex.: "português", "inglês").
- topic: tema central em até 8 palavras.
- contentSummary: o que o texto diz, em 1 a 2 frases neutras.
- title, author, outlet, publishedAt: copie do documento ou dos metadados se estiverem claros; caso contrário, "" (não adivinhe).

${languageInstruction(lang)}`;
}
