-- =============================================================================
--  unslant — tabelas do banco de dados (Fase 4)
--
--  COMO USAR: no painel do Supabase, abra "SQL Editor", clique em "New query",
--  cole TODO este arquivo e clique em "Run". Pode rodar de novo sem problema:
--  ele não apaga nada que já exista.
--
--  REGRAS DE ACESSO (RLS): cada pessoa só consegue VER e APAGAR as próprias
--  análises. Gravar análises, contar o uso diário e guardar o cache só o
--  servidor do site faz (com a chave secreta), nunca o navegador.
-- =============================================================================

-- Análises de cada pessoa (o histórico "Minhas análises").
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Dia da análise no horário da própria pessoa (a contagem diária zera à meia-noite local).
  local_day date not null,
  -- Tipo escolhido no formulário: 'simple' ou 'detailed'.
  kind text not null check (kind in ('simple', 'detailed')),
  -- Numa análise simples, a pessoa usou a "detalhada do dia" para ver tudo?
  detailed_unlocked boolean not null default false,
  -- false = o resultado já estava guardado (reaproveitado) e não conta no limite.
  counted boolean not null default true,
  -- 'running' = ainda em andamento (análise em segundo plano); 'done'; 'error'.
  status text not null default 'done' check (status in ('running', 'done', 'error')),
  error_code text,
  title text,
  source_url text,
  content_type text,
  score numeric,
  language text,
  cache_key text,
  -- Resultado completo da análise (o mesmo que aparece na tela).
  result jsonb,
  -- Estado da análise em etapas (usado enquanto status = 'running').
  job jsonb
);
create index if not exists analyses_user_created on public.analyses (user_id, created_at desc);
create index if not exists analyses_user_day on public.analyses (user_id, local_day);

alter table public.analyses enable row level security;

drop policy if exists "ver as proprias analises" on public.analyses;
create policy "ver as proprias analises" on public.analyses
  for select using ((select auth.uid()) = user_id);

drop policy if exists "apagar as proprias analises" on public.analyses;
create policy "apagar as proprias analises" on public.analyses
  for delete using ((select auth.uid()) = user_id);
-- (sem política de inserir/alterar: só o servidor grava)

-- Uso diário: cada análise que conta no limite, e cada "detalhada do dia" usada.
-- Fica guardado mesmo se a pessoa apagar a análise, para o limite não ser burlado.
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  -- Visitante sem conta: código anônimo (resumo do IP + cookie), nunca o IP em si.
  anon_key text,
  local_day date not null,
  kind text not null check (kind in ('simple', 'detailed')),
  analysis_id uuid references public.analyses (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists usage_user_day on public.usage_events (user_id, local_day);
create index if not exists usage_anon_day on public.usage_events (anon_key, local_day);

alter table public.usage_events enable row level security;
-- (sem políticas: só o servidor lê e grava)

-- Resultados guardados, compartilhados: o mesmo texto, na mesma versão da
-- análise, sai na hora e sem custo (e não conta no limite).
create table if not exists public.results_cache (
  cache_key text primary key,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.results_cache enable row level security;
-- (sem políticas: só o servidor lê e grava)
