/**
 * ============================================================================
 *  TEXTOS DO SITE EM INGLÊS (English UI strings)
 * ============================================================================
 *  Mesma estrutura de pt.ts. Se você adicionar um texto em pt.ts, adicione o
 *  equivalente aqui; o verificador de código avisa se faltar algum.
 * ============================================================================
 */

import type { Dict } from "./pt";
import { COMES_BACK, FREE_PLAN, PERIOD } from "@/lib/plans";

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
    login: "Sign in",
    account: "My account",
    myAnalyses: "My analyses",
    logout: "Sign out",
  },

  feedback: {
    button: "Send feedback",
    title: "Send feedback",
    lede: "unslant is in testing. Tell us what you think: something confusing, a bug, an analysis that felt unfair, an idea.",
    message: "Your feedback",
    contact: "Your name or email (optional)",
    contactHelp: "Only if you'd like a reply.",
    send: "Send",
    sending: "Sending…",
    thanks: "Thank you! Your feedback was sent.",
    error: "Couldn't send it right now. Please try again in a moment.",
    rateLimited: "You've sent several messages in a row. Please try again in a little while.",
    close: "Close",
  },

  myAnalyses: {
    title: "My analyses",
    lede: "The analyses you ran with your account. Opening one doesn't call the AI again and doesn't use your daily limit.",
    loading: "Loading…",
    empty: "You haven't run any analysis with your account yet.",
    needLogin: "Sign in to see your analyses.",
    loadError: "We couldn't load your analyses right now. Please try again shortly.",
    untitled: "Untitled analysis",
    simple: "simple",
    detailed: "detailed",
    running: "in progress",
    failed: "not completed",
    open: "Open",
    delete: "Delete",
    confirmDelete: "Delete this analysis from your account? This can't be undone.",
    deleteError: "We couldn't delete it right now. Please try again.",
    deleteNote: "You can delete any analysis. Deleting doesn't give back the day's usage.",
    deleteAccountTitle: "Delete my account",
    deleteAccountText: "Deletes your account, your email and all your analyses. This cannot be undone.",
    deleteAccount: "Delete my account",
    confirmDeleteAccount: "Are you sure? Your account and ALL your analyses will be permanently deleted.",
    deleteAccountError: "Couldn't delete the account right now. Please try again in a moment.",
  },

  login: {
    title: "Sign in",
    lede: "No password: enter your email and we'll send you a sign-in link. The first time, your account is created automatically.",
    email: "Your email",
    submit: "Send sign-in link",
    sending: "Sending…",
    sent: (email: string) => `Done! We sent a link to ${email}. Open the email and click the link to sign in, in this same browser (check your spam folder too).`,
    error: "We couldn't send the link right now. Check the email address and try again in a few minutes.",
    linkError: "The sign-in link is invalid, has expired or was opened in a different browser. Request a new one below and open it in this same browser.",
    unavailable: "Sign-in is not available on this site yet.",
    why: `With an account you get ${FREE_PLAN.en}, and your analyses are saved under "My analyses".`,
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
      figures: (n: number) => `${n === 1 ? "1 page with a figure or table" : `${n} pages with figures or tables`} will also be analyzed as images.`,
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
    view: {
      label: "Type of analysis",
      simple: { title: "Simple", desc: "The essentials: score, leaning and the 3 main problems, in everyday language." },
      detailed: { title: "Detailed", desc: "Everything: all categories, the text with highlighted passages, images and sources." },
      help: "Both use the same full analysis; only what you see changes.",
      needsLogin: "For the detailed analysis, sign in with your email (no password).",
      remaining: (s: number, d: number) => `Today you still have ${s} simple ${s === 1 ? "analysis" : "analyses"} and ${d} detailed.`,
      remainingTotal: (n: number) => `You have ${n} ${n === 1 ? "analysis" : "analyses"} left ${PERIOD.en} (simple or detailed).`,
      remainingAnon: (s: number) => (s > 0 ? `Without an account: 1 simple analysis every 24 hours. Sign in (no password) to get ${FREE_PLAN.en}.` : `You've used your free analysis for the last 24 hours. Sign in (no password) to get ${FREE_PLAN.en}.`),
    },
    genre: {
      label: "Type of text",
      auto: "Detect automatically",
      help: "If you know it, choose it. Otherwise the AI identifies it and explains why.",
    },
    reportLanguage: "The report will be in English. For Portuguese, switch the language at the top of the page.",
    examples: {
      title: "No text at hand?",
      demoTitle: "See a ready-made analysis",
      demoDesc: "A fictional US news story about a heat pump mandate. Free, no AI used.",
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
    note: {
      long: "Long text: the analysis runs in stages to respect the AI's usage limit. It may take a few minutes.",
      waiting: "Waiting for the AI's per-minute usage limit to free up. The analysis will continue on its own shortly.",
    },
    state: { done: "done", active: "in progress", pending: "waiting" },
    cancel: "Cancel analysis",
    background: "You can close this page: the analysis keeps running and the result will appear in My analyses.",
    leave: "Back to start (the analysis keeps running)",
  },

  result: {
    newAnalysis: "New analysis",
    demoNote: "Ready-made example: prepared by hand, without the AI.",
    cacheNote: "This text had already been analyzed with the same version. Showing the saved result.",
    reanalyze: "Analyze again",
    reanalyzeCost: "(costs the same as a new analysis)",
    openOriginal: "Open the original page",
    untitled: "Analyzed text",
    claimHeading: "Analyzed claim",
    typeReason: (type: string) => `Why "${type}": `,
    typeByUser: "Type chosen by you.",
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

    mode: { label: "Display mode", simple: "Simple", detailed: "Detailed" },
    rebuttals: {
      title: "The author's replies to criticism",
      lede: "The text rebuts known criticisms. For each one, we assess whether the reply holds up and how far.",
      criticism: "Criticism",
      response: "Author's reply",
      verdict: { valid: "Holds up", partly_valid: "Partly holds up", not_valid: "Doesn't hold up" },
    },
    references: {
      show: "Show references",
      hide: "Hide references",
      note: "The reference list is not part of the analysis: there is no bias to assess in it. Citations within the text are still analyzed.",
    },
    unlock: {
      use: "Use today's detailed analysis",
      working: "Unlocking…",
      useHelp: (n: number) => `The full analysis is already done: this doesn't call the AI again. ${n === 1 ? "1 detailed analysis" : `${n} detailed analyses`} left ${PERIOD.en}.`,
      usedUp: `You've used your detailed analyses ${PERIOD.en}. ${COMES_BACK.en}`,
      signIn: "Sign in to see the full analysis",
      signInWhy: `No password, just your email. With an account you get ${FREE_PLAN.en}.`,
    },
    simple: {
      politicalTitle: "Political leaning",
      favors: (side: string, how: string) => `${how.charAt(0).toUpperCase() + how.slice(1)} favors ${side}`,
      strength: { slight: "slightly", moderate: "moderately", strong: "strongly" },
      balanced: "Treats the sides of the dispute evenly",
      axis: (axis: string, pos: string) => `${axis}: ${pos.toLowerCase()}`,
      noLeaning: "No political leaning identified.",
      problemsTitle: "Main problems",
      noProblems: "No relevant problems found.",
      seeAll: "See full analysis",
      seeAllHelp: "All categories, the full text with highlighted passages, images and sources.",
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
        strength: { slight: "(slightly)", moderate: "(moderately)", strong: "(strongly)" },
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
      legend: { low: "mild", mid: "moderate or marked", high: "strong or very strong" },
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

    figures: {
      title: "Images and charts",
      intro: (n: number) =>
        `The AI examined ${n === 1 ? "1 image" : `${n} images`} from the content (charts, tables, photos) and compared them with what the text says.`,
      noIssues: "No problems found in this image.",
      hidden: (n: number) => `${n === 1 ? "1 decorative or unrelated image was" : `${n} decorative or unrelated images were`} left out.`,
    },

    rewrite: {
      title: "A more neutral version",
      original: "Original passage",
      suggested: "Suggested neutral version",
      show: "Show passage in the text",
      none: "No passage needs rewriting: the problems found are in quoted statements or are mild.",
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
      line: "Editorial line",
      estimated: "estimate",
      lineSource: "source",
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
      showFigure: "Show the image",
      discarded: (n: number) =>
        `${n === 1 ? "1 passage quoted by the AI was" : `${n} passages quoted by the AI were`} discarded because ${n === 1 ? "it does" : "they do"} not exist in the original text.`,
    },

    stats: {
      aria: "Technical details of the analysis",
      model: "Models: ",
      cost: "Estimated cost: ",
      costCached: (cost: string) => `US$ 0 (saved result · the original analysis cost US$ ${cost})`,
      version: "Analysis version: ",
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
      feature: "Feature",
      editorial: "Editorial",
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
    figureKind: {
      chart: "chart",
      table: "table",
      photo: "photo",
      illustration: "illustration",
      diagram: "diagram",
      map: "map",
      infographic: "infographic",
      other: "image",
    },
    stage: {
      identificação: "identification",
      especialistas: "specialists",
      "visão geral": "overview",
      verificação: "fact-check",
      imagens: "images",
      síntese: "synthesis",
      busca: "web search",
      "formatar busca": "web search",
    } as Record<string, string>,
    editorialLine: {
      left: "left",
      center_left: "center-left",
      center: "center",
      center_right: "center-right",
      right: "right",
      institutional: "official",
      legal: "legal",
      fact_check: "fact-check",
      academic: "academic",
      wire: "news agency",
      international: "international",
      unknown: "not classified",
    },
  },
};
