/**
 * Tipo de análise escolhido pelo leitor: "simple" (o essencial) ou
 * "detailed" (tudo). As duas usam a mesma análise completa; muda o que é
 * mostrado. A última escolha fica guardada só neste navegador.
 */

export type ResultMode = "simple" | "detailed";

const KEY = "unslant-result-mode";
const listeners = new Set<() => void>();

export function readMode(): ResultMode {
  try {
    return window.localStorage.getItem(KEY) === "detailed" ? "detailed" : "simple";
  } catch {
    return "simple"; // navegador sem armazenamento
  }
}

export function saveMode(mode: ResultMode) {
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    /* sem armazenamento: só não lembra a escolha */
  }
  listeners.forEach((l) => l());
}

/** Para useSyncExternalStore: avisa quando a escolha muda. */
export function subscribeMode(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
