/**
 * Configuração do Supabase (login e banco de dados).
 * As chaves ficam no arquivo .env.local (nunca no código nem no GitHub).
 * Sem elas, o site funciona normalmente, só que sem login e sem histórico.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
/** Chave "publishable": pode aparecer no navegador; quem protege os dados são as regras do banco. */
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
