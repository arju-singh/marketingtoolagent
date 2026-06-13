-- MarketStack schema. Run in Supabase → SQL Editor (once).
-- Two tables: per-user saved runs, and authoritative usage/entitlement.

-- ── runs: a saved generation ───────────────────────────────────────────────
create table if not exists public.runs (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  product_name  text,
  one_liner     text,
  created_at    bigint,
  context       jsonb,
  deliverables  jsonb
);
create index if not exists runs_user_created_idx on public.runs (user_id, created_at desc);

alter table public.runs enable row level security;
create policy "runs_select_own" on public.runs for select using (auth.uid() = user_id);
create policy "runs_insert_own" on public.runs for insert with check (auth.uid() = user_id);
create policy "runs_delete_own" on public.runs for delete using (auth.uid() = user_id);

-- ── usage: entitlement (server-written only) ───────────────────────────────
create table if not exists public.usage (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  runs         int not null default 0,
  plan         text,
  plan_active  boolean not null default false,
  plan_price   int,
  plan_at      bigint,
  updated_at   bigint
);

alter table public.usage enable row level security;
-- Clients may READ their own usage; all writes go through the service role
-- (which bypasses RLS), so a user can't grant themselves a plan or reset runs.
create policy "usage_select_own" on public.usage for select using (auth.uid() = user_id);

-- Atomic run counter, called by the service role after a successful generation.
create or replace function public.increment_runs(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usage (user_id, runs, updated_at)
  values (p_uid, 1, (extract(epoch from now()) * 1000)::bigint)
  on conflict (user_id)
  do update set runs = public.usage.runs + 1,
                updated_at = (extract(epoch from now()) * 1000)::bigint;
end;
$$;
