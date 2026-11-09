/**
 * LIMITE DIÁRIO DE ANÁLISES (proteção contra gastos inesperados)
 *
 * Conta quantas análises NOVAS (que chamam a IA) foram feitas hoje no site
 * inteiro. Ao atingir config.limits.globalDailyAnalyses, novas análises são
 * recusadas até o dia seguinte.
 *
 * Limitação conhecida: a contagem fica na memória do servidor e zera se ele
 * reiniciar. Na Fase 4 ela passa para o banco de dados, junto com o limite
 * de 3 análises por dia por usuário.
 */

import "server-only";
import { config } from "@/lib/config";
import { AppError } from "@/lib/errors";

let day = "";
let count = 0;

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Reserva uma análise do limite diário (lança erro se o limite acabou). */
export function reserveDailySlot() {
  const t = today();
  if (t !== day) {
    day = t;
    count = 0;
  }
  if (count >= config.limits.globalDailyAnalyses) {
    throw new AppError("DAILY_LIMIT", `${count}/${config.limits.globalDailyAnalyses}`);
  }
  count++;
}

/** Devolve a vaga se a análise falhou antes de gastar com a IA. */
export function releaseDailySlot() {
  if (count > 0) count--;
}
