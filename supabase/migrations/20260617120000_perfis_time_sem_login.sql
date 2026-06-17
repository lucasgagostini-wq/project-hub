-- ============================================================
-- Project Hub — perfis sem login (time compartilhado) + delegação + RLS anônimo
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================

-- 1) profiles deixa de exigir auth.users (perfis fixos, sem cadastro/senha).
--    Remove dinamicamente a FK id -> auth.users (qualquer que seja o nome).
do $$ declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'f'
    and confrelid = 'auth.users'::regclass
  limit 1;
  if c is not null then execute format('alter table public.profiles drop constraint %I', c); end if;
end $$;

-- 2) quem DELEGOU a tarefa (assignee_id = quem recebe, já existe).
alter table tasks add column if not exists created_by uuid references profiles(id) on delete set null;

-- 3) os 3 perfis fixos (UUIDs estáveis, usados pelo frontend).
insert into profiles (id, name, initial, color, role) values
  ('11111111-1111-1111-1111-111111111111', 'Lucas', 'LU', '#3B82F6', 'Fundador'),
  ('22222222-2222-2222-2222-222222222222', 'Davi',  'DA', '#EF4444', 'Membro'),
  ('33333333-3333-3333-3333-333333333333', 'Folha', 'FO', '#10B981', 'Mídia')
on conflict (id) do update
  set name = excluded.name, initial = excluded.initial,
      color = excluded.color, role = excluded.role;

-- 4) RLS: liberar acesso ANÔNIMO (o frontend usa a anon key, sem login).
--    Recria a policy de cada tabela do time para 'anon' + 'authenticated'.
do $$ declare t text;
begin
  foreach t in array array[
    'profiles','projects','offers','personas','offer_links',
    'creatives','metric_snapshots','tasks','meetings',
    'meeting_participants','audit_log','ideas'
  ] loop
    execute format('alter table %1$s enable row level security', t);
    execute format('drop policy if exists "team_all_%1$s" on %1$s', t);
    execute format('drop policy if exists "team_anon_%1$s" on %1$s', t);
    execute format(
      'create policy "team_anon_%1$s" on %1$s
       for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
