/**
 * CONTRADIÇÕES INTERNAS DO RELATÓRIO
 *
 * Confere, no fim de cada análise, se o resumo combina com o resto do
 * relatório:
 *  a) o gênero que o resumo atribui ao texto (e "rotulado como opinião")
 *     bate com o tipo de texto identificado e com a justificativa;
 *  c) o lado e a intensidade que o resumo diz que o texto favorece batem
 *     com o eixo "Favorece qual lado da disputa";
 *  d) o resumo não diz "sem viés" ou "viés leve" quando as notas são altas.
 * (O item b — versão neutra repetindo como fato algo "sem fonte" — fica em
 * rewriteProblem, em assemble.ts.)
 *
 * Cada problema vem com a frase do resumo que causou a contradição, para a
 * análise poder refazer o resumo ou, em último caso, tirar a frase.
 * Também é usado pelo comando npm run checar-contradicoes.
 */

import { NOT_MILD_MIN } from "@/lib/taxonomy";
import { anachronisms } from "@/lib/historico";

export interface ContradictionInput {
  summary: string;
  summarySimple: string;
  contentType: string;
  contentTypeReason?: string;
  dispute?: { status: string; sideA: string; sideB: string; strength?: string } | null;
  overallScore: number;
  /** Categorias encontradas: nome e nota. */
  categories: { name: string; score: number }[];
  /** Textos históricos: ano da época e o texto do documento (para achar anacronismos). */
  era?: { year: number; label: string; documentText: string };
}

export interface Contradiction {
  kind: "anachronism" | "genre" | "label" | "dispute_side" | "dispute_strength" | "dispute_balance" | "no_bias" | "mild_vs_high";
  note: string;
  sentence: string;
}

/** Como o resumo pode chamar cada tipo de texto (pt e en). */
const GENRE_WORDS: Record<string, RegExp> = {
  news: /not[íi]cia|news (story|report|article)|news piece/i,
  feature: /reportagem|feature (story|article)|long-?form/i,
  analysis: /an[áa]lise|analysis|analytical piece/i,
  opinion: /artigo de opini[ãa]o|texto de opini[ãa]o|coluna|opinion (piece|article|column)|op-?ed|column/i,
  editorial: /editorial/i,
  academic_paper: /artigo (cient[íi]fico|acad[êe]mico)|paper|scientific (article|paper)|academic (article|paper)|estudo cient[íi]fico/i,
  press_release: /comunicado( de imprensa)?|press release|nota (oficial|à imprensa)/i,
  blog: /\bblog|post de blog|blog post/i,
  speech: /discurso|speech|address/i,
  official_document: /documento oficial|official document|decreto|ato institucional|lei\b/i,
  propaganda: /propaganda|panfleto|pamphlet/i,
  letter: /\bcarta\b|correspond[êe]ncia|letter|telegrama|telegram|cable/i,
  historical_newspaper: /jornal (hist[óo]rico|da [ée]poca)|historical newspaper/i,
};
/** Gêneros que podem ser chamados um pelo outro sem contradição. */
const COMPATIBLE: Record<string, string[]> = {
  opinion: ["editorial", "blog", "analysis"],
  editorial: ["opinion"],
  analysis: ["opinion", "feature"],
  feature: ["news", "analysis"],
  news: ["feature", "historical_newspaper"],
  blog: ["opinion"],
  historical_newspaper: ["news", "editorial", "opinion", "feature", "propaganda"],
  propaganda: ["speech", "letter", "official_document", "historical_newspaper", "opinion"],
  speech: ["propaganda"],
  official_document: ["propaganda", "letter"],
  letter: ["official_document", "propaganda"],
};
/** Frases em que o resumo classifica O PRÓPRIO texto ("É um artigo de opinião", "This news story"). */
const CLASSIFY_PREFIX =
  /(?:^|[.;:]\s+|(?:^|\s)(?:é|trata-se de|apresenta-se como|funciona como|is|reads as|presented as|works as)\s+)(?:(?:um|uma|a|an|the|este|esta|o|this)\s+)?$/i;

const sentencesOf = (s: string) => s.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);

function genreProblems(text: string, input: ContradictionInput): Contradiction[] {
  const out: Contradiction[] = [];
  for (const sentence of sentencesOf(text)) {
    for (const [genre, re] of Object.entries(GENRE_WORDS)) {
      const m = sentence.match(new RegExp(re.source, "gi"));
      if (!m) continue;
      for (const hit of m) {
        const idx = sentence.toLowerCase().indexOf(hit.toLowerCase());
        const before = sentence.slice(Math.max(0, idx - 40), idx);
        if (!CLASSIFY_PREFIX.test(before) && idx !== 0) continue;
        if (genre === input.contentType || COMPATIBLE[input.contentType]?.includes(genre)) continue;
        out.push({
          kind: "genre",
          note: `chama o texto de "${hit}", mas o tipo de texto identificado é outro (${input.contentType}); use o mesmo tipo da identificação`,
          sentence,
        });
      }
    }
  }
  // "Rotulado como opinião" × justificativa que diz que NÃO há rótulo (e vice-versa).
  const reason = input.contentTypeReason ?? "";
  const reasonNoLabel = /sem r[óo]tulo|n[ãa]o (est[áa] |é |foi )?(rotulad|sinalizad|identificad|marcad)|no label|not labell?ed|unlabell?ed|isn'?t labell?ed|without (a |any )?label/i.test(reason);
  const reasonLabel = !reasonNoLabel && /rotulad|sinalizad|se[çc][ãa]o (de )?opini|marcad[oa] como|labell?ed|opinion section|tagged as/i.test(reason);
  for (const sentence of sentencesOf(text)) {
    const saysLabel = /\b(rotulad[oa]|sinalizad[oa]|identificad[oa]) como (opini|editorial|an[áa]lise)|\blabell?ed (as )?(an? )?(opinion|editorial|analysis)/i.test(sentence);
    const saysNoLabel = /sem r[óo]tulo|sem (ser )?(identificad|sinalizad)[oa] como|not labell?ed|unlabell?ed|without (a |any )?label/i.test(sentence);
    if (saysLabel && reasonNoLabel) out.push({ kind: "label", note: "diz que o texto é rotulado como opinião, mas a justificativa do tipo de texto diz que ele NÃO tem rótulo", sentence });
    if (saysNoLabel && reasonLabel) out.push({ kind: "label", note: "diz que o texto não tem rótulo, mas a justificativa do tipo de texto diz que ele É rotulado", sentence });
  }
  return out;
}

/** O nome do lado aparece na frase? (o nome inteiro ou as palavras principais dele). */
function mentions(sentence: string, side: string): boolean {
  if (!side.trim()) return false;
  const s = sentence.toLowerCase();
  if (s.includes(side.toLowerCase())) return true;
  const words = side.toLowerCase().split(/[\s/×x-]+/).filter((w) => w.length > 3 && !["governo", "partido", "oposição", "government", "party"].includes(w));
  return words.length > 0 && words.every((w) => s.includes(w));
}
const FAVOR = /\b(favorec\w*|favor[áa]vel|defende\w*|pende\w*|alinh\w*|toma o lado|apoia\w*|favou?rs?|favou?ring|sides? with|leans? (toward|towards|to)|supports?|in favou?r of)\b/i;
const SLIGHT = /\b(levemente|ligeiramente|um pouco|sutilmente|discretamente|slightly|mildly|somewhat|subtly)\b/i;
const STRONG = /\b(fortemente|claramente|abertamente|explicitamente|declaradamente|strongly|clearly|openly|heavily|overtly)\b/i;
const BALANCED_DISPUTE = /(trata|apresenta|ouve) (os )?dois lados de forma (equilibrada|equivalente)|equilibrad[oa] entre (os )?(lados|campos)|n[ãa]o (favorece|toma partido|pende para) (nenhum|qualquer) lado|balanced (coverage|treatment) of both|does not (favou?r|take) (either )?side|even-?handed/i;

function disputeProblems(text: string, input: ContradictionInput): Contradiction[] {
  const d = input.dispute;
  if (!d || (!d.sideA && !d.sideB)) return [];
  const out: Contradiction[] = [];
  const favors = d.status === "favors_a" || d.status === "favors_b";
  const favored = d.status === "favors_a" ? d.sideA : d.sideB;
  const other = d.status === "favors_a" ? d.sideB : d.sideA;
  for (const sentence of sentencesOf(text)) {
    if (!FAVOR.test(sentence)) {
      if (favors && BALANCED_DISPUTE.test(sentence))
        out.push({ kind: "dispute_balance", note: `diz que o texto não favorece nenhum lado, mas a disputa marca que ele favorece ${favored}`, sentence });
      continue;
    }
    if (favors) {
      if (mentions(sentence, other) && !mentions(sentence, favored))
        out.push({ kind: "dispute_side", note: `diz que o texto favorece ${other}, mas a disputa marca que ele favorece ${favored}`, sentence });
      else if (mentions(sentence, favored)) {
        if (d.strength === "slight" && STRONG.test(sentence))
          out.push({ kind: "dispute_strength", note: `diz que o texto favorece ${favored} de forma forte/clara, mas a disputa marca inclinação leve`, sentence });
        if (d.strength === "strong" && SLIGHT.test(sentence))
          out.push({ kind: "dispute_strength", note: `diz que o texto favorece ${favored} levemente, mas a disputa marca inclinação forte`, sentence });
      }
    } else if (mentions(sentence, d.sideA) !== mentions(sentence, d.sideB)) {
      out.push({ kind: "dispute_side", note: `diz que o texto favorece um lado, mas a disputa não marca favorecimento (${d.status})`, sentence });
    }
  }
  return out;
}

const NO_BIAS = /\b(n[ãa]o (h[áa]|apresenta|tem|mostra|cont[ée]m) (sinais de |nenhum )?vi[ée]s|sem vi[ée]s|livre de vi[ée]s|totalmente (neutro|imparcial)|no (significant |notable |apparent )?bias|unbiased|free of bias|entirely neutral)\b/i;
const MILD = /\b(vi[ée]s leve|levemente enviesad[oa]|pouco enviesad[oa]|mild bias|slightly biased|minimal bias)\b/i;

function scoreProblems(text: string, input: ContradictionInput): Contradiction[] {
  const out: Contradiction[] = [];
  const top = [...input.categories].sort((a, b) => b.score - a.score)[0];
  for (const sentence of sentencesOf(text)) {
    if (/vers[ãa]o neutra|neutral (version|rewrite)/i.test(sentence)) continue;
    if (NO_BIAS.test(sentence) && input.overallScore >= NOT_MILD_MIN)
      out.push({ kind: "no_bias", note: `diz que o texto não tem viés, mas a nota geral é ${input.overallScore.toFixed(1)}`, sentence });
    if (MILD.test(sentence) && top && top.score >= 6)
      out.push({ kind: "mild_vs_high", note: `chama o viés de leve, mas a categoria "${top.name}" tem nota ${top.score.toFixed(1)}; diga que o viés geral é leve mas aponte esse problema forte`, sentence });
  }
  return out;
}

/** Texto histórico: o resumo não pode citar pessoas ou partidos posteriores à época. */
function eraProblems(text: string, input: ContradictionInput): Contradiction[] {
  if (!input.era) return [];
  const era = input.era;
  return sentencesOf(text).flatMap((sentence) => {
    const late = anachronisms(sentence, era.documentText, era.year);
    return late.length
      ? [{ kind: "anachronism" as const, note: `cita ${late.join(", ")}, que são posteriores à época do texto (${era.label}); analise só com o contexto daquela época`, sentence }]
      : [];
  });
}

/** Todas as contradições do resumo e do resumo simples (sem repetir a mesma frase e o mesmo tipo). */
export function findContradictions(input: ContradictionInput): Contradiction[] {
  const all = [input.summary, input.summarySimple].flatMap((t) => [
    ...eraProblems(t, input),
    ...genreProblems(t, input),
    ...disputeProblems(t, input),
    ...scoreProblems(t, input),
  ]);
  const seen = new Set<string>();
  return all.filter((c) => {
    const k = `${c.kind}|${c.sentence}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Último recurso: tira do resumo as frases contraditórias (se sobrar pelo menos uma frase). */
export function removeSentences(text: string, bad: string[]): string {
  const kept = sentencesOf(text).filter((s) => !bad.includes(s));
  return kept.length ? kept.join(" ") : text;
}
