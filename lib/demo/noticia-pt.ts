/**
 * RESULTADO DE DEMONSTRAÇÃO para o exemplo "Notícia brasileira".
 *
 * Escrito à mão, no mesmo formato que a IA devolve, para testar o site sem
 * chave e sem custo. Passa pelas mesmas regras de uma análise real
 * (conferência de citações e cálculo das notas).
 */

import type { OverviewOutput, SpecialistOutput, SynthesisOutput, TriageOutput } from "@/lib/analysis/schemas";
import type { SourceInfo } from "@/lib/analysis/types";
import { getExample } from "@/lib/examples";

type Cat = SpecialistOutput["categories"][number];

const found = (
  categoryId: string,
  score: number,
  confidence: Cat["confidence"],
  summary: string,
  evidence: [string, string][],
): Cat => ({
  categoryId,
  status: "found",
  score,
  confidence,
  summary,
  evidence: evidence.map(([quote, explanation]) => ({ quote, explanation })),
});

const none = (categoryId: string, summary: string, confidence: Cat["confidence"] = "medium"): Cat => ({
  categoryId,
  status: "none_found",
  score: 0,
  confidence,
  summary,
  evidence: [],
});

export const text = getExample("noticia-pt")!.text;

export const source: SourceInfo = {
  type: "text",
  title: "Prefeitura impõe corte brutal na saúde e abandona os mais pobres",
  outlet: "Jornal Exemplo (fictício)",
};

export const claimCheck = null;

export const triage: TriageOutput = {
  contentType: "news",
  contentTypeReason: "Publicado como notícia, mas o próprio autor faz avaliações e apelos fora das aspas; a classificação de gênero segue a forma de publicação.",
  country: "Brasil",
  countryCode: "BR",
  politicalContext:
    "Debate municipal sobre orçamento: a oposição critica cortes em serviços públicos e o governo justifica com queda de arrecadação. No Brasil, a defesa do SUS e do gasto social costuma ser associada à esquerda, e a responsabilidade fiscal, à direita.",
  documentLanguage: "português",
  topic: "Corte no orçamento municipal da saúde",
  contentSummary:
    "A prefeitura de Vale Verde anunciou corte de 30% no orçamento da saúde para 2027; o texto reúne críticas de sindicato, oposição e moradores e, no fim, a justificativa da Secretaria da Fazenda.",
  title: "Prefeitura impõe corte brutal na saúde e abandona os mais pobres",
  author: "",
  outlet: "",
  publishedAt: "",
};

export const specialists: Record<string, SpecialistOutput> = {
  language: {
    categories: [
      found("loaded_language", 7, "high", "O autor usa adjetivos e verbos de forte carga emocional fora das citações, a começar pelo título.", [
        ["Prefeitura impõe corte brutal na saúde e abandona os mais pobres", "\"Brutal\" e \"abandona\" são julgamentos do autor, não fatos. Versão neutra: \"Prefeitura anuncia corte de 30% no orçamento da saúde\"."],
        ["aprovada às pressas pela base aliada", "\"Às pressas\" sugere irregularidade sem informar o prazo real da tramitação."],
        ["atinge em cheio as unidades básicas de saúde", "Expressão dramática que antecipa o impacto antes de qualquer dado."],
      ]),
      none("labeling", "Os rótulos usados (\"base aliada\", \"oposição\") são termos correntes e neutros na política brasileira."),
      found("euphemism_dysphemism", 5, "medium", "Termos que agravam a ação do governo são usados como descrição, não como opinião atribuída.", [
        ["sucateou a rede pública", "\"Sucatear\" é um disfemismo: afirma deterioração deliberada sem apresentar evidência."],
        ["explosão de mortes evitáveis", "Expressão alarmista para uma projeção que o texto não sustenta com dados."],
      ]),
      found("attribution_verbs", 7, "high", "Críticos \"afirmam\"; o governo \"alega\" e \"admite\". A escolha de verbos favorece um lado.", [
        ["afirmou Marta Ribeiro", "Verbo neutro para a fonte crítica ao corte."],
        ["a Secretaria Municipal da Fazenda alegou", "\"Alegou\" insinua dúvida sobre a explicação do governo, que traz dados verificáveis."],
        ["A pasta admitiu que o valor previsto para 2027", "\"Admitiu\" sugere confissão, mas a informação na verdade favorece a versão do governo."],
      ]),
      found("generalizations", 6, "high", "Generalizações absolutas sem base reforçam a tese do texto.", [
        ["Todos os moradores da zona leste sabem", "Atribui uma opinião a \"todos\" sem nenhuma pesquisa."],
        ["Cenas como essa devem se tornar cada vez mais comuns.", "Previsão apresentada como tendência, sem dados."],
        ["é o maior da história da cidade", "Superlativo em valor nominal, sem correção pela inflação."],
      ]),
    ],
  },
  framing: {
    categories: [
      found("framing", 7, "high", "A história é montada como vítimas (moradores pobres) contra vilão (prefeito); a moldura fiscal quase não aparece.", [
        ["a dona de casa Lúcia Pereira, 62 anos, chorava na porta do posto", "Caso individual comovente usado como símbolo do todo, sem ligação demonstrada com o corte de 2027."],
        ["o prefeito governa apenas para os empresários do centro e despreza quem depende do SUS", "Acusação de um adversário político reproduzida sem contraponto."],
      ]),
      found("headline_body", 6, "high", "O título afirma que a prefeitura \"abandona os mais pobres\", algo que o corpo não demonstra.", [
        ["Prefeitura impõe corte brutal na saúde e abandona os mais pobres", "O corpo mostra um corte orçamentário e críticas a ele, mas não comprova abandono. O título vai além do conteúdo."],
      ]),
      found("emphasis_placement", 7, "high", "A explicação do governo, que muda a leitura dos números, aparece só no último parágrafo.", [
        ["Procurada, a Secretaria Municipal da Fazenda alegou que a arrecadação caiu 18% neste ano", "Informação essencial para entender o corte relegada ao fim do texto."],
      ]),
      found("spin", 5, "medium", "Fatos são apresentados já com interpretação negativa embutida.", [
        ["numa decisão que especialistas classificam como desastrosa", "A avaliação negativa entra na primeira frase, junto do fato, antes de qualquer dado."],
      ]),
    ],
  },
  sources: {
    categories: [
      found("source_balance", 7, "high", "Sindicato, oposição e uma moradora criticam o corte; ninguém o defende, e nenhum especialista independente é ouvido.", [
        ["afirmou Marta Ribeiro, presidente do Sindicato dos Servidores da Saúde", "Fonte com interesse direto no tema, sem contraponto equivalente."],
        ["Para o vereador Paulo Nunes", "A oposição é ouvida; a base aliada que aprovou a medida, não."],
      ]),
      found("vague_sources", 8, "high", "As afirmações mais fortes são atribuídas a \"especialistas\" sem nome.", [
        ["numa decisão que especialistas classificam como desastrosa", "Quem são os especialistas? Nenhum é identificado."],
        ["Segundo especialistas ouvidos pela reportagem", "Sustenta a previsão de \"explosão de mortes\" sem identificar a fonte."],
      ]),
      none("selective_quotes", "Não há indícios no texto de citações recortadas ou fora de contexto.", "low"),
      found("source_credentials", 4, "medium", "Uma dirigente sindical é apresentada com credenciais de especialista.", [
        ["que acompanha o tema há duas décadas", "A experiência é destacada, mas a fonte é parte interessada, não uma especialista independente."],
      ]),
    ],
  },
  omission: {
    categories: [
      found("missing_context", 7, "high", "Faltam comparações que mudariam a leitura do corte.", [
        ["O corte de R$ 84 milhões é o maior da história da cidade.", "Sem correção pela inflação nem comparação com anos normais, o recorde nominal diz pouco."],
        ["um corte de 30% no orçamento da saúde para 2027", "O texto só informa no final que a base de comparação (2026) teve reforço extraordinário."],
      ]),
      found("missing_perspectives", 5, "medium", "Não aparecem gestores de saúde, a base do governo nem especialistas em finanças públicas.", [
        ["A oposição promete recorrer à Justiça.", "A oposição tem espaço; quem aprovou a medida não é ouvido."],
      ]),
      found("selective_facts", 5, "medium", "Só fatos negativos sobre a gestão são listados.", [
        ["Desde que o prefeito Ricardo Almeida assumiu, a fila para consultas com especialistas cresceu sem parar", "Seleciona um indicador negativo, sem dados nem outros indicadores da rede."],
      ]),
    ],
  },
  data: {
    categories: [
      found("misleading_numbers", 7, "high", "Os números principais são apresentados sem a base de comparação adequada.", [
        ["um corte de 30% no orçamento da saúde para 2027", "Os 30% são calculados sobre um ano inflado por gasto emergencial; comparado a 2024, o valor é semelhante."],
        ["O corte de R$ 84 milhões é o maior da história da cidade.", "Valor absoluto e nominal: cidades e orçamentos crescem, então recordes nominais são comuns."],
      ]),
      found("correlation_causation", 6, "high", "O crescimento da fila é tratado como prova de sucateamento.", [
        ["a fila para consultas com especialistas cresceu sem parar, o que mostra que a gestão sucateou a rede pública", "A fila pode ter crescido por várias causas (demanda, epidemia, falta de médicos). A relação causal não é demonstrada."],
      ]),
      found("cherry_picking", 6, "medium", "A comparação usa justamente um ano atípico como referência.", [
        ["o orçamento da saúde de 2026 havia recebido um reforço extraordinário", "O ano usado como base foi excepcional; o próprio texto reconhece isso, mas só no fim."],
      ]),
      found("unsourced_data", 4, "medium", "Dados sobre filas e esperas aparecem sem fonte.", [
        ["Moradores relatam esperas de até oito meses por um exame de rotina.", "Relatos sem dado oficial ou levantamento que indique se são casos isolados ou a regra."],
      ]),
    ],
  },
  fact_opinion: {
    categories: [
      found("opinion_as_fact", 7, "high", "Interpretações e previsões aparecem como constatações.", [
        ["o que mostra que a gestão sucateou a rede pública", "Conclusão do autor apresentada como fato demonstrado."],
        ["Cenas como essa devem se tornar cada vez mais comuns.", "Previsão do autor, sem fonte."],
      ]),
      found("editorializing", 8, "high", "Numa notícia, o autor toma posição e faz recomendações.", [
        ["Ou a Câmara derruba o corte, ou a cidade vai assistir ao colapso da saúde pública.", "Frase de opinião do próprio autor, sem atribuição, num texto noticioso."],
        ["se nada for feito agora, será tarde demais", "Apelo à ação típico de editorial."],
      ]),
    ],
  },
  emotional: {
    categories: [
      none("clickbait", "O título é carregado, mas não usa mistério ou promessa de revelação típicos de clickbait."),
      found("fear_outrage", 7, "high", "O texto mobiliza medo (mortes) e indignação (\"crime contra a população\").", [
        ["provocar uma explosão de mortes evitáveis nos próximos anos", "Previsão alarmista sem dados de suporte."],
        ["a dona de casa Lúcia Pereira, 62 anos, chorava na porta do posto", "Cena emotiva usada para gerar indignação."],
      ]),
      found("false_urgency", 6, "high", "Cria pressão de tempo sem base.", [
        ["se nada for feito agora, será tarde demais", "Urgência sem explicar o que aconteceria e quando."],
      ]),
    ],
  },
  fallacies: {
    categories: [
      none("straw_man", "A posição do governo não é caricaturada; ela é pouco explorada, o que entra em \"Fontes\" e \"Omissão\"."),
      found("false_dilemma", 7, "high", "O autor apresenta só duas saídas possíveis.", [
        ["Ou a Câmara derruba o corte, ou a cidade vai assistir ao colapso da saúde pública.", "Ignora alternativas (revisão parcial, remanejamento, novas receitas)."],
      ]),
      found("ad_hominem", 3, "medium", "Acusação contra a pessoa do prefeito reproduzida sem contraponto.", [
        ["o prefeito governa apenas para os empresários do centro e despreza quem depende do SUS", "Ataca intenções do prefeito em vez de discutir a medida. É fala de um vereador, mas o texto não a contrapõe."],
      ]),
      found("slippery_slope", 3, "medium", "Uma fala com cadeia de consequências extremas é publicada sem questionamento.", [
        ["Primeiro cortam a saúde, depois vão fechar as escolas", "Projeção de consequências em cadeia sem fundamento. É citação, mas reforça a narrativa do texto."],
      ]),
      found("appeal_to_authority", 3, "low", "\"Especialistas\" genéricos são usados como prova.", [
        ["especialistas classificam como desastrosa", "A autoridade invocada não é identificada nem tem seus argumentos apresentados."],
      ]),
      none("false_equivalence", "Não há comparação indevida entre posições de pesos diferentes."),
    ],
  },
  interests: {
    categories: [
      none("sponsored_content", "Não há sinais de conteúdo publicitário.", "high"),
      none("conflicts_of_interest", "Nenhum conflito de interesse do autor ou do veículo é identificável no próprio texto.", "low"),
    ],
  },
  representation: {
    categories: [
      none("stereotype_gender", "Não há estereótipos de gênero."),
      none("stereotype_race", "Não há menções a raça ou etnia."),
      none("stereotype_class", "Classes sociais aparecem nas falas de fontes, mas o texto não as retrata de forma estereotipada.", "low"),
      none("stereotype_region", "Não há estereótipos regionais."),
      none("stereotype_religion", "Não há menções a religião."),
      none("stereotype_nationality", "Não há menções a nacionalidades."),
    ],
  },
};

export const overview: OverviewOutput = {
  economic: {
    position: "left",
    confidence: "medium",
    justification:
      "O texto trata a redução de gasto público como abandono, dá voz apenas a quem defende mais gasto social e põe em dúvida a justificativa fiscal do governo.",
    quote: "Prefeitura impõe corte brutal na saúde e abandona os mais pobres",
  },
  social: {
    position: "not_applicable",
    confidence: "high",
    justification: "O tema é orçamento e saúde pública; o texto não trata de costumes, valores ou segurança.",
    quote: "",
  },
  dispute: {
    caveat: "",
    status: "favors_b",
    sideA: "Prefeitura de Vale Verde",
    sideB: "Oposição na Câmara",
    strength: "strong",
    confidence: "high",
    justification:
      "As críticas da oposição e do sindicato abrem e dominam o texto; a explicação da prefeitura aparece só no fim, com verbos que sugerem desconfiança.",
    quote: "Prefeitura impõe corte brutal na saúde e abandona os mais pobres",
  },
  factOpinion: {
    factPercent: 45,
    explanation:
      "Os fatos (corte de 30%, valores, votação, explicação da Fazenda) dividem espaço com previsões, avaliações e apelos do próprio autor.",
  },
  rebuttals: [],
  omissions: [
    {
      title: "Comparação corrigida pela inflação",
      explanation: "Como o orçamento de 2027 se compara aos anos anteriores em valores reais, e não só ao ano atípico de 2026.",
    },
    {
      title: "Por que a arrecadação caiu",
      explanation: "A queda de 18% na arrecadação é citada de passagem, sem explicar a causa nem o efeito sobre outras áreas.",
    },
    {
      title: "Versão de quem aprovou o corte",
      explanation: "Vereadores da base e gestores da saúde não explicam como pretendem manter o atendimento.",
    },
    {
      title: "Dados oficiais sobre filas",
      explanation: "Números da secretaria de saúde sobre filas e tempos de espera permitiriam avaliar o tamanho real do problema.",
    },
  ],
};

export const synthesis: SynthesisOutput = {
  summary:
    "O texto se apresenta como notícia, mas funciona como um texto de campanha contra o corte. As principais fragilidades estão na linguagem carregada do próprio autor, no uso de \"especialistas\" anônimos, na editorialização e em números sem a base de comparação adequada, com destaque para os 30% calculados sobre um ano de gasto emergencial. A explicação do governo, que muda a leitura dos números, só aparece no último parágrafo e com verbos que sugerem desconfiança. A inclinação econômica é de esquerda, pela defesa do gasto público; no eixo social não há inclinação identificável.",
  summarySimple:
    "Esta notícia toma partido contra o corte na saúde. Ela usa palavras fortes, ouve quase só um lado e deixa para o final a informação de que o orçamento do ano anterior tinha sido maior por causa de uma epidemia.",
  rewrite: {
    evidenceId: "loaded_language-1",
    rewritten: "Prefeitura anuncia corte no orçamento da saúde; oposição diz que medida prejudica os mais pobres",
    explanation:
      "Troquei \"impõe corte brutal\" por uma descrição do fato e atribuí a acusação de \"abandonar os mais pobres\" a quem a faz, a oposição, em vez de apresentá-la como fato.",
  },
};
