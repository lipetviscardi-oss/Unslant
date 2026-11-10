/**
 * MONTAGEM DO RESULTADO
 *
 * Junta as respostas da IA (de uma ou várias partes do texto), confere as
 * citações, calcula as notas e monta o resultado final. Também é usado pelo
 * exemplo de demonstração, para que ele passe pelas mesmas regras.
 */

import { config } from "@/lib/config";
import { NOT_MILD_MIN, TAXONOMY, scoreLabel, type BiasGroup, type ContentKind, type Lang } from "@/lib/taxonomy";
import { createQuoteMatcher, type QuoteMatcher } from "./verify";
import { getDict } from "@/lib/i18n/server";
import { clamp, scoreGroup, scoreOverall } from "./scoring";
import type {
  AxisPosition,
  ClaimCheckOutput,
  Confidence,
  OverviewOutput,
  SpecialistOutput,
  SynthesisOutput,
  TriageOutput,
  VisualOutput,
} from "./schemas";
import type { VisualInput } from "./visuals";
import type { AnalysisResult, AxisResult, CategoryResult, DisputeResult, Evidence, FigureResult, GroupResult, RebuttalResult, SourceInfo } from "./types";

/** Respostas da IA para UMA parte do texto. */
export interface RawPart {
  words: number;
  specialists: Record<string, SpecialistOutput>;
  overview: OverviewOutput;
}

export interface Findings {
  groups: GroupResult[];
  political: { economic: AxisResult; social: AxisResult; dispute: DisputeResult };
  factOpinion: { factPercent: number; explanation: string };
  omissions: { title: string; explanation: string }[];
  rebuttals: RebuttalResult[];
  overall: { score: number; label: string; simpleLabel: string };
  discardedEvidence: number;
}

const CONF_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

const NOTES = {
  noVisuals: {
    pt: "O conteúdo não tinha imagens, gráficos ou tabelas para analisar.",
    en: "The content had no images, charts or tables to analyze.",
  },
  visualFailed: {
    pt: "Não foi possível analisar as imagens desta vez.",
    en: "The images could not be analyzed this time.",
  },
  visualOk: {
    pt: "As imagens analisadas não mostram esse problema.",
    en: "The analyzed images do not show this problem.",
  },
  quotedOnly: {
    pt: "Os trechos apontados eram falas de pessoas citadas, entre aspas, e não afirmações do próprio autor. Por isso, não contam aqui.",
    en: "The flagged passages were quotes from other people, in quotation marks, not the author's own statements, so they don't count here.",
  },
  noNumbers: {
    pt: "O texto não traz números ou estatísticas.",
    en: "The text contains no numbers or statistics.",
  },
  missing: {
    pt: "A IA não avaliou esta categoria nesta análise.",
    en: "The AI did not evaluate this category in this analysis.",
  },
  discarded: {
    pt: "A IA apontou um possível problema, mas os trechos citados não foram encontrados no texto. Por isso, o apontamento foi desconsiderado.",
    en: "The AI flagged a possible issue, but the quoted passages were not found in the text, so the flag was discarded.",
  },
  axisDiscarded: {
    pt: "O trecho usado para justificar a classificação não foi encontrado no texto, então ela foi desconsiderada.",
    en: "The passage used to justify this classification was not found in the text, so it was discarded.",
  },
};

/** Tipo de conteúdo usado para escolher os grupos de viés. */
export function contentKind(triage: TriageOutput): ContentKind {
  if (triage.contentType === "claim") return "claim";
  if (triage.contentType === "academic_paper") return "paper";
  return "article";
}

/** Grupos ativos para o tipo de conteúdo (ver "appliesTo" em lib/taxonomy.ts). */
export function activeGroups(triage: TriageOutput): BiasGroup[] {
  const kind = contentKind(triage);
  return TAXONOMY.filter((g) => g.appliesTo.includes(kind));
}

/**
 * Categorias que avaliam a VOZ DO AUTOR. Nelas, um trecho entre aspas (fala
 * de alguém citado) não serve como prova: é afirmação da pessoa citada, não
 * do jornalista. (A escolha de quais falas aparecem é avaliada em "Fontes".)
 */
const AUTHOR_VOICE = new Set([
  "loaded_language",
  "labeling",
  "euphemism_dysphemism",
  "generalizations",
  "spin",
  "opinion_as_fact",
  "editorializing",
  "clickbait",
  "fear_outrage",
  "false_urgency",
  "correlation_causation",
  "straw_man",
  "false_dilemma",
  "ad_hominem",
  "slippery_slope",
  "appeal_to_authority",
  "false_equivalence",
]);

/** Trechos do texto que estão entre aspas (falas citadas). */
export function findQuotedRanges(text: string): { start: number; end: number }[] {
  const ranges: { start: number; end: number }[] = [];
  const re = /“[^”]{1,1500}”|«[^»]{1,1500}»|"[^"\n]{1,1500}"|‘[^’\n]{2,600}’/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) ranges.push({ start: m.index, end: m.index + m[0].length });
  return ranges;
}

function insideQuotes(pos: { start: number; end: number }, quoted: { start: number; end: number }[]) {
  return quoted.some((q) => pos.start >= q.start && pos.end <= q.end);
}

function verifyCategory(
  categoryId: string,
  raw: SpecialistOutput["categories"][number],
  matcher: QuoteMatcher,
  lang: Lang,
  quotedRanges: { start: number; end: number }[],
): CategoryResult {
  let status = raw.status;
  let score = status === "found" ? clamp(raw.score, 0, 10) : 0;
  let summary = raw.summary;
  const evidence: Evidence[] = [];
  let discarded = 0;
  let quotedOnly = 0;
  const seen = new Set<number>();

  if (status === "found") {
    for (const ev of raw.evidence) {
      const pos = matcher.find(ev.quote);
      if (!pos) {
        discarded++;
        continue;
      }
      if (seen.has(pos.start)) continue; // trecho repetido
      const quoted = insideQuotes(pos, quotedRanges);
      // Fala de alguém citado não prova viés na voz do autor.
      if (quoted && AUTHOR_VOICE.has(categoryId)) {
        quotedOnly++;
        continue;
      }
      seen.add(pos.start);
      const periodNorm = ev.eraUsage === "period_norm";
      evidence.push({
        id: "",
        quote: ev.quote,
        explanation: ev.explanation,
        start: pos.start,
        end: pos.end,
        quoted,
        // Linguagem comum na época conta como sinal leve.
        ...(ev.strength ? { strength: periodNorm ? "weak" : ev.strength } : periodNorm ? { strength: "weak" as const } : {}),
        ...(ev.eraUsage && ev.eraUsage !== "none" ? { eraUsage: ev.eraUsage } : {}),
      });
    }
    if (evidence.length === 0) {
      // Sem evidência verificável, não há afirmação de viés.
      status = "none_found";
      score = 0;
      summary = quotedOnly > 0 && discarded === 0 ? NOTES.quotedOnly[lang] : NOTES.discarded[lang];
    }
  }

  evidence.sort((a, b) => a.start - b.start);
  const limited = evidence.slice(0, config.ai.maxEvidencePerCategory * 2);
  limited.forEach((e, i) => (e.id = `${categoryId}-${i + 1}`));

  return {
    id: categoryId,
    status,
    score: Math.round(score * 10) / 10,
    confidence: raw.confidence,
    summary,
    evidence: limited,
    discarded,
  };
}

/** Junta os resultados de uma categoria vindos de várias partes do texto. */
function mergeCategory(parts: CategoryResult[]): CategoryResult {
  if (parts.length === 1) return parts[0];
  const found = parts.filter((p) => p.status === "found");
  const discarded = parts.reduce((s, p) => s + p.discarded, 0);
  if (found.length > 0) {
    const best = found.reduce((a, b) => (b.score > a.score ? b : a));
    const evidence = found
      .flatMap((p) => p.evidence)
      .sort((a, b) => a.start - b.start)
      .slice(0, config.ai.maxEvidencePerCategory * 2);
    evidence.forEach((e, i) => (e.id = `${best.id}-${i + 1}`));
    return { ...best, evidence, discarded };
  }
  const none = parts.find((p) => p.status === "none_found");
  return { ...(none ?? parts[0]), discarded };
}

function verifyAxis(
  axis: OverviewOutput["economic"],
  matcher: QuoteMatcher,
  lang: Lang,
): AxisResult {
  if (axis.position === "unidentified" || axis.position === "not_applicable") {
    return { ...axis, quote: "", start: null, end: null };
  }
  const pos = matcher.find(axis.quote);
  if (!pos) {
    return {
      position: "unidentified" as AxisPosition,
      confidence: "low",
      justification: `${axis.justification} ${NOTES.axisDiscarded[lang]}`,
      quote: "",
      start: null,
      end: null,
    };
  }
  return { ...axis, start: pos.start, end: pos.end };
}

function mergeAxes(axes: AxisResult[]): AxisResult {
  const identified = axes.filter((a) => a.position === "left" || a.position === "right");
  if (identified.length === 0) return axes.find((a) => a.position === "unidentified") ?? axes[0];
  return identified.reduce((a, b) => (CONF_RANK[b.confidence] > CONF_RANK[a.confidence] ? b : a));
}

function verifyDispute(d: OverviewOutput["dispute"], matcher: QuoteMatcher, lang: Lang): DisputeResult {
  if (d.status !== "favors_a" && d.status !== "favors_b") {
    // Sem lado favorecido, não há ressalva a fazer.
    return { ...d, quote: "", caveat: "", start: null, end: null };
  }
  const pos = matcher.find(d.quote);
  if (!pos) {
    return {
      ...d,
      status: "unidentified",
      confidence: "low",
      justification: `${d.justification} ${NOTES.axisDiscarded[lang]}`,
      quote: "",
      start: null,
      end: null,
    };
  }
  return { ...d, start: pos.start, end: pos.end };
}

function mergeDisputes(ds: DisputeResult[]): DisputeResult {
  const decided = ds.filter((d) => d.status === "favors_a" || d.status === "favors_b");
  if (decided.length) return decided.reduce((a, b) => (CONF_RANK[b.confidence] > CONF_RANK[a.confidence] ? b : a));
  return ds.find((d) => d.status === "balanced") ?? ds.find((d) => d.status === "unidentified") ?? ds[0];
}

/** Palavras que indicam uma fonte (estudo, levantamento...): não podem surgir do nada. */
const SOURCE_NOUNS =
  /\b(levantamentos?|estudos?|pesquisas?|relat[óo]rios?|especialistas|dados oficiais|surveys?|stud(y|ies)|reports?|polls?|experts|research)\b/gi;

/** Marcas de atribuição ou de "sem fonte" numa frase da versão neutra. */
const REWRITE_ATTRIBUTION =
  /\b(segundo|de acordo com|conforme|afirma|afirmou|afirmam|diz|disse|dizem|estima|estimou|alega|alegou|sustenta|calcula|sem fonte|according to|says|said|claims?|claimed|estimates?|estimated|argues?|argued|no source|unsourced)\b/i;

/** Reescrita que virou comentário sobre o texto ("O texto informa que..."). */
const META_START = /^\s*(o|este|esse|a)\s+(texto|autor|autora|artigo|trecho|reportagem|matéria)\b|^\s*(the|this)\s+(text|author|article|passage|story)\b/i;

/**
 * Confere se a versão neutra é uma reescrita fiel, no estilo de notícia:
 *  - não pode virar comentário ("O texto informa que...");
 *  - não pode trazer números, nomes ou fontes (estudo, levantamento...) que
 *    não aparecem em nenhum lugar do texto original.
 * Devolve a descrição do problema, ou null se estiver tudo certo.
 */
/** Verbos e expressões que indicam que a frase relata a fala de alguém (não é a voz do autor). */
const ATTRIBUTION =
  /\b(disse|diz|dizem|disseram|afirm(?:ou|a|am|aram)|declar(?:ou|a|am|aram)|de acordo com|aleg(?:ou|a|am|aram)|acus(?:ou|a|am|aram)|critic(?:ou|aram)|defend(?:eu|eram)|ressalt(?:ou|aram)|destac(?:ou|aram)|avali(?:ou|aram)|argument(?:ou|a|aram)|garant(?:iu|iram)|neg(?:ou|aram)|admit(?:iu|iram)|explic(?:ou|aram)|coment(?:ou|aram)|apont(?:ou|aram)|sustent(?:ou|aram)|escreveu|questionou|rebateu|reagiu|classific(?:ou|aram)|said|says|stated|claimed|according to|argued|told|wrote|accused|denied)\b/i;
/** "segundo" só conta como atribuição antes de quem fala ("segundo o ministro"), não em "segundo turno". */
const ATTRIBUTION_SEGUNDO = /\b[Ss]egundo\s+(?:o|a|os|as|ele|ela|eles|elas|fontes?|[A-ZÁÉÍÓÚÂÊÔ])/;

/** A frase inteira em volta de um trecho (do ponto anterior ao próximo). */
function sentenceAround(text: string, start: number, end: number): string {
  const before = Math.max(text.lastIndexOf(".", start - 1), text.lastIndexOf("!", start - 1), text.lastIndexOf("?", start - 1), text.lastIndexOf("\n", start - 1));
  const after = [".", "!", "?", "\n"].map((c) => text.indexOf(c, end)).filter((i) => i !== -1);
  return text.slice(before + 1, after.length ? Math.min(...after) + 1 : text.length);
}

/**
 * Trechos que podem ganhar uma versão neutra: problema pelo menos moderado,
 * fora das aspas e numa frase que não relata a fala de alguém
 * ("disse", "afirmou", "segundo"...). Se não houver nenhum, não há reescrita.
 */
export function rewriteCandidates(findings: Findings, text: string): Set<string> {
  const ids = new Set<string>();
  for (const g of findings.groups) {
    for (const c of g.categories) {
      if (c.status !== "found" || c.score < NOT_MILD_MIN) continue;
      for (const e of c.evidence) {
        if (e.quoted || e.start < 0) continue; // fala citada ou evidência numa imagem
        const sentence = sentenceAround(text, e.start, e.end);
        if (ATTRIBUTION.test(sentence) || ATTRIBUTION_SEGUNDO.test(sentence)) continue;
        ids.add(e.id);
      }
    }
  }
  return ids;
}

/** Palavras de cada faixa da escala (SCORING.labels), da mais específica para a mais geral. */
const LEVEL_PATTERNS: [string, RegExp][] = [
  ["muito forte", /\b(muito fortes?|muito enviesad[oa]|very strong|very biased|heavily biased)\b/i],
  ["acentuado", /\b(acentuad[oa]|claramente|marked|clearly)\b/i],
  ["forte", /\b(fortes?|fortemente|strong|strongly)\b/i],
  ["moderado", /\b(moderad[oa]|moderadamente|moderate|moderately)\b/i],
  ["leve", /\b(leve|levemente|mild|mildly|slight|slightly)\b/i],
];
/** Gradações fora da escala do site. */
const OFF_SCALE = /\b(grave|extremamente enviesad[oa]|extreme bias|extremely biased|severe bias|severely biased)\b/i;
/** Nomes de campos e valores internos que nunca podem aparecer no resumo. */
const INTERNAL_TERMS =
  /\b(favors_[ab]|not_applicable|none_found|side[AB]|intensidadeGeral|notaGeral|citacaoDeTerceiro|podeReescrever|percentualFatos|[a-z]+_[a-z]+(?:_[a-z]+)*)\b|classifica[çc][ãa]o do (site|sistema)|(site|system)'s classification|classification (of|by) the (site|system)/i;

/**
 * Confere o resumo: (1) nada de nomes de campos ou valores internos; (2) usa a
 * escala do site e a mesma faixa da nota geral quando qualifica o texto inteiro
 * ("viés acentuado", "clearly biased", "strong bias").
 */
export function summaryProblem(findings: Findings, synthesis: SynthesisOutput): string | null {
  const expected = scoreLabel(findings.overall.score).short.pt;
  for (const summary of [synthesis.summary, synthesis.summarySimple]) {
    const internal = summary.match(INTERNAL_TERMS);
    if (internal) return `usou o termo interno "${internal[0]}"; escreva só em linguagem normal, sem nomes de campos, valores internos ou menções à "classificação do site"`;
    const off = summary.match(OFF_SCALE);
    if (off) return `usou a gradação "${off[0]}", que não existe no site; use só a escala leve, moderado, acentuado, forte ou muito forte`;
    // Só as expressões que qualificam o texto inteiro: "viés X", "X bias", "X enviesado/biased".
    const phrases = summary.matchAll(
      /\b(?:viés|bias)\s+((?:\p{L}+\s+)?\p{L}+)|\b((?:\p{L}+\s+)?\p{L}+)\s+(?:viés|bias|enviesad[oa]|biased)\b/giu,
    );
    for (const m of phrases) {
      const level = LEVEL_PATTERNS.find(([, re]) => re.test(m[1] ?? m[2]))?.[0];
      if (level && level !== expected) return `chamou o viés do texto de "${level}", mas a nota geral corresponde a "${expected}"`;
    }
  }
  return null;
}

export function rewriteProblem(findings: Findings, synthesis: SynthesisOutput, text: string): string | null {
  const rw = synthesis.rewrite;
  if (!rw.evidenceId || !rw.rewritten.trim()) return null;
  const rewritten = rw.rewritten.trim();
  const chosen = findings.groups.flatMap((g) => g.categories).flatMap((c) => c.evidence).find((e) => e.id === rw.evidenceId);
  if (chosen?.quoted) return "escolheu uma fala citada entre aspas, que é de outra pessoa e não do autor; escolha um trecho escrito pelo próprio jornalista";
  if (!rewriteCandidates(findings, text).has(rw.evidenceId))
    return "escolheu um trecho que não está marcado com \"podeReescrever\" (fala atribuída a alguém ou problema leve); escolha só entre os marcados, ou deixe a reescrita vazia";
  if (META_START.test(rewritten)) return "virou um comentário sobre o texto em vez de uma reescrita no estilo de notícia";

  const lowerText = text.toLowerCase();
  const newNumbers = (rewritten.match(/\d+([.,]\d+)?/g) ?? []).filter((n) => !text.includes(n));
  if (newNumbers.length) return `acrescentou números que não estão no texto original (${newNumbers.join(", ")})`;

  // Número que a análise marcou como "sem fonte": só pode aparecer atribuído ("segundo o autor") ou com "sem fonte indicada".
  const unsourced = new Set(
    findings.groups
      .flatMap((g) => g.categories)
      .filter((c) => c.id === "unsourced_data" && c.score > 0)
      .flatMap((c) => c.evidence)
      .flatMap((e) => e.quote.match(/\d+([.,]\d+)?/g) ?? []),
  );
  if (unsourced.size) {
    const sentences = rewritten.split(/(?<=[.!?])\s+/);
    const asFact = sentences.flatMap((sent) =>
      (sent.match(/\d+([.,]\d+)?/g) ?? []).filter((n) => unsourced.has(n) && !REWRITE_ATTRIBUTION.test(sent)),
    );
    if (asFact.length)
      return `repetiu como fato um número que a análise marcou como sem fonte (${[...new Set(asFact)].join(", ")}); atribua a quem afirma ("segundo o autor") ou acrescente "(sem fonte indicada)"`;
  }

  const newSources = [...new Set((rewritten.match(SOURCE_NOUNS) ?? []).map((t) => t.toLowerCase()))].filter(
    (t) => !lowerText.includes(t),
  );
  if (newSources.length) return `citou fontes que não estão no texto original (${newSources.join(", ")})`;

  // Nomes próprios (palavras com maiúscula fora do início da frase) que não existem no texto.
  const newNames = [...rewritten.matchAll(/(?<![.!?:]\s|^)\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\p{L}-]{2,})/gu)]
    .map((m) => m[1])
    .filter((name) => !text.includes(name));
  if (newNames.length) return `citou nomes que não estão no texto original (${[...new Set(newNames)].join(", ")})`;
  return null;
}

/**
 * Monta as conclusões a partir das respostas da IA: confere citações,
 * junta partes e calcula notas. A síntese (resumo) vem depois.
 */
/** O que a etapa "Imagens e gráficos" devolveu (null = não havia imagens). */
export interface VisualFindingsInput {
  inputs: VisualInput[];
  /** null = a etapa falhou. */
  output: VisualOutput | null;
}

/**
 * Categorias "só de imagem": montadas a partir da etapa "Imagens e gráficos".
 * Cada problema vira uma evidência ligada à figura; se a IA citou um trecho do
 * texto que a figura contradiz, ele também é destacado (depois de conferido).
 */
function visualCategory(
  categoryId: string,
  visual: VisualFindingsInput | null,
  matcher: QuoteMatcher,
  lang: Lang,
): CategoryResult {
  const empty = (summary: string, status: CategoryResult["status"]): CategoryResult => ({
    id: categoryId,
    status,
    score: 0,
    confidence: "medium",
    summary,
    evidence: [],
    discarded: 0,
  });
  if (!visual || visual.inputs.length === 0) return empty(NOTES.noVisuals[lang], "not_applicable");
  if (!visual.output) return empty(NOTES.visualFailed[lang], "not_applicable");
  const labels = new Map(visual.inputs.map((v) => [v.id, v.label]));
  const found = visual.output.findings.filter((f) => f.categoryId === categoryId && labels.has(f.figureId));
  if (found.length === 0) return empty(NOTES.visualOk[lang], "none_found");

  const evidence: Evidence[] = [];
  for (const f of found.slice(0, config.ai.maxEvidencePerCategory * 2)) {
    evidence.push({ id: "", quote: labels.get(f.figureId)!, explanation: f.explanation, start: -1, end: -1, figureId: f.figureId });
    const pos = f.textQuote.trim() ? matcher.find(f.textQuote) : null;
    if (pos) evidence.push({ id: "", quote: f.textQuote, explanation: `${labels.get(f.figureId)}: ${f.explanation}`, start: pos.start, end: pos.end });
  }
  evidence.forEach((e, i) => (e.id = `${categoryId}-${i + 1}`));
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return {
    id: categoryId,
    status: "found",
    score: Math.round(Math.max(...found.map((f) => clamp(f.score, 0, 10))) * 10) / 10,
    confidence: found.reduce((best, f) => (rank[f.confidence] > rank[best] ? f.confidence : best), found[0].confidence),
    summary: found[0].explanation,
    evidence,
    discarded: 0,
  };
}

/**
 * Problemas das IMAGENS numa categoria comum (ex.: fotos de tumores → "Medo
 * e indignação"): entram como evidências ligadas à figura, e a nota da
 * categoria passa a ser a maior entre a do texto e a das imagens.
 */
function withImageFindings(cat: CategoryResult, visual: VisualFindingsInput | null, matcher: QuoteMatcher): CategoryResult {
  if (!visual?.output) return cat;
  const labels = new Map(visual.inputs.map((v) => [v.id, v.label]));
  const found = visual.output.findings.filter((f) => f.categoryId === cat.id && labels.has(f.figureId));
  if (found.length === 0) return cat;
  const extra: Evidence[] = [];
  for (const f of found.slice(0, config.ai.maxEvidencePerCategory)) {
    extra.push({ id: "", quote: labels.get(f.figureId)!, explanation: f.explanation, start: -1, end: -1, figureId: f.figureId });
    const pos = f.textQuote.trim() ? matcher.find(f.textQuote) : null;
    if (pos) extra.push({ id: "", quote: f.textQuote, explanation: `${labels.get(f.figureId)}: ${f.explanation}`, start: pos.start, end: pos.end });
  }
  const evidence = [...cat.evidence, ...extra].map((e, i) => ({ ...e, id: `${cat.id}-${i + 1}` }));
  const imageScore = Math.round(Math.max(...found.map((f) => clamp(f.score, 0, 10))) * 10) / 10;
  const textFound = cat.status === "found";
  return {
    ...cat,
    status: "found",
    score: Math.max(textFound ? cat.score : 0, imageScore),
    confidence: textFound ? cat.confidence : found[0].confidence,
    summary: textFound ? cat.summary : found[0].explanation,
    evidence,
  };
}

export function buildFindings(
  text: string,
  triage: TriageOutput,
  rawParts: RawPart[],
  lang: Lang,
  visual: VisualFindingsInput | null = null,
): Findings {
  const matcher = createQuoteMatcher(text);
  const groups: GroupResult[] = [];
  let discardedEvidence = 0;

  // Trava: sem nenhum número no texto, as categorias de dados não se aplicam.
  const hasNumbers = /\d/.test(text);
  const quotedRanges = findQuotedRanges(text);

  for (const group of activeGroups(triage)) {
    const categories: CategoryResult[] = group.categories.map((cat) => {
      if (cat.visualOnly) return visualCategory(cat.id, visual, matcher, lang);
      if (group.id === "data" && !hasNumbers) {
        return {
          id: cat.id,
          status: "not_applicable",
          score: 0,
          confidence: "high",
          summary: NOTES.noNumbers[lang],
          evidence: [],
          discarded: 0,
        } satisfies CategoryResult;
      }
      const perPart: CategoryResult[] = rawParts.map((part) => {
        const raw = part.specialists[group.id]?.categories.find((c) => c.categoryId === cat.id);
        if (!raw) {
          return {
            id: cat.id,
            status: "not_applicable",
            score: 0,
            confidence: "low",
            summary: NOTES.missing[lang],
            evidence: [],
            discarded: 0,
          } satisfies CategoryResult;
        }
        return verifyCategory(cat.id, raw, matcher, lang, quotedRanges);
      });
      return withImageFindings(mergeCategory(perPart), visual, matcher);
    });
    discardedEvidence += categories.reduce((s, c) => s + c.discarded, 0);
    groups.push({ id: group.id, score: scoreGroup(group.id, categories), categories });
  }

  const economic = mergeAxes(rawParts.map((p) => verifyAxis(p.overview.economic, matcher, lang)));
  const social = mergeAxes(rawParts.map((p) => verifyAxis(p.overview.social, matcher, lang)));

  const totalWords = rawParts.reduce((s, p) => s + p.words, 0) || 1;
  const factPercent = Math.round(
    rawParts.reduce((s, p) => s + clamp(p.overview.factOpinion.factPercent, 0, 100) * p.words, 0) / totalWords,
  );
  const factExplanation = rawParts[0].overview.factOpinion.explanation;

  const omissions: { title: string; explanation: string }[] = [];
  const seenTitles = new Set<string>();
  for (const p of rawParts) {
    for (const o of p.overview.omissions) {
      const key = o.title.trim().toLowerCase();
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      omissions.push(o);
    }
  }

  // Respostas do autor a críticas: confere o trecho e junta as partes (sem repetir a mesma crítica).
  const rebuttals: RebuttalResult[] = [];
  const seenCrit = new Set<string>();
  for (const p of rawParts) {
    for (const r of p.overview.rebuttals ?? []) {
      const key = r.criticism.trim().toLowerCase();
      if (!key || seenCrit.has(key)) continue;
      seenCrit.add(key);
      const pos = r.quote.trim() ? matcher.find(r.quote) : null;
      rebuttals.push({ ...r, quote: pos ? r.quote : "", start: pos?.start ?? null, end: pos?.end ?? null });
    }
  }

  return {
    groups,
    political: {
      economic,
      social,
      dispute: mergeDisputes(rawParts.map((p) => verifyDispute(p.overview.dispute, matcher, lang))),
    },
    factOpinion: { factPercent, explanation: factExplanation },
    omissions: omissions.slice(0, 6),
    rebuttals: rebuttals.slice(0, 4),
    overall: scoreOverall(groups, lang),
    discardedEvidence,
  };
}

/** Texto compacto com as conclusões, enviado à IA para a síntese. */
/**
 * Dados enviados para a síntese. Tudo em linguagem normal, no idioma do
 * relatório: nada de valores internos ("favors_b", "slight"), que acabavam
 * aparecendo no resumo.
 */
export function findingsForSynthesis(triage: TriageOutput, findings: Findings, text: string, lang: Lang): string {
  const t = getDict(lang);
  const candidates = rewriteCandidates(findings, text);
  const groups = findings.groups
    .filter((g) => g.score !== null)
    .map((g) => {
      const group = TAXONOMY.find((x) => x.id === g.id)!;
      return {
        grupo: group.name[lang],
        nota: g.score,
        categorias: g.categories
          .filter((c) => c.status === "found")
          .map((c) => ({
            categoria: group.categories.find((x) => x.id === c.id)?.name[lang] ?? c.id,
            nota: c.score,
            intensidade: scoreLabel(c.score).short[lang],
            resumo: c.summary,
            evidencias: c.evidence.map((e) => ({
              id: e.id,
              trecho: e.quote,
              ...(e.quoted ? { citacaoDeTerceiro: true } : {}),
              ...(candidates.has(e.id) ? { podeReescrever: true } : {}),
              // frase em volta do trecho, para a reescrita saber quem disse o quê
              ...(e.figureId
                ? { figura: e.quote }
                : { contexto: text.slice(Math.max(0, e.start - 220), Math.min(text.length, e.end + 220)) }),
              explicacao: e.explanation,
            })),
          })),
      };
    });

  const { economic, social, dispute } = findings.political;
  const axis = (a: AxisResult) => (a.position === "not_applicable" ? undefined : { posicao: t.labels.position[a.position], justificativa: a.justification });
  const disputeText =
    dispute.status === "favors_a" || dispute.status === "favors_b"
      ? t.result.simple.favors(dispute.status === "favors_a" ? dispute.sideA : dispute.sideB, t.result.simple.strength[dispute.strength ?? "slight"])
      : dispute.status === "balanced"
        ? t.result.simple.balanced
        : dispute.status === "unidentified"
          ? t.result.axes.dispute.unidentified
          : undefined;

  return JSON.stringify(
    {
      texto: {
        tipo: t.labels.contentType[triage.contentType],
        // Motivo do tipo, dado na identificação: o resumo não pode descrever o gênero de outro jeito.
        motivoDoTipo: triage.contentTypeReason || undefined,
        pais: triage.country,
        epoca: triage.era || (lang === "pt" ? "não identificada" : "unidentified"),
        ...(triage.historical ? { textoHistorico: true, contextoDaEpoca: triage.politicalContext } : {}),
        tema: triage.topic,
        resumo: triage.contentSummary,
      },
      notaGeral: findings.overall.score,
      intensidadeGeral: scoreLabel(findings.overall.score).short[lang],
      inclinacao: {
        economica: axis(economic),
        social: axis(social),
        ...(disputeText
          ? { disputa: { situacao: disputeText, justificativa: dispute.justification, ...(dispute.caveat ? { ressalva: dispute.caveat } : {}) } }
          : {}),
      },
      percentualFatos: findings.factOpinion.factPercent,
      omissoes: findings.omissions,
      ...(findings.rebuttals.length
        ? {
            respostasDoAutorACriticas: findings.rebuttals.map((r) => ({
              critica: r.criticism,
              respostaDoAutor: r.authorResponse,
              avaliacao: t.result.rebuttals.verdict[r.verdict],
              ateOndeProcede: r.assessment,
            })),
          }
        : {}),
      grupos: groups,
    },
    null,
    1,
  ).replace(/</g, "\\u003c"); // impede que trechos do documento imitem marcações
}

/** Lista das figuras para a tela: o que a IA descreveu + miniatura e legenda. */
function figuresResult(visual: VisualFindingsInput | null): FigureResult[] | undefined {
  if (!visual || visual.inputs.length === 0) return undefined;
  return visual.inputs.map((v) => {
    const f = visual.output?.figures.find((x) => x.figureId === v.id);
    return {
      id: v.id,
      label: v.label,
      kind: f?.kind ?? "other",
      description: f?.description ?? "",
      relevant: f?.relevant ?? true,
      thumb: v.thumb,
      caption: v.caption,
    };
  });
}

/** Junta tudo no resultado final. */
export function finalizeResult(params: {
  id: string;
  text: string;
  source: SourceInfo;
  wordCount: number;
  lang: Lang;
  promptVersion: string;
  demo: boolean;
  triage: TriageOutput;
  findings: Findings;
  synthesis: SynthesisOutput | null;
  /** true = a versão neutra foi descartada por inventar algo (não mostra "nenhum trecho precisa"). */
  rewriteDiscarded?: boolean;
  /** Imagens analisadas (etapa "Imagens e gráficos"). */
  visual?: VisualFindingsInput | null;
  claimCheck?: ClaimCheckOutput | null;
  balance?: AnalysisResult["balance"];
  stats: Omit<AnalysisResult["stats"], "discardedEvidence">;
}): AnalysisResult {
  const { triage, findings, synthesis, text } = params;

  let rewrite: AnalysisResult["rewrite"] = null;
  if (synthesis?.rewrite.evidenceId && !rewriteProblem(findings, synthesis, text)) {
    const ev = findings.groups
      .flatMap((g) => g.categories)
      .flatMap((c) => c.evidence)
      .find((e) => e.id === synthesis.rewrite.evidenceId);
    if (ev && synthesis.rewrite.rewritten.trim()) {
      rewrite = {
        evidenceId: ev.id,
        original: text.slice(ev.start, ev.end),
        rewritten: synthesis.rewrite.rewritten,
        explanation: synthesis.rewrite.explanation,
        start: ev.start,
        end: ev.end,
      };
    }
  }

  // Dados da fonte: o que veio da página/PDF tem prioridade; a IA completa o que faltar.
  const source = {
    ...params.source,
    title: params.source.title || triage.title || undefined,
    author: params.source.author || triage.author || undefined,
    outlet: params.source.outlet || triage.outlet || undefined,
    publishedAt: params.source.publishedAt || triage.publishedAt || undefined,
    wordCount: params.wordCount,
  };

  return {
    schemaVersion: 1,
    id: params.id,
    createdAt: new Date().toISOString(),
    language: params.lang,
    promptVersion: params.promptVersion,
    demo: params.demo,
    source,
    context: {
      contentType: triage.contentType,
      contentTypeReason: triage.contentTypeReason,
      contentTypeSource: params.source.declaredType ? "user" : "ai",
      country: triage.country,
      countryCode: triage.countryCode,
      politicalContext: triage.politicalContext,
      topic: triage.topic,
      contentSummary: triage.contentSummary,
      documentLanguage: triage.documentLanguage,
      era: triage.era,
      eraYear: triage.eraYear,
      eraSource: triage.eraSource,
      historical: triage.historical,
    },
    text,
    overall: findings.overall,
    political: findings.political,
    factOpinion: findings.factOpinion,
    summary: synthesis?.summary || triage.contentSummary,
    summarySimple: synthesis?.summarySimple || triage.contentSummary,
    omissions: findings.omissions,
    rebuttals: findings.rebuttals,
    rewrite,
    figures: figuresResult(params.visual ?? null),
    // Sem trecho elegível, ou a IA não viu nenhum que valesse reescrever (com a síntese funcionando).
    rewriteNone: !rewrite && !!synthesis && !params.rewriteDiscarded && (rewriteCandidates(findings, text).size === 0 || !synthesis.rewrite.evidenceId),
    groups: findings.groups,
    claimCheck: params.claimCheck ?? null,
    balance: params.balance ?? { status: "disabled", data: null },
    stats: { ...params.stats, discardedEvidence: findings.discardedEvidence },
  };
}
