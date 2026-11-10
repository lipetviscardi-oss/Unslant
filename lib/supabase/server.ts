/**
 * Supabase no SERVIDOR (rotas da API), agindo COMO o usuário logado: lê a
 * sessão dos cookies e respeita as regras de acesso do banco (cada um só vê
 * o que é seu).
 */

import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

export async function supabaseServer(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          /* chamado fora de uma rota que pode gravar cookies: o proxy.ts renova a sessão */
        }
      },
    },
  });
}

/** Usuário logado (conferido com o Supabase), ou null. */
export async function currentUser() {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
