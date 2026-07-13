-- ============================================================
-- Vendas no app sem login: sales/gateway_products entram no mesmo
-- regime de RLS anônimo das demais tabelas do time (o frontend usa a
-- anon key — molde da 20260617120000). Idempotente.
-- ============================================================

do $$ declare t text;
begin
  foreach t in array array['sales','gateway_products'] loop
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

notify pgrst, 'reload schema';
