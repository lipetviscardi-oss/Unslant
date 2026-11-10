/**
 * RESULTADO DE DEMONSTRAÇÃO para uma AFIRMAÇÃO (aba "Afirmação").
 *
 * Escrito à mão, no mesmo formato que a IA devolve, para testar o site sem
 * chave e sem custo. Passa pelas mesmas regras de uma análise real.
 */

import type {
  ClaimCheckOutput,
  OverviewOutput,
  SpecialistOutput,
  SynthesisOutput,
  TriageOutput,
} from "@/lib/analysis/schemas";
import type { SourceInfo } from "@/lib/analysis/types";

type Cat = SpecialistOutput["categories"][number];

const found = (categoryId: string, score: number, confidence: Cat["confidence"], summary: string, evidence: [string, string][]): Cat => ({
  categoryId,
  status: "found",
  score,
  confidence,
  summary,
  evidence: evidence.map(([quote, explanation]) => ({ quote, explanation })),
});
const none = (categoryId: string, summary: string): Cat => ({
  categoryId,
  status: "none_found",
  score: 0,
  confidence: "medium",
  summary,
  evidence: [],
});
const na = (categoryId: string, summary = "Não se aplica a uma afirmação curta."): Cat => ({
  categoryId,
  status: "not_applicable",
  score: 0,
  confidence: "high",
  summary,
  evidence: [],
});

export const text = "Os jovens de hoje não querem mais trabalhar, só querem saber de ficar no celular.";

export const source: SourceInfo = { type: "claim", claimContext: "grupo de família no WhatsApp" };

export const triage: TriageOutput = {
  contentType: "claim",
  contentTypeReason: "Frase curta enviada na aba Afirmação.",
  country: "Brasil",
  countryCode: "BR",
  politicalContext:
    "Queixa comum sobre gerações, trabalho e tecnologia. No Brasil, o tema aparece em debates sobre desemprego juvenil e jovens que não estudam nem trabalham, sem uma divisão partidária clara.",
  documentLanguage: "português",
  topic: "Jovens e trabalho",
  contentSummary: "A afirmação diz que os jovens atuais não querem trabalhar e passam o tempo no celular.",
  title: "",
  author: "",
  outlet: "",
  publishedAt: "",
};

export const specialists: Record<string, SpecialistOutput> = {
  language: {
    categories: [
      found("loaded_language", 4, "medium", "A segunda parte da frase descreve os jovens de forma depreciativa.", [
        ["só querem saber de ficar no celular", "\"Só querem saber\" reduz toda uma geração a um comportamento visto como fútil."],
      ]),
      none("labeling", "Não há rótulos políticos ou carregados."),
      none("euphemism_dysphemism", "Não há eufemismos ou disfemismos."),
      na("attribution_verbs"),
      found("generalizations", 6, "high", "A afirmação fala de \"os jovens\" como um bloco único.", [
        ["Os jovens de hoje", "Atribui a mesma atitude a milhões de pessoas muito diferentes entre si."],
      ]),
    ],
  },
  framing: {
    categories: [
      found("framing", 4, "medium", "O problema é enquadrado como falta de vontade individual, sem considerar causas como falta de vagas.", [
        ["não querem mais trabalhar", "Trata o fenômeno como questão de caráter, e não de mercado de trabalho, formação ou oportunidade."],
      ]),
      na("headline_body"),
      na("emphasis_placement"),
      none("spin", "Não há fatos apresentados com interpretação embutida."),
    ],
  },
  sources: {
    categories: [
      na("source_balance"),
      none("vague_sources", "A afirmação não cita fontes, nem vagas."),
      na("selective_quotes"),
      na("source_credentials"),
    ],
  },
  omission: {
    categories: [
      found("missing_context", 5, "medium", "Falta o contexto do mercado de trabalho para jovens.", [
        ["não querem mais trabalhar", "Ignora que muitos jovens procuram emprego e não encontram, e que o primeiro emprego costuma ser mais difícil de conseguir."],
      ]),
      found("missing_perspectives", 4, "medium", "A visão dos próprios jovens não aparece.", [
        ["Os jovens de hoje", "O que os jovens dizem sobre trabalho, salários e condições de emprego fica de fora."],
      ]),
      na("selective_facts"),
    ],
  },
  data: {
    categories: [
      none("misleading_numbers", "Não há números."),
      found("correlation_causation", 3, "low", "Sugere que o celular é a causa de não trabalhar.", [
        ["só querem saber de ficar no celular", "Ver jovens usando o celular não mostra que esse uso substitui o trabalho ou é causa de desemprego."],
      ]),
      na("cherry_picking"),
      none("unsourced_data", "Não há dados citados."),
    ],
  },
  fact_opinion: {
    categories: [
      found("opinion_as_fact", 6, "high", "Uma impressão é apresentada como constatação geral.", [
        ["Os jovens de hoje não querem mais trabalhar", "Afirmação sobre a vontade de uma geração inteira, dita como fato, sem base."],
      ]),
      na("editorializing"),
    ],
  },
  emotional: {
    categories: [
      na("clickbait"),
      none("fear_outrage", "O tom é de reprovação, mas sem apelo ao medo ou à indignação."),
      none("false_urgency", "Não há urgência."),
    ],
  },
  fallacies: {
    categories: [
      none("straw_man", "Não há distorção da posição de alguém."),
      none("false_dilemma", "Não há falso dilema."),
      none("ad_hominem", "Não há ataque pessoal a alguém específico."),
      none("slippery_slope", "Não há cadeia de consequências."),
      none("appeal_to_authority", "Não há apelo à autoridade."),
      none("false_equivalence", "Não há comparação indevida."),
    ],
  },
  representation: {
    categories: [
      none("stereotype_gender", "Não há estereótipos de gênero."),
      none("stereotype_race", "Não há menções a raça ou etnia."),
      none("stereotype_class", "Não há estereótipos de classe."),
      none("stereotype_region", "Não há estereótipos regionais."),
      none("stereotype_religion", "Não há menções a religião."),
      none("stereotype_nationality", "Não há menções a nacionalidades."),
    ],
  },
  cognitive: {
    categories: [
      found("hasty_generalization", 7, "high", "Conclusão sobre uma geração inteira a partir de impressões.", [
        ["Os jovens de hoje não querem mais trabalhar", "Generaliza o comportamento de alguns casos conhecidos para todos os jovens."],
      ]),
      none("anecdotal_evidence", "A frase não cita um caso pessoal, embora provavelmente se apoie em casos conhecidos."),
      found("availability_bias", 5, "medium", "Jovens no celular são uma cena muito visível, o que faz o comportamento parecer a regra.", [
        ["ficar no celular", "O uso do celular é muito visível no dia a dia e nas redes, o que pode exagerar a impressão de que é a atividade principal dos jovens."],
      ]),
      found("confirmation_bias", 3, "low", "Pode refletir a tendência de notar só os casos que confirmam a ideia.", [
        ["não querem mais trabalhar", "Jovens que trabalham ou procuram emprego tendem a ser menos notados do que os que confirmam a crença."],
      ]),
      found("unfalsifiable", 3, "low", "\"Não querem\" fala de vontade, algo difícil de medir diretamente.", [
        ["não querem", "A vontade de trabalhar não é observável; dá para medir quem trabalha ou procura emprego, não quem \"quer\"."],
      ]),
      found("echoed_slogan", 6, "medium", "Repete uma queixa sobre \"a juventude de hoje\" que aparece em praticamente todas as gerações.", [
        ["Os jovens de hoje", "A fórmula \"os jovens de hoje\" é um bordão antigo, usado por gerações mais velhas há décadas."],
      ]),
    ],
  },
};

export const overview: OverviewOutput = {
  economic: {
    position: "unidentified",
    confidence: "medium",
    justification: "A frase não defende nem critica o papel do Estado ou do mercado.",
    quote: "",
  },
  social: {
    position: "unidentified",
    confidence: "low",
    justification:
      "A crítica de costumes a uma geração aparece em todos os campos políticos; não há elementos suficientes para identificar um lado.",
    quote: "",
  },
  dispute: {
    status: "not_applicable",
    sideA: "",
    sideB: "",
    strength: "slight",
    confidence: "high",
    justification: "A afirmação não envolve uma disputa entre governo e oposição ou entre candidatos.",
    quote: "",
  },
  factOpinion: {
    factPercent: 5,
    explanation: "É quase toda opinião: uma impressão sobre a vontade de uma geração, sem nenhum dado.",
  },
  omissions: [
    { title: "Dados de emprego por idade", explanation: "Se os jovens procuram trabalho e não encontram, a explicação é outra." },
    { title: "Mudanças no mercado de trabalho", explanation: "Informalidade, trabalho por aplicativos e exigência de experiência afetam mais quem está começando." },
    { title: "A queixa é antiga", explanation: "Gerações anteriores ouviram críticas parecidas quando eram jovens." },
  ],
};

export const claimCheck: ClaimCheckOutput = {
  claimType: "mixed",
  verifiability: "partially_verifiable",
  assessment: "inconsistent",
  confidence: "medium",
  whatIsKnown:
    "No Brasil, a taxa de desemprego entre jovens costuma ser bem mais alta que a dos adultos, o que indica que muitos procuram trabalho e não encontram. Existe um grupo de jovens que não estuda nem trabalha, mas ele está ligado a fatores como baixa escolaridade, cuidado de familiares e falta de oportunidades, e não só à falta de vontade.",
  possibleOrigins:
    "Queixas sobre \"a juventude de hoje\" aparecem em praticamente todas as gerações. A cena de jovens no celular é muito visível, e vídeos virais sobre jovens que recusam empregos reforçam a impressão, mesmo sem representar a maioria.",
  howToVerify: [
    "PNAD Contínua, do IBGE: desemprego e ocupação por faixa etária",
    "Estudos do Ipea sobre jovens que não estudam nem trabalham",
    "Pesquisas de opinião com jovens sobre trabalho e carreira",
  ],
  moreAccurateVersion:
    "Muitos jovens têm dificuldade para entrar no mercado de trabalho, e as expectativas sobre emprego mudaram; mas os dados mostram que boa parte deles procura trabalho.",
};

export const synthesis: SynthesisOutput = {
  summary:
    "A afirmação é uma generalização sobre uma geração inteira apresentada como fato. Ela trata o problema como falta de vontade individual e deixa de fora o contexto do mercado de trabalho para jovens. O formato \"os jovens de hoje\" é um bordão antigo, e a cena de jovens no celular, por ser muito visível, reforça a impressão sem comprová-la. Não há inclinação política identificável.",
  summarySimple:
    "Essa frase pega a impressão sobre alguns jovens e aplica a todos. Os dados indicam que muitos jovens procuram trabalho e não encontram, então a explicação \"não querem\" é simples demais.",
  rewrite: { evidenceId: "", rewritten: "", explanation: "" },
};
