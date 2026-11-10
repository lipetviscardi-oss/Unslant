/**
 * MONTAGEM DO RESULTADO
 *
 * Junta as respostas da IA (de uma ou várias partes do texto), confere as
 * citações, calcula as notas e monta o resultado final. Também é usado pelo
 * exemplo de demonstração, para que ele passe pelas mesmas regras.
 */

import { config } from "@/lib/config";
import { SCORING, TAXONOMY, type BiasGroup, type ContentKind, type Lang } from "@/lib/taxonomy";
import { createQuoteMatcher, type QuoteMatcher } from "./verify";
import { clamp, scoreGroup, scoreOverall } from "./scoring";
import type {
  AxisPosition,
  ClaimCheckOutput,
  Confidence,
  OverviewOutput,
  SpecialistOutput,
  SynthesisOutput,
  TriageOutput,
} from "./schemas";
import type { AnalysisResult, AxisResult, CategoryResult, DisputeResult, Evidence, GroupResult, SourceInfo } from "./types";

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
  overall: { score: number; label: string; simpleLabel: string };
  discardedEvidence: number;
}

const CONF_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

const NOTES = {
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
      evidence.push({ id: "", quote: ev.quote, explanation: ev.explanation, start: pos.start, end: pos.end, quoted });
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
    return { ...d, quote: "", start: null, end: null };
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
      if (c.status !== "found" || c.score < SCORING.intensity.moderate) continue;
      for (const e of c.evidence) {
        if (e.quoted) continue;
        const sentence = sentenceAround(text, e.start, e.end);
        if (ATTRIBUTION.test(sentence) || ATTRIBUTION_SEGUNDO.test(sentence)) continue;
        ids.add(e.id);
      }
    }
  }
  return ids;
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
export function buildFindings(
  text: string,
  triage: TriageOutput,
  rawParts: RawPart[],
  lang: Lang,
): Findings {
  const matcher = createQuoteMatcher(text);
  const groups: GroupResult[] = [];
  let discardedEvidence = 0;

  // Trava: sem nenhum número no texto, as categorias de dados não se aplicam.
  const hasNumbers = /\d/.test(text);
  const quotedRanges = findQuotedRanges(text);

  for (const group of activeGroups(triage)) {
    const categories: CategoryResult[] = group.categories.map((cat) => {
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
      return mergeCategory(perPart);
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

  return {
    groups,
    political: {
      economic,
      social,
      dispute: mergeDisputes(rawParts.map((p) => verifyDispute(p.overview.dispute, matcher, lang))),
    },
    factOpinion: { factPercent, explanation: factExplanation },
    omissions: omissions.slice(0, 6),
    overall: scoreOverall(groups, lang),
    discardedEvidence,
  };
}

/** Texto compacto com as conclusões, enviado à IA para a síntese. */
export function findingsForSynthesis(triage: TriageOutput, findings: Findings, text: string): string {
  const candidates = rewriteCandidates(findings, text);
  const groups = findings.groups
    .filter((g) => g.score !== null)
    .map((g) => {
      const group = TAXONOMY.find((t) => t.id === g.id)!;
      return {
        grupo: group.name.pt,
        nota: g.score,
        categorias: g.categories
          .filter((c) => c.status === "found")
          .map((c) => ({
            categoria: group.categories.find((x) => x.id === c.id)?.name.pt ?? c.id,
            nota: c.score,
            resumo: c.summary,
            evidencias: c.evidence.map((e) => ({
              id: e.id,
              trecho: e.quote,
              ...(e.quoted ? { citacaoDeTerceiro: true } : {}),
              ...(candidates.has(e.id) ? { podeReescrever: true } : {}),
              // frase em volta do trecho, para a reescrita saber quem disse o quê
              contexto: text.slice(Math.max(0, e.start - 220), Math.min(text.length, e.end + 220)),
              explicacao: e.explanation,
            })),
          })),
      };
    });

  return JSON.stringify(
    {
      texto: {
        tipo: triage.contentType,
        pais: triage.country,
        tema: triage.topic,
        resumo: triage.contentSummary,
      },
      notaGeral: findings.overall.score,
      inclinacao: {
        economica: { posicao: findings.political.economic.position, justificativa: findings.political.economic.justification },
        social: { posicao: findings.political.social.position, justificativa: findings.political.social.justification },
        disputa: {
          situacao: findings.political.dispute.status,
          intensidade: findings.political.dispute.strength,
          ladoA: findings.political.dispute.sideA,
          ladoB: findings.political.dispute.sideB,
          justificativa: findings.political.dispute.justification,
        },
      },
      percentualFatos: findings.factOpinion.factPercent,
      omissoes: findings.omissions,
      grupos: groups,
    },
    null,
    1,
  ).replace(/</g, "\\u003c"); // impede que trechos do documento imitem marcações
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
    },
    text,
    overall: findings.overall,
    political: findings.political,
    factOpinion: findings.factOpinion,
    summary: synthesis?.summary || triage.contentSummary,
    summarySimple: synthesis?.summarySimple || triage.contentSummary,
    omissions: findings.omissions,
    rewrite,
    // Sem trecho elegível, ou a IA não viu nenhum que valesse reescrever (com a síntese funcionando).
    rewriteNone: !rewrite && !!synthesis && (rewriteCandidates(findings, text).size === 0 || !synthesis.rewrite.evidenceId),
    groups: findings.groups,
    claimCheck: params.claimCheck ?? null,
    balance: params.balance ?? { status: "disabled", data: null },
    stats: { ...params.stats, discardedEvidence: findings.discardedEvidence },
  };
}
