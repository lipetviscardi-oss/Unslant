/**
 * Supabase no NAVEGADOR: entrar, sair e saber quem está logado.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/** Devolve null se o Supabase não estiver configurado (site sem login). */
export function supabaseBrowser(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return client;
}
