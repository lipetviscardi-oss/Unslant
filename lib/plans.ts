/**
 * Textos dos limites por dia, gerados a partir de lib/config.ts
 * (config.limits.perDay): mude os números lá e todas as frases mudam juntas.
 */

import { config } from "@/lib/config";

const FREE = config.limits.perDay.free;
const DAYS = FREE.windowDays;

/** "por dia" / "por semana" / "a cada N dias". */
const PER = {
  pt: !DAYS ? "por dia" : DAYS === 7 ? "por semana" : `a cada ${DAYS} dias`,
  en: !DAYS ? "per day" : DAYS === 7 ? "per week" : `every ${DAYS} days`,
};

/** Período em que o limite vale: "hoje" / "nesta semana". */
export const PERIOD = {
  pt: !DAYS ? "hoje" : DAYS === 7 ? "nesta semana" : `nos últimos ${DAYS} dias`,
  en: !DAYS ? "today" : DAYS === 7 ? "this week" : `in the last ${DAYS} days`,
};

/** Quando um uso volta: "amanhã, à meia-noite no seu horário" / "7 dias depois de usada". */
export const COMES_BACK = {
  pt: !DAYS ? "Amanhã (à meia-noite no seu horário) elas voltam." : `Cada uma volta ${DAYS} dias depois de usada.`,
  en: !DAYS ? "They come back tomorrow (at midnight your time)." : `Each one comes back ${DAYS} days after it was used.`,
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
