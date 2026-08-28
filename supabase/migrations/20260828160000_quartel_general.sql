-- ============================================================
-- QUARTEL GENERAL DA OFERTA — 2026-08-28
--
-- O Hub deixa de tentar ser fonte de número (isso é do tracker) e passa a ser
-- onde a operação de cada oferta mora: acessos, links e copy/prompts.
--
-- Idempotente.
-- ============================================================

-- ── Cofre de acessos ────────────────────────────────────────────────────────
-- 🔴 O SEGREDO CHEGA AQUI JÁ CIFRADO, pelo navegador (frontend/src/lib/cofre.js).
-- Este banco tem RLS liberado pra chave anônima, e essa chave vai no bundle:
-- guardar senha em texto puro seria publicar a operação junto com o app.
-- `identificador` (o login/e-mail) fica em claro de propósito — é o que permite
-- achar o acesso sem precisar abrir o cofre.
create table if not exists offer_secrets (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid        not null references projects(id) on delete cascade,
  titulo        text        not null,
  tipo          text        not null default 'outro',   -- conta_ads|pixel|gateway|dominio|email|banco|outro
  identificador text,                                   -- login/e-mail, EM CLARO
  segredo       text        not null,                   -- base64, cifrado no navegador
  salt          text        not null,
  iv            text        not null,
  obs           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Canário por oferta: prova que a senha-mestra digitada é a mesma de antes,
-- sem que a senha exista em lugar nenhum.
create table if not exists offer_vault_check (
  project_id uuid primary key references projects(id) on delete cascade,
  segredo    text not null,
  salt       text not null,
  iv         text not null,
  created_at timestamptz not null default now()
);

-- ── Copy e prompts ──────────────────────────────────────────────────────────
create table if not exists offer_notes (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid        not null references projects(id) on delete cascade,
  tipo        text        not null default 'copy',  -- headline|vsl|checkout|prompt|copy|outro
  titulo      text        not null,
  conteudo    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- `offer_links` já existe desde 13/06 (tipo, url) e continua sendo a casa dos
-- links; só ganha rótulo e ordem pra virar lista de verdade na tela.
alter table offer_links
  add column if not exists titulo text,
  add column if not exists ordem  integer not null default 0;

do $$ declare t text;
begin
  foreach t in array array['offer_secrets','offer_vault_check','offer_notes'] loop
    execute format('alter table %1$s enable row level security', t);
    execute format('drop policy if exists "team_anon_%1$s" on %1$s', t);
    execute format(
      'create policy "team_anon_%1$s" on %1$s
       for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

drop trigger if exists trg_offer_secrets_updated_at on offer_secrets;
create trigger trg_offer_secrets_updated_at
  before update on offer_secrets
  for each row execute procedure set_updated_at();

drop trigger if exists trg_offer_notes_updated_at on offer_notes;
create trigger trg_offer_notes_updated_at
  before update on offer_notes
  for each row execute procedure set_updated_at();

create index if not exists idx_offer_secrets_projeto on offer_secrets (project_id);
create index if not exists idx_offer_notes_projeto   on offer_notes (project_id);

notify pgrst, 'reload schema';
