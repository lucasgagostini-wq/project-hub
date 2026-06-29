-- ============================================================
-- Ad metrics (Adveronix → Sheets → app): estende metric_snapshots
-- e mantém projects.gasto_ads sincronizado com as linhas de gasto.
-- ============================================================

alter table metric_snapshots
  add column if not exists impressions integer not null default 0,
  add column if not exists clicks      integer not null default 0,
  add column if not exists conversions numeric not null default 0;

-- Recalcula projects.gasto_ads = soma do ad_spend de TODAS as linhas de ads do projeto
-- (lifetime, para casar com faturamento, que também é lifetime). Não toca em revenue/lucro
-- (esses continuam vindo do fluxo Cakto). Disparado quando uma linha de ads muda.
create or replace function recompute_ad_spend()
returns trigger language plpgsql as $$
declare v_project uuid := coalesce(new.project_id, old.project_id);
begin
  if v_project is null then return coalesce(new, old); end if;
  update projects set gasto_ads = coalesce(
    (select sum(ad_spend) from metric_snapshots
      where project_id = v_project and ad_spend > 0), 0)
  where id = v_project;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_snapshots_ad_spend on metric_snapshots;
create trigger trg_snapshots_ad_spend
  after insert or update or delete on metric_snapshots
  for each row execute procedure recompute_ad_spend();

notify pgrst, 'reload schema';
