/**
 * ============================================================================
 *  TEXTOS DO SITE EM INGLÊS (English UI strings)
 * ============================================================================
 *  Mesma estrutura de pt.ts. Se você adicionar um texto em pt.ts, adicione o
 *  equivalente aqui; o verificador de código avisa se faltar algum.
 * ============================================================================
 */

import type { Dict } from "./pt";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const num = (n: number) => n.toLocaleString("en-US");

export const en: Dict = {
  meta: {
    title: "unslant: see the biases in any text",
    description:
      "Send a link, text, PDF or claim and see the biases it contains, with passages from the text itself as evidence.",
  },

  nav: {
    home: "unslant, home page",
    methodology: "Methodology",
    glossary: "Types of bias",
    privacy: "Privacy",
    about: "About us",
    menu: "Site menu",
    otherLanguage: "Português",
    otherLanguageAria: "Ler este site em português",
  },

  footer: {
    disclaimer:
      "unslant uses artificial intelligence, which can also be biased and make mistakes. Treat the analysis as a starting point for thinking, not a verdict.",
  },

  home: {
    title: "See how a text is trying to persuade you.",
    intro:
      "Send a news story, an opinion piece, a paper or a claim you heard somewhere. unslant points out bias in language, sources, data and reasoning, always quoting the exact passage as evidence, and shows political leaning when there is one.",
    tabsLabel: "Content type",
    tabs: { url: "Link", text: "Text", pdf: "PDF", claim: "Claim" },
    url: {
      label: "Link to the article",
      help: "Some sites block automated reading or have a paywall. If so, copy the text and use the Text tab.",
    },
    text: {
      label: "Text to analyze",
      placeholder: "Paste the full text here, ideally with the headline on the first line.",
      empty: "At least 80 words.",
      count: (n: number, min: number) =>
        `${num(n)} ${plural(n, "word", "words")}${n < min ? ` (minimum ${min})` : ""}`,
    },
    pdf: {
      label: "PDF file (articles and papers)",
      choose: "Choose file",
      dropHelp: "or drag the PDF here. The file is read in your browser.",
      reading: (name: string) => `Reading ${name}…`,
      extracted: (n: number) => `(${num(n)} words extracted)`,
      notPdf: "That file is not a PDF.",
    },
    claim: {
      label: "Claim to analyze",
      placeholder: "E.g.: Young people today just don't want to work anymore.",
      help: "A sentence or short paragraph: something you heard, read in a group chat or saw on social media.",
      contextLabel: "Where did you see or hear it? (optional)",
      contextPlaceholder: "E.g.: family group chat, a viral video, a politician's speech",
      examplesLabel: "Try:",
      count: (n: number) => `${num(n)} ${plural(n, "word", "words")} (3 to 300)`,
    },
    submit: "Analyze",
    reportLanguage: "The report will be in English. For Portuguese, switch the language at the top of the page.",
    examples: {
      title: "No text at hand?",
      demoTitle: "See a ready-made analysis",
      demoDesc: "A fictional Brazilian news story about health cuts (report in Portuguese). Free, no AI used.",
      demoClaimTitle: "See an analyzed claim",
      demoClaimDesc: "\"Young people today don't want to work…\" (report in Portuguese). Free, no AI used.",
      hint: "Or load a sample text (fictional) into the Text tab. Analyzing these texts uses the AI as usual.",
      downloadPdf: "Download the sample paper (PDF)",
    },
    unexpectedError: "An unexpected error occurred. Please try again.",
    networkError: "Couldn't reach the server. Check your connection and try again.",
  },

  progress: {
    title: "Analyzing",
    duration: "This usually takes 30 seconds to 2 minutes.",
    steps: {
      extracting: { label: "Extracting the text", detail: "Separating the main text from menus and ads." },
      context: { label: "Identifying the context", detail: "Type of text, country and political setting." },
      analyzing: { label: "Analyzing biases", detail: "Language, sources, data, fallacies and more, all at once." },
      synthesizing: { label: "Writing the summary", detail: "Combining the findings and checking every quoted passage." },
      balancing: {
        label: "Finding texts to balance your reading",
        detail: "Searching the web for other coverage of the topic and writing the summary.",
      },
    },
    doneCount: (done: number, total: number) => `${done} of ${total} aspects done`,
    state: { done: "done", active: "in progress", pending: "waiting" },
    cancel: "Cancel analysis",
  },

  result: {
    newAnalysis: "New analysis",
    demoNote: "Ready-made example: prepared by hand, without the AI.",
    cacheNote: "This text had already been analyzed. Showing the saved result.",
    openOriginal: "Open the original page",
    untitled: "Analyzed text",
    claimHeading: "Analyzed claim",
    claimSeenAt: "Seen or heard at:",
    summaryTitle: "Summary",
    contextConsidered: "Context considered: ",
    languageNote: (lang: string) => `This result was generated in ${lang}.`,

    score: {
      srTitle: "Overall bias score",
      outOf: "out of 10",
      naNote: (n: number) =>
        `${n} ${plural(n, "category does", "categories do")} not apply to this text and ${plural(n, "was", "were")} left out of the score.`,
      explanation:
        "The score measures how biased the text is overall (language, sources, data, reasoning…), not just politically. 0 is a balanced text; 10 is severe distortion.",
    },

    axes: {
      title: "Political leaning",
      countryNote: (country: string) => `Assessed against the political spectrum of the text's country (${country}). `,
      unidentifiedNote: "“Unidentified” means the text does not provide enough evidence.",
      economic: { name: "Economic", help: "State and market" },
      social: { name: "Social", help: "Values and customs" },
      dispute: {
        name: "Which side of the dispute it favors",
        help: "Government × opposition, candidates",
        favors: (side: string) => `Favors ${side}`,
        balanced: "Balanced",
        unidentified: "Unidentified",
        notApplicable: "Not applicable: the text is not about a dispute between political sides.",
      },
    },

    factOpinion: {
      title: "Fact and opinion",
      aria: (fact: number) => `About ${fact}% facts and ${100 - fact}% opinion`,
      facts: "verifiable facts",
      opinion: "opinion and interpretation",
    },

    groups: {
      title: "Where the text leans",
      description: "Score for each aspect, from 0 (no problem) to 10. Click an aspect to see the details.",
      notApplicable: "not applicable",
      radarAria: "Radar chart with the score of each aspect",
    },

    text: {
      title: "The text, with flagged passages",
      titleClaim: "The claim, with flagged passages",
      count: (n: number) => `${n} ${plural(n, "passage was", "passages were")} flagged. Click a highlight to see why.`,
      none: "No passage was flagged as problematic.",
      countFiltered: (shown: number, total: number) =>
        `Showing ${shown} moderate or strong ${plural(shown, "passage", "passages")} of ${total}. Click a highlight to see why.`,
      showAll: (n: number) => `Show all passages (${n})`,
      showStrong: "Show only moderate and strong",
      legendAria: "Color legend",
      legend: { low: "mild issue", mid: "moderate", high: "strong" },
      asideHint: "Click a highlighted passage to see what kind of bias it signals and why.",
      detailsOne: "What this passage signals",
      detailsMany: (n: number) => `This passage appears in ${n} categories`,
      close: "Close",
      dialogAria: "Passage details",
      markAria: (slice: string, names: string) => `${slice}. Flagged passage: ${names}`,
    },

    omissions: {
      title: "What the text may be leaving out",
      titleClaim: "What this claim leaves out",
      none: "No relevant omissions were identified.",
    },

    rewrite: {
      title: "A more neutral version",
      original: "Original passage",
      suggested: "Suggested neutral version",
      show: "Show passage in the text",
    },

    claim: {
      title: "Claim check",
      type: "Type",
      verifiability: "Can it be checked?",
      assessment: "What the evidence suggests",
      whatIsKnown: "What is known",
      origins: "Why this idea circulates",
      howToVerify: "How to check it",
      moreAccurate: "A more accurate version",
      disclaimer:
        "This check relies on the AI's general knowledge, which has a cutoff date and can be wrong. It does not consult sources in real time. Check the suggested sources before sharing.",
    },

    balance: {
      title: "To balance your reading",
      titleClaim: "Where to check this claim",
      intro: "Real texts found on the web, from other outlets and perspectives. We check that every link actually came from the search.",
      introClaim: "Real sources found on the web to help you check the claim. We check that every link actually came from the search.",
      perspective: "Perspective",
      opensNewTab: "(opens in a new tab)",
      suggestionsTitle: "Other suggestions",
      none: "The search found no reliable texts on this topic. See the suggestions below.",
      unavailable: "The web search could not be completed this time. The rest of the analysis is not affected.",
      demo: "Ready-made examples don't run the web search. In a real analysis, this section shows texts from other outlets and perspectives on the same topic, with links.",
    },

    details: {
      title: "All categories",
      description: "Each category with its score, confidence level and the passages supporting it.",
      groupNotApplicable: "Not applicable to this text",
      groupNoProblems: "No problems found",
      groupFound: (found: number, total: number) => `${found} of ${total} categories with problems`,
      status: {
        none_found: "No problems found",
        not_applicable: "Not applicable to this text",
      },
      showInText: "Show in text",
      discarded: (n: number) =>
        `${n === 1 ? "1 passage quoted by the AI was" : `${n} passages quoted by the AI were`} discarded because ${n === 1 ? "it does" : "they do"} not exist in the original text.`,
    },

    stats: {
      aria: "Technical details of the analysis",
      model: "Model: ",
      cost: "Estimated cost: ",
      costCached: "US$ 0 (saved result)",
      time: "Time: ",
      discarded: "Discarded passages: ",
      searches: "Web searches: ",
      parts: (n: number) => `The text was split into ${n} parts and the results were combined.`,
      demoModel: "ready-made example (no AI)",
    },
  },

  labels: {
    contentType: {
      news: "News",
      opinion: "Opinion",
      analysis: "Analysis",
      academic_paper: "Academic paper",
      press_release: "Press release",
      blog: "Blog",
      other: "Other",
      claim: "Claim",
    },
    confidence: { low: "low confidence", medium: "medium confidence", high: "high confidence" },
    position: { left: "Left", right: "Right", unidentified: "Unidentified", not_applicable: "Not applicable" },
    claimType: {
      factual: "Factual claim",
      opinion: "Opinion",
      prediction: "Prediction",
      value_judgment: "Value judgment",
      mixed: "Mix of fact and opinion",
    },
    verifiability: {
      verifiable: "Yes",
      partially_verifiable: "Partly",
      not_verifiable: "No",
    },
    assessment: {
      consistent: "Consistent with the evidence",
      partially_consistent: "Has some truth, but exaggerates or oversimplifies",
      inconsistent: "Contradicts the evidence",
      insufficient_evidence: "Not enough evidence to say",
      not_applicable: "It's an opinion: not true or false as such",
    },
    languageName: { pt: "Portuguese", en: "English" },
  },
};
