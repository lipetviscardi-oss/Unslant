"use client";

/**
 * Idioma atual do site, disponível para qualquer componente da tela.
 *  - LangProvider: colocado no layout, recebe o idioma do endereço (/pt ou /en).
 *  - useLang(): devolve "pt" ou "en".
 *  - useDict(): devolve os textos do idioma atual (lib/i18n/pt.ts ou en.ts).
 */

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import { pt, type Dict } from "./pt";
import { en } from "./en";

export const DICTIONARIES: Record<Locale, Dict> = { pt, en };

const LangContext = createContext<Locale>("pt");

export function LangProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Locale {
  return useContext(LangContext);
}

export function useDict(): Dict {
  return DICTIONARIES[useContext(LangContext)];
}
