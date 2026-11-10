/**
 * ETAPA 1 — IDENTIFICAÇÃO
 * Descobre o tipo de texto (notícia, opinião, paper...), o país e o contexto
 * político. Essas informações orientam todos os "especialistas" seguintes.
 */

import { languageInstruction } from "./document";

export function triagePrompt(lang: "pt" | "en", isClaim = false, declaredType?: string) {
  return `TAREFA: identificar o tipo e o contexto do documento acima, antes da análise de viés.
${declaredType ? `\nO usuário informou que o tipo do texto é "${declaredType}". Use exatamente esse contentType e, em contentTypeReason, escreva "Tipo informado pelo usuário."\n` : ""}${isClaim ? "\nO documento é uma AFIRMAÇÃO curta (algo que alguém disse ou que circula), não um artigo. Use contentType \"claim\" e deixe title, author, outlet e publishedAt vazios.\n" : ""}
Preencha:
- contentType — use estes critérios, nesta ordem:
  - "claim": afirmação curta (só quando o documento for uma frase ou parágrafo solto).
  - "academic_paper": artigo científico ou acadêmico, preprint, relatório de pesquisa com método.
  - "editorial": texto que expressa a posição oficial do veículo, sem autor individual, geralmente identificado como "Editorial" ou "Opinião do jornal".
  - "opinion": coluna, artigo de opinião ou carta; o objetivo principal é defender uma posição, assinado por um autor (colunista, convidado).
  - "analysis": relata fatos E traz interpretação ou avaliação assinada pelo próprio autor (frases como "a decisão levanta dúvidas sobre…", "o episódio mostra que…"), mesmo que publicado como notícia; ou é identificado como "Análise".
  - "feature": reportagem longa ou especial, com apuração própria, várias fontes, contexto e narrativa, mas sem avaliação do autor.
  - "news": relata fatos recentes em voz neutra; opiniões aparecem só na boca de fontes citadas.
  - "press_release": comunicado de empresa, governo ou organização; "blog": post pessoal; "other": nada acima.
  Se os metadados trouxerem a seção/editoria da página (ex.: "Opinião", "Colunas", "Análise", "Editorial"), considere-a uma pista forte. Na dúvida entre "news" e "analysis", pergunte-se: o autor faz avaliações com a própria voz, fora das aspas? Se sim, é "analysis".
- contentTypeReason: UMA frase curta dizendo por que o texto recebeu esse tipo (ex.: "Relata a decisão em voz neutra; as opiniões aparecem só em falas citadas.").
- country: país cuja política/sociedade o texto trata principalmente, escrito por extenso no idioma pedido (ex.: "Brasil", "Estados Unidos", "Reino Unido"). Use "Internacional" se não for um país específico e "Não identificado" se não der para saber.
- countryCode: código ISO de 2 letras do país (ex.: "BR", "US") ou "" se não houver.
- politicalContext: 1 a 3 frases sobre o contexto político relevante para interpretar este texto naquele país (ex.: quem governa, quais são os polos do debate sobre o tema). Use conhecimento geral; não invente fatos específicos e recentes que você não pode verificar.
- documentLanguage: idioma do documento (ex.: "português", "inglês").
- topic: tema central em até 8 palavras.
- contentSummary: o que o texto diz, em 1 a 2 frases neutras.
- title, author, outlet, publishedAt: copie do documento ou dos metadados se estiverem claros; caso contrário, "" (não adivinhe).

${languageInstruction(lang)}`;
}
