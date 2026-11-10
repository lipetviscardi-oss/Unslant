/**
 * TEXTOS DE OUTRAS ÉPOCAS (regras aplicadas depois da análise)
 *
 *  - Época não identificada: a parte política fica com confiança baixa
 *    (sem saber a época, não dá para ter certeza do contexto).
 *  - Eixos esquerda/direita que não fazem sentido para a época (ex.: século
 *    XIX): marcados como "não se aplica", com a explicação.
 *  - Disputa com lados anacrônicos (partidos ou pessoas posteriores à época
 *    do texto): marcada como "não identificada".
 */

import type { TriageOutput } from "./schemas";
import type { Findings } from "./assemble";
import type { AxisResult } from "./types";
import { anachronisms } from "@/lib/historico";
import type { Lang } from "@/lib/taxonomy";

const NOTES = {
  axesNA: {
    pt: "Esquerda e direita, como entendidas hoje, não se aplicam a esta época.",
    en: "Left and right, as understood today, do not apply to this period.",
  },
  noEra: {
    pt: "Época do texto não identificada: confiança reduzida.",
    en: "The text's period could not be identified: lower confidence.",
  },
  anachronic: {
    pt: "A disputa apontada envolvia lados posteriores à época do texto e foi descartada.",
    en: "The dispute found involved sides from after the text's period and was discarded.",
  },
};

export function applyEraRules(findings: Findings, triage: TriageOutput, text: string, lang: Lang): Findings {
  if (triage.contentType === "claim") return findings;
  let { economic, social, dispute } = findings.political;

  if (!triage.axesApplicable) {
    const na = (a: AxisResult): AxisResult => ({
      ...a,
      position: "not_applicable",
      justification: triage.axesNote || NOTES.axesNA[lang],
      quote: "",
      start: null,
      end: null,
    });
    economic = na(economic);
    social = na(social);
  }

  if (triage.historical && dispute && (dispute.status === "favors_a" || dispute.status === "favors_b" || dispute.status === "balanced")) {
    const late = anachronisms(`${dispute.sideA} ${dispute.sideB} ${dispute.justification}`, text, triage.eraYear);
    if (late.length) {
      console.warn(`[unslant] disputa anacrônica (${late.join(", ")}): descartada`);
      dispute = { ...dispute, status: "unidentified", confidence: "low", justification: NOTES.anachronic[lang], quote: "", start: null, end: null, caveat: "" };
    }
  }

  if (!triage.era || triage.eraSource === "unknown") {
    const low = <T extends { confidence: string; justification: string }>(x: T): T =>
      x.confidence === "low" ? x : { ...x, confidence: "low", justification: `${x.justification} ${NOTES.noEra[lang]}`.trim() };
    economic = economic.position === "left" || economic.position === "right" ? low(economic) : economic;
    social = social.position === "left" || social.position === "right" ? low(social) : social;
    if (dispute && (dispute.status === "favors_a" || dispute.status === "favors_b")) dispute = low(dispute);
  }

  return { ...findings, political: { economic, social, dispute } };
}
