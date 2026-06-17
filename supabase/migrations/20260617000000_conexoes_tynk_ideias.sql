-- ============================================================
-- Project Hub — conexões/tynk/ideias por projeto + ideias gerais
-- ============================================================

-- ── Colunas jsonb em projects ───────────────────────────────
-- conexoes: credenciais/estado das integrações (Cakto, UTMfy)
-- tynk:     metadata da página clonada no Tynk Pages
-- ideias:   ideias de oferta do projeto (order bumps, upsells, pacotes)
alter table projects add column if not exists conexoes jsonb not null default '{}'::jsonb;
alter table projects add column if not exists tynk     jsonb;
alter table projects add column if not exists ideias   jsonb not null default '[]'::jsonb;

-- ============================================================
-- IDEAS  (banco de ideias para NOVOS projetos — não ligadas a um project)
-- ============================================================
create table if not exists ideas (
  id          uuid primary key default uuid_generate_v4(),
  title       text        not null,
  niche       text,
  description text,
  status      text        not null default 'ideia',  -- ideia|avaliando|aprovada|testando|descartada
  created_by  uuid        references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_ideas_updated_at on ideas;
create trigger trg_ideas_updated_at
  before update on ideas
  for each row execute procedure set_updated_at();

-- RLS: ferramenta de equipe (mesmo padrão das demais tabelas)
alter table ideas enable row level security;
drop policy if exists "team_all_ideas" on ideas;
create policy "team_all_ideas" on ideas
  for all to authenticated using (true) with check (true);

create index if not exists idx_ideas_status  on ideas(status);
create index if not exists idx_ideas_created on ideas(created_at desc);
