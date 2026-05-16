
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Usuário',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Transactions
create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita','despesa')),
  valor numeric(12,2) not null,
  descricao text not null,
  categoria text not null,
  data timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.transacoes enable row level security;
create policy "own tx all" on public.transacoes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.transacoes (user_id, data desc);

-- Investments
create table public.investimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  nome text,
  quantidade numeric(12,4) not null,
  preco_medio numeric(12,4) not null,
  data_compra date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.investimentos enable row level security;
create policy "own inv all" on public.investimentos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Goals
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  valor_alvo numeric(12,2) not null,
  valor_atual numeric(12,2) not null default 0,
  data_limite date,
  created_at timestamptz not null default now()
);
alter table public.metas enable row level security;
create policy "own metas all" on public.metas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
