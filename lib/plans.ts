/**
 * Textos dos limites por dia, gerados a partir de lib/config.ts
 * (config.limits.perDay): mude os números lá e todas as frases mudam juntas.
 */

import { config } from "@/lib/config";

const FREE = config.limits.perDay.free;

/** O que a conta grátis dá por dia, ex.: "5 análises por dia (simples ou detalhadas)". */
export const FREE_PLAN = {
  pt:
    FREE.total != null
      ? `${FREE.total} ${FREE.total === 1 ? "análise" : "análises"} por dia (simples ou detalhadas)`
      : `${FREE.simple} ${FREE.simple === 1 ? "análise simples" : "análises simples"} e ${FREE.detailed} ${FREE.detailed === 1 ? "detalhada" : "detalhadas"} por dia`,
  en:
    FREE.total != null
      ? `${FREE.total} ${FREE.total === 1 ? "analysis" : "analyses"} per day (simple or detailed)`
      : `${FREE.simple} simple ${FREE.simple === 1 ? "analysis" : "analyses"} and ${FREE.detailed} detailed per day`,
};

/** Limite somando os dois tipos (fase de testes), ou null. */
export const FREE_TOTAL = FREE.total ?? null;
