/**
 * Supabase com a chave SECRETA: acesso total ao banco, ignorando as regras de
 * acesso. Usado SÓ no servidor, para gravar análises, contar o uso diário e
 * guardar o cache. Nunca importe este arquivo em código do navegador.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

let admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient | null {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !secret) return null;
  admin ??= createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
