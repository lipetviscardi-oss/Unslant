/**
 * RESULTADO DE DEMONSTRAÇÃO para o exemplo "US news story" (em inglês).
 *
 * Escrito à mão, no mesmo formato que a IA devolve, para testar o site sem
 * chave e sem custo. O texto é fictício e tem viés no sentido OPOSTO ao do
 * exemplo brasileiro (aqui, contra uma regulação ambiental), para mostrar
 * que a mesma régua vale para os dois lados. Passa pelas mesmas regras de
 * uma análise real (conferência de citações e cálculo das notas).
 */

import type { OverviewOutput, SpecialistOutput, SynthesisOutput, TriageOutput } from "@/lib/analysis/schemas";
import type { SourceInfo } from "@/lib/analysis/types";
import type { Lang } from "@/lib/taxonomy";
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

/** Idioma do relatório deste exemplo. */
export const lang: Lang = "en";

export const text = getExample("noticia-en")!.text;

export const source: SourceInfo = {
  type: "text",
  title: "Reckless green mandate will cost Millbrook families thousands",
  outlet: "Example Daily (fictional)",
};

export const claimCheck = null;

export const triage: TriageOutput = {
  contentType: "news",
  contentTypeReason:
    "Published as a news report, but the author adds judgments and predictions outside quotation marks; the genre follows the form of publication.",
  country: "United States",
  countryCode: "US",
  politicalContext:
    "Local climate policy debate: building electrification mandates are generally backed by Democrats and environmental groups and opposed by Republicans, builders and many homeowners, who stress costs and freedom of choice.",
  documentLanguage: "English",
  topic: "Heat pump mandate in a fictional US city",
  contentSummary:
    "Millbrook's city council voted 5-4 to require heat pumps in homes sold after 2027; the story gathers criticism from builders, realtors and unnamed experts and briefly mentions the ordinance's author.",
  title: "Reckless green mandate will cost Millbrook families thousands",
  author: "",
  outlet: "",
  publishedAt: "",
};

export const specialists: Record<string, SpecialistOutput> = {
  language: {
    categories: [
      found("loaded_language", 7, "high", "The author uses emotionally charged words outside quotation marks, starting with the headline.", [
        ["Reckless green mandate will cost Millbrook families thousands", "\"Reckless\" is the author's judgment, not a fact. Neutral version: \"Millbrook council approves heat pump requirement\"."],
        ["a radical scheme", "\"Radical scheme\" frames the policy as extreme before any facts are given."],
        ["rammed through by the council's activist majority", "\"Rammed through\" suggests wrongdoing without showing anything irregular about the vote."],
      ]),
      found("labeling", 5, "high", "Elected officials are labeled in a way that already judges them.", [
        ["the council's activist majority", "\"Activist\" casts the elected majority as ideologues rather than council members."],
      ]),
      none("euphemism_dysphemism", "The charged terms are covered under loaded language; no separate euphemism or dysphemism stands out.", "low"),
      found("attribution_verbs", 7, "high", "Critics \"say\"; the ordinance's author \"claimed\" and \"insisted\". The verb choice favors one side.", [
        ["said Dale Hutchins", "A neutral verb for the critic of the policy."],
        ["Council member Rachel Ortiz, who wrote the ordinance, claimed", "\"Claimed\" casts doubt on the supporter's explanation."],
        ["She insisted that federal rebates would cover most installation costs", "\"Insisted\" suggests stubbornness rather than a stated position."],
      ]),
      found("generalizations", 6, "high", "Absolute generalizations reinforce the story's thesis without evidence.", [
        ["proof that green mandates always backfire", "One county's experience is turned into a rule about all such policies."],
        ["Everyone who has looked at the numbers knows the result", "Attributes a conclusion to \"everyone\" without any survey or study."],
      ]),
    ],
  },
  framing: {
    categories: [
      found("framing", 7, "high", "The story is built as victims (families, businesses) against a villain (the council); the policy's goals barely appear.", [
        ["Families who cannot afford the upgrade may soon have to choose between heating their homes and putting food on the table.", "The closing line frames the policy as a threat to basic needs, with no evidence about how many families would be affected."],
      ]),
      found("headline_body", 6, "high", "The headline says the mandate \"will cost families thousands\"; the body only reports an upper-bound estimate from realtors.", [
        ["Reckless green mandate will cost Millbrook families thousands", "The body cites \"as much as $25,000\" for homes being sold and mentions rebates, but never shows that families in general will pay thousands."],
      ]),
      found("emphasis_placement", 6, "high", "The rationale for the policy appears only in the fifth paragraph, framed with doubt.", [
        ["Council member Rachel Ortiz, who wrote the ordinance, claimed the program would cut emissions and lower bills over time.", "The main argument for the policy comes late and briefly, after four paragraphs of criticism."],
      ]),
      found("spin", 5, "medium", "Neutral facts come with a negative interpretation built in.", [
        ["after just two public hearings", "\"Just\" presents a normal procedure as rushed without saying what would be expected."],
      ]),
    ],
  },
  sources: {
    categories: [
      found("source_balance", 7, "high", "Builders, realtors and unnamed experts criticize the policy; only its author is mentioned in its favor, and without a direct quote.", [
        ["said Dale Hutchins, president of the Millbrook Homebuilders Association", "A source with a direct stake in the issue, with no equivalent voice on the other side."],
        ["Local realtors warn the rule could add as much as $25,000 to the cost of a home.", "Another interested party; no independent cost estimate is given."],
      ]),
      found("vague_sources", 8, "high", "The strongest claims are attributed to unnamed \"experts\" and \"critics\".", [
        ["Experts agree the technology simply does not work in cold climates.", "Which experts? None is named, and no study is cited."],
        ["critics say will bankrupt working families", "The most alarming prediction is attributed to unnamed critics."],
      ]),
      none("selective_quotes", "There is no sign in the text of quotes cut or taken out of context.", "low"),
      found("source_credentials", 3, "medium", "An industry representative is the only named expert voice.", [
        ["president of the Millbrook Homebuilders Association", "His role is relevant, but he speaks for an interested industry, not as an independent expert."],
      ]),
    ],
  },
  omission: {
    categories: [
      found("missing_context", 7, "high", "Key comparisons that would change the reading are missing.", [
        ["Energy bills in neighboring Carver County jumped 40% in the two years after it adopted a similar policy", "No mention of whether energy prices rose everywhere in those years, regardless of the policy."],
        ["could add as much as $25,000 to the cost of a home", "An upper bound with no typical cost and no deduction for the federal rebates the story itself mentions."],
      ]),
      found("missing_perspectives", 6, "medium", "Supporters are described only to discredit them; none is quoted, and no energy or climate expert is heard.", [
        ["Supporters of the plan, many of whom do not own homes in Millbrook, packed the chamber with signs.", "Supporters appear as a crowd, not as people with arguments."],
      ]),
      found("selective_facts", 5, "medium", "Only facts that hurt the policy are listed.", [
        ["but did not explain where the remaining money would come from", "Highlights a gap in the supporter's argument without testing the critics' claims the same way."],
      ]),
    ],
  },
  data: {
    categories: [
      found("misleading_numbers", 7, "high", "The main numbers are given without the right baseline.", [
        ["jumped 40% in the two years", "A percentage with no baseline and no comparison with counties that did not adopt the policy."],
        ["as much as $25,000", "A maximum presented as if it were the typical cost."],
      ]),
      found("correlation_causation", 7, "high", "A rise in bills after the policy is treated as proof that the policy caused it.", [
        ["Energy bills in neighboring Carver County jumped 40% in the two years after it adopted a similar policy, proof that green mandates always backfire", "Bills could have risen for many reasons (fuel prices, inflation, weather). The causal link is not shown."],
      ]),
      found("cherry_picking", 4, "medium", "The comparison uses a single county and a short, chosen time window.", [
        ["in the two years after it adopted a similar policy", "Why two years, and why only Carver County? A different window or place could tell a different story."],
      ]),
      found("unsourced_data", 5, "medium", "The key statistic has no source.", [
        ["Energy bills in neighboring Carver County jumped 40%", "No utility data, report or study is cited for the 40% figure."],
      ]),
    ],
  },
  fact_opinion: {
    categories: [
      found("opinion_as_fact", 7, "high", "Interpretations and predictions are written as established facts.", [
        ["Experts agree the technology simply does not work in cold climates.", "A contested technical claim presented as settled fact."],
        ["proof that green mandates always backfire", "The author's conclusion presented as demonstrated."],
      ]),
      found("editorializing", 8, "high", "In a news story, the author takes sides and steers the reader.", [
        ["Once the city starts telling you how to heat your home, it is only a matter of time before it tells you what car to drive and what food to eat.", "The author's own opinion, unattributed, in a news report."],
        ["Residents have until March to voice their opposition before the rule takes effect.", "Assumes that residents oppose the rule and nudges them to act."],
      ]),
    ],
  },
  emotional: {
    categories: [
      none("clickbait", "The headline is loaded, but it does not use the mystery or teasing typical of clickbait."),
      found("fear_outrage", 7, "high", "The story stirs up fear (cold homes, hunger) and outrage at the council.", [
        ["higher costs, colder homes and fewer jobs", "A list of harms with no data behind any of them."],
        ["choose between heating their homes and putting food on the table", "An emotional image that is not supported by figures."],
      ]),
      found("false_urgency", 4, "medium", "A deadline is used to create pressure.", [
        ["Residents have until March to voice their opposition before the rule takes effect.", "Urgency aimed at opposing the rule, not at informing about it."],
      ]),
    ],
  },
  fallacies: {
    categories: [
      none("straw_man", "The supporter's position is briefly but fairly stated; its weak treatment falls under Sources and Omission."),
      found("false_dilemma", 5, "medium", "Families are shown with only two options.", [
        ["choose between heating their homes and putting food on the table", "Ignores rebates, financing, exemptions and other options the story itself hints at."],
      ]),
      found("ad_hominem", 5, "medium", "Supporters are discredited by who they are, not by their arguments.", [
        ["many of whom do not own homes in Millbrook", "Whether supporters own homes says nothing about whether their arguments are right."],
      ]),
      found("slippery_slope", 7, "high", "The author claims one rule will inevitably lead to much broader control.", [
        ["it is only a matter of time before it tells you what car to drive and what food to eat", "A chain of extreme consequences with no evidence, in the author's own voice."],
      ]),
      found("appeal_to_authority", 3, "low", "Generic \"experts\" are used as proof.", [
        ["Experts agree", "The authority invoked is neither identified nor are its arguments presented."],
      ]),
      none("false_equivalence", "There is no improper comparison between positions of very different weight."),
    ],
  },
  interests: {
    categories: [
      none("sponsored_content", "There are no signs of advertising content.", "high"),
      none("conflicts_of_interest", "No conflict of interest of the author or outlet can be identified from the text itself.", "low"),
    ],
  },
  representation: {
    categories: [
      none("stereotype_gender", "No gender stereotypes."),
      none("stereotype_race", "No mentions of race or ethnicity."),
      none("stereotype_class", "Working families are mentioned, but not portrayed in a stereotyped way.", "low"),
      none("stereotype_region", "No regional stereotypes."),
      none("stereotype_religion", "No mentions of religion."),
      none("stereotype_nationality", "No mentions of nationalities."),
    ],
  },
};

export const overview: OverviewOutput = {
  economic: {
    position: "right",
    confidence: "medium",
    justification:
      "The story treats a government regulation as reckless and costly, gives voice mainly to industry and critics of regulation, and casts doubt on the policy's economic rationale.",
    quote: "Reckless green mandate will cost Millbrook families thousands",
  },
  social: {
    position: "not_applicable",
    confidence: "high",
    justification: "The topic is energy regulation and costs; the story does not deal with social values, religion or public safety.",
    quote: "",
  },
  dispute: {
    caveat: "",
    status: "favors_b",
    sideA: "Millbrook City Council majority",
    sideB: "Opponents of the mandate",
    strength: "strong",
    confidence: "high",
    justification:
      "Criticism from builders, realtors and unnamed experts opens and dominates the story; the policy's author appears only in the fifth paragraph, with verbs that suggest doubt.",
    quote: "Reckless green mandate will cost Millbrook families thousands",
  },
  factOpinion: {
    factPercent: 40,
    explanation:
      "The facts (the 5-4 vote, the 2030 deadline, the rule for homes sold after 2027) share space with predictions, judgments and appeals from the author.",
  },
  rebuttals: [],
  omissions: [
    {
      title: "Typical cost after rebates",
      explanation: "How much a typical installation would cost once the federal rebates mentioned in the story are deducted.",
    },
    {
      title: "Energy prices in the same period",
      explanation: "Whether energy bills also rose in counties without similar policies during the same two years.",
    },
    {
      title: "Arguments of the supporters",
      explanation: "Why the majority voted for the ordinance and what savings or emission cuts they expect, in their own words.",
    },
    {
      title: "Independent technical assessment",
      explanation: "What independent studies say about heat pump performance in climates like Millbrook's.",
    },
  ],
};

export const synthesis: SynthesisOutput = {
  summary:
    "The text presents itself as news but reads as a campaign piece against the heat pump mandate. Its main weaknesses are the author's loaded language, the reliance on unnamed \"experts\" and \"critics\", the editorializing in its final paragraphs and numbers given without a baseline, most notably the 40% rise in Carver County presented as proof that such policies always fail. The policy's rationale appears only briefly in the fifth paragraph, with verbs that suggest doubt. The economic leaning is to the right, through its rejection of regulation; there is no identifiable leaning on the social axis.",
  summarySimple:
    "This story takes sides against the new heating rule. It uses strong words, mostly hears critics of the rule, and treats one county's higher energy bills as proof, without checking other causes.",
  rewrite: {
    evidenceId: "loaded_language-1",
    rewritten: "Millbrook council approves heat pump requirement; critics say it will raise costs for families",
    explanation:
      "I replaced \"reckless\" with a description of the decision and attributed the claim about costs to the people who make it, the critics, instead of presenting it as fact.",
  },
};
