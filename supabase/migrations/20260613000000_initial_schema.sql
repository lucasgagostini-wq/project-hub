-- ============================================================
-- Project Hub — Initial Schema
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- (espelha auth.users com campos de UI — nome, cor, papel)
-- ============================================================
create table if not exists profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  name      text        not null,
  initial   char(2)     not null,
  color     text        not null default '#3B82F6',
  role      text        not null default 'Membro',
  created_at timestamptz not null default now()
);

-- Cria o profile automaticamente quando um usuário se cadastra
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, initial, color, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 1))
      || coalesce(upper(substr(split_part(coalesce(new.raw_user_meta_data->>'name', new.email), ' ', 2), 1, 1)), ''),
    coalesce(new.raw_user_meta_data->>'color', '#3B82F6'),
    coalesce(new.raw_user_meta_data->>'role', 'Membro')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists projects (
  id              uuid primary key default uuid_generate_v4(),
  name            text        not null,
  niche           text,
  vehicle         text,
  active          boolean     not null default true,
  escala          numeric     not null default 0,
  faturamento     numeric     not null default 0,
  lucro           numeric     not null default 0,
  gasto_ads       numeric     not null default 0,
  tempo_online    integer     not null default 0,  -- dias no ar
  estruturas      jsonb       not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- OFFERS  (1-1 com projects)
-- ============================================================
create table if not exists offers (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid        not null unique references projects(id) on delete cascade,
  description     text,
  publico         text,
  idade_range     text,
  preco           text,
  garantia        text,
  gateway         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- PERSONAS  (1-1 com projects)
-- ============================================================
create table if not exists personas (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    not null unique references projects(id) on delete cascade,
  name        text,
  pain        text,
  desire      text,
  objection   text,
  channel     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- OFFER_LINKS  (1-N com projects)
-- ============================================================
create table if not exists offer_links (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    not null references projects(id) on delete cascade,
  tipo        text    not null,
  url         text    not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- CREATIVES
-- ============================================================
create table if not exists creatives (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    not null references projects(id) on delete cascade,
  nome        text    not null,
  vendas      integer not null default 0,
  gasto       numeric not null default 0,
  roas        numeric generated always as (
                case when gasto > 0 then (vendas * 10.0) / gasto else 0 end
              ) stored,
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- METRIC_SNAPSHOTS  (série temporal de faturamento)
-- ============================================================
create table if not exists metric_snapshots (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    not null references projects(id) on delete cascade,
  date        date    not null,
  revenue     numeric not null default 0,
  net_profit  numeric not null default 0,
  ad_spend    numeric not null default 0,
  source      text    not null default 'manual',  -- 'meta' | 'google' | 'manual'
  created_at  timestamptz not null default now(),
  unique(project_id, date, source)
);

-- ============================================================
-- TASKS
-- ============================================================
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    references projects(id) on delete cascade,
  title       text    not null,
  assignee_id uuid    references profiles(id) on delete set null,
  due_date    date,
  done        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- MEETINGS
-- ============================================================
create table if not exists meetings (
  id          uuid primary key default uuid_generate_v4(),
  title       text    not null,
  date        date    not null,
  hora        text    not null default '10:00',
  created_at  timestamptz not null default now()
);

create table if not exists meeting_participants (
  meeting_id  uuid    not null references meetings(id) on delete cascade,
  user_id     uuid    not null references profiles(id) on delete cascade,
  primary key (meeting_id, user_id)
);

-- ============================================================
-- AUDIT_LOG
-- ============================================================
create table if not exists audit_log (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    references projects(id) on delete set null,
  user_id     uuid    references profiles(id) on delete set null,
  action      text    not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT trigger (projects, offers, personas, tasks)
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_updated_at
  before update on projects
  for each row execute procedure set_updated_at();

create trigger trg_offers_updated_at
  before update on offers
  for each row execute procedure set_updated_at();

create trigger trg_personas_updated_at
  before update on personas
  for each row execute procedure set_updated_at();

create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute procedure set_updated_at();

-- ============================================================
-- RLS  (Row Level Security)
-- Ferramenta de equipe: qualquer usuário autenticado tem acesso total
-- ============================================================
alter table profiles           enable row level security;
alter table projects           enable row level security;
alter table offers             enable row level security;
alter table personas           enable row level security;
alter table offer_links        enable row level security;
alter table creatives          enable row level security;
alter table metric_snapshots   enable row level security;
alter table tasks              enable row level security;
alter table meetings           enable row level security;
alter table meeting_participants enable row level security;
alter table audit_log          enable row level security;

-- Macro: authenticated pode tudo
do $$ declare t text;
begin
  foreach t in array array[
    'profiles','projects','offers','personas','offer_links',
    'creatives','metric_snapshots','tasks','meetings',
    'meeting_participants','audit_log'
  ] loop
    execute format(
      'create policy "team_all_%1$s" on %1$s
       for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_projects_active       on projects(active);
create index if not exists idx_offers_project        on offers(project_id);
create index if not exists idx_personas_project      on personas(project_id);
create index if not exists idx_offer_links_project   on offer_links(project_id);
create index if not exists idx_creatives_project     on creatives(project_id);
create index if not exists idx_snapshots_project     on metric_snapshots(project_id, date desc);
create index if not exists idx_tasks_project         on tasks(project_id);
create index if not exists idx_tasks_assignee        on tasks(assignee_id);
create index if not exists idx_audit_project         on audit_log(project_id, created_at desc);
