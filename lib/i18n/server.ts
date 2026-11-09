/**
 * Dicionários para as páginas renderizadas no servidor.
 */

import type { Locale } from "./config";
import { pt, type Dict } from "./pt";
import { en } from "./en";

export function getDict(lang: Locale): Dict {
  return lang === "en" ? en : pt;
}
