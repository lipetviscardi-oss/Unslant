/**
 * Textos dos limites por dia, gerados a partir de lib/config.ts
 * (config.limits.perDay): mude os números lá e todas as frases mudam juntas.
 */

import { config } from "@/lib/config";

const FREE = config.limits.perDay.free;
const DAYS = FREE.windowDays;
const TEST = FREE.testPhase === true;

/** "por dia" / "por semana" / "a cada N dias" / "na fase de testes". */
const PER = {
  pt: TEST ? "na fase de testes" : !DAYS ? "por dia" : DAYS === 7 ? "por semana" : `a cada ${DAYS} dias`,
  en: TEST ? "during the testing phase" : !DAYS ? "per day" : DAYS === 7 ? "per week" : `every ${DAYS} days`,
};

/** Período em que o limite vale: "hoje" / "nesta semana" / "nesta fase de testes". */
export const PERIOD = {
  pt: TEST ? "nesta fase de testes" : !DAYS ? "hoje" : DAYS === 7 ? "nesta semana" : `nos últimos ${DAYS} dias`,
  en: TEST ? "in this testing phase" : !DAYS ? "today" : DAYS === 7 ? "this week" : `in the last ${DAYS} days`,
};

/** Quando um uso volta: "amanhã" / "7 dias depois de usada" / fase de testes: não volta. */
export const COMES_BACK = {
  pt: TEST
    ? "Se quiser fazer mais, fale com quem te convidou."
    : !DAYS
      ? "Amanhã (à meia-noite no seu horário) elas voltam."
      : `Cada uma volta ${DAYS} dias depois de usada.`,
  en: TEST
    ? "If you'd like to run more, ask the person who invited you."
    : !DAYS
      ? "They come back tomorrow (at midnight your time)."
      : `Each one comes back ${DAYS} days after it was used.`,
};

/** O que a conta grátis dá, ex.: "4 análises por semana (simples ou detalhadas)". */
export const FREE_PLAN = {
  pt:
    FREE.total != null
      ? `${FREE.total} ${FREE.total === 1 ? "análise" : "análises"} ${PER.pt} (simples ou detalhadas)`
      : `${FREE.simple} ${FREE.simple === 1 ? "análise simples" : "análises simples"} e ${FREE.detailed} ${FREE.detailed === 1 ? "detalhada" : "detalhadas"} ${PER.pt}`,
  en:
    FREE.total != null
      ? `${FREE.total} ${FREE.total === 1 ? "analysis" : "analyses"} ${PER.en} (simple or detailed)`
      : `${FREE.simple} simple ${FREE.simple === 1 ? "analysis" : "analyses"} and ${FREE.detailed} detailed ${PER.en}`,
};

/** Limite somando os dois tipos (fase de testes), ou null. */
export const FREE_TOTAL = FREE.total ?? null;
