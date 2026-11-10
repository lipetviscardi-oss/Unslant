/**
 * ETAPA 1 — IDENTIFICAÇÃO
 * Descobre o tipo de texto (notícia, opinião, paper...), o país e o contexto
 * político. Essas informações orientam todos os "especialistas" seguintes.
 */

import { languageInstruction } from "./document";

export function triagePrompt(lang: "pt" | "en", isClaim = false, declaredType?: string, retryNote = "") {
  const year = new Date().getFullYear();
  return `TAREFA: identificar o tipo, a ÉPOCA e o contexto do documento acima, antes da análise de viés. (Hoje é ${year}.)${retryNote ? `\n\nATENÇÃO (correção da tentativa anterior): ${retryNote.replace(/[<>`]/g, " ").slice(0, 600)}` : ""}
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
  - Fontes históricas (textos de outras épocas, muito usados por historiadores):
    "speech" (discurso: texto feito para ser dito em público, por político, governante, líder),
    "official_document" (documento oficial: lei, decreto, ato institucional, relatório ou comunicação interna de governo, diplomática ou militar),
    "propaganda" (peça de propaganda política ou de guerra: panfleto, cartaz, cartilha, transmissão feita para persuadir em massa),
    "letter" (carta, correspondência, telegrama ou bilhete, público ou privado),
    "historical_newspaper" (texto de jornal ou revista de outra época; use-o para notícias, editoriais e colunas antigas quando o texto for histórico).
  - "press_release": comunicado de empresa, governo ou organização; "blog": post pessoal; "other": nada acima.
  Se os metadados trouxerem a seção/editoria da página (ex.: "Opinião", "Colunas", "Análise", "Editorial"), considere-a uma pista forte. Na dúvida entre "news" e "analysis", pergunte-se: o autor faz avaliações com a própria voz, fora das aspas? Se sim, é "analysis".
- contentTypeReason: UMA frase curta dizendo por que o texto recebeu esse tipo (ex.: "Relata a decisão em voz neutra; as opiniões aparecem só em falas citadas.").
- country: país cuja política/sociedade o texto trata principalmente, escrito por extenso NO IDIOMA DA RESPOSTA (em português: "Brasil", "Estados Unidos", "Reino Unido"; em inglês: "Brazil", "United States", "United Kingdom"). Se não for um país específico, use "Internacional" (em inglês: "International"); se não der para saber, "Não identificado" (em inglês: "Unidentified").
- countryCode: código ISO de 2 letras do país (ex.: "BR", "US") ou "" se não houver.
- ÉPOCA (faça isto ANTES do contexto político):
  - era: a data ou época em que o texto foi escrito ou publicado, o mais preciso possível ("15 de março de 1964", "1954", "anos 1950", "fim do século XIX"). Use, nesta ordem: a data no próprio documento ou nos metadados de publicação; pistas do conteúdo (fatos, pessoas e cargos mencionados, grafia, moeda, tecnologia). ATENÇÃO: a data de criação de um arquivo PDF NÃO é a data do documento (pode ser a data em que foi escaneado). Se não der para saber, "".
  - eraYear: o ano (aproximado, se for um período) em número; 0 se não identificada.
  - eraSource: "document" (data escrita no documento ou na publicação), "content" (deduzida de pistas do texto) ou "unknown".
  - historical: true se o texto é de outra época, com um cenário político diferente do atual (regra prática: de mais de ~20 anos atrás, ou de um período político já encerrado); false para textos atuais.
  - axesApplicable: false se os eixos esquerda/direita, como entendidos hoje, NÃO fazem sentido para aquela época e lugar (ex.: textos anteriores ao século XX, ou de contextos em que essas categorias não organizavam a política); true caso contrário (inclusive para textos históricos do século XX em que esquerda/direita já eram usadas).
  - axesNote: se axesApplicable for false, 1 frase explicando por quê; senão "".
- politicalContext: 1 a 3 frases sobre o contexto político relevante para interpretar este texto NAQUELA ÉPOCA e naquele país (ex.: quem governava, quais eram os polos do debate). Para textos históricos, descreva o cenário DA ÉPOCA DO TEXTO, nunca o atual: um texto de 1964 deve ser lido no contexto do golpe e da Guerra Fria, não da política de hoje. NUNCA mencione partidos, pessoas ou disputas posteriores à época do texto. Use conhecimento geral; não invente fatos específicos que você não pode verificar.
- documentLanguage: idioma do documento, escrito no idioma da resposta (ex.: "português"/"Portuguese", "inglês"/"English").
- topic: tema central em até 8 palavras.
- contentSummary: o que o texto diz, em 1 a 2 frases neutras.
- title, author, outlet, publishedAt: copie do documento ou dos metadados se estiverem claros; caso contrário, "" (não adivinhe).

${languageInstruction(lang)}`;
}
