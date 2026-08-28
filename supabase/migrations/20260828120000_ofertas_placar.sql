-- ============================================================
-- PLACAR DE OFERTAS — 2026-08-28
--
-- Cada oferta que roda vira um projeto de primeira classe no Hub, com
-- identidade (slug), o funil que ela serve e o endereço dela no Meta.
--
-- O slug é a mesma marca que o funil já grava em cada venda: o espelho
-- manda `src = oferta` (eterniza-app/api/_hub_sync.js:70), e é por ele
-- que o placar separa as vendas sem tocar no funil que vende.
--
-- Idempotente.
-- ============================================================

alter table projects
  add column if not exists slug                 text,
  add column if not exists funil_url            text,
  add column if not exists meta_account_id      text,
  add column if not exists meta_campaign_prefix text;

-- Custo por venda. O espelho do funil manda só o `amount` — `fees` e `net_amount`
-- chegam zerados (eterniza-app/api/_hub_sync.js:55-72). Sem isto, "lucro" no Hub
-- seria faturamento − gasto, ignorando a taxa do gateway e o custo de entregar o
-- vídeo. Aqui o custo fica declarado e o placar mostra que é estimativa.
alter table projects
  add column if not exists taxa_gateway_pct  numeric not null default 0,
  add column if not exists taxa_gateway_fixa numeric not null default 0,
  add column if not exists custo_entrega     numeric not null default 0;

comment on column projects.custo_entrega is
  'Custo de entregar UMA unidade (ex.: geração do vídeo). Entra no lucro do placar.';

comment on column projects.slug is
  'Marca da oferta no funil — casa com sales.src (ex.: reencontro, petencontro).';
comment on column projects.meta_campaign_prefix is
  'Prefixo do nome da campanha no Meta (ex.: [REEPET]). O meta-sync soma o gasto por ele.';

-- Um slug por oferta; projetos sem slug (não-ofertas) continuam válidos.
create unique index if not exists projects_slug_key on projects (slug) where slug is not null;

-- ── Diário da oferta ────────────────────────────────────────────────────────
-- O que mudou e quando: é o que explica por que o número subiu ou caiu.
create table if not exists offer_actions (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid        not null references projects(id) on delete cascade,
  ocorreu_em  date        not null default current_date,
  tipo        text        not null default 'outro',  -- verba|criativo|preco|pagina|oferta|outro
  titulo      text        not null,
  detalhe     text,
  autor_id    uuid        references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_offer_actions_updated_at on offer_actions;
create trigger trg_offer_actions_updated_at
  before update on offer_actions
  for each row execute procedure set_updated_at();

create index if not exists idx_offer_actions_projeto
  on offer_actions (project_id, ocorreu_em desc);

-- ── RLS: mesmo regime anônimo das demais tabelas do time ────────────────────
do $$ declare t text;
begin
  foreach t in array array['offer_actions'] loop
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

-- ── Índices que o placar precisa ────────────────────────────────────────────
-- O placar sempre corta por oferta e por data de pagamento. Sem estes dois,
-- cada carregamento vira varredura — foi exatamente assim que o Hub derrubou
-- o banco da Eterniza em 09/08/2026.
create index if not exists idx_sales_src     on sales (src);
create index if not exists idx_sales_paid_at on sales (paid_at desc);
create index if not exists idx_sales_projeto_pago on sales (project_id, paid_at desc);

-- ── A função que alimenta o placar ──────────────────────────────────────────
-- O placar NUNCA baixa linha de venda pro browser: o banco entrega já somado.
-- Esta é a lição de 09/08/2026, quando o Hub varreu 829 mil eventos por OFFSET
-- e derrubou o funil por 2h. Uma chamada = uma linha por oferta.
--
-- O dia é o de São Paulo, não o do UTC: 21h de um dia aqui já é o dia seguinte
-- em UTC, e o placar de "hoje" nasceria errado toda noite. A conversão fica no
-- limite da janela (e não em cima de cada linha) pra continuar usando o índice.
create or replace function placar_ofertas(p_desde date, p_ate date)
returns table (
  project_id   uuid,
  nome         text,
  slug         text,
  ativo        boolean,
  vendas       bigint,
  faturamento  numeric,
  liquido      numeric,
  taxas        numeric,
  pendentes    bigint,
  reembolsos   bigint,
  gasto        numeric,
  impressoes   bigint,
  cliques      bigint,
  taxa_pct     numeric,
  taxa_fixa    numeric,
  custo_unit   numeric
)
language sql
stable
as $$
  with limites as (
    select (p_desde::timestamp at time zone 'America/Sao_Paulo')     as ini,
           ((p_ate + 1)::timestamp at time zone 'America/Sao_Paulo') as fim
  ),
  v as (
    select s.project_id,
           count(*) filter (where s.status = 'paid')                                  as vendas,
           coalesce(sum(s.amount)     filter (where s.status = 'paid'), 0)            as faturamento,
           coalesce(sum(s.net_amount) filter (where s.status = 'paid'), 0)            as liquido,
           coalesce(sum(s.fees)       filter (where s.status = 'paid'), 0)            as taxas,
           count(*) filter (where s.status = 'pending')                               as pendentes,
           count(*) filter (where s.status in ('refunded', 'chargeback'))             as reembolsos
      from sales s, limites l
     where s.paid_at >= l.ini and s.paid_at < l.fim
     group by s.project_id
  ),
  g as (
    select m.project_id,
           coalesce(sum(m.ad_spend), 0)    as gasto,
           coalesce(sum(m.impressions), 0) as impressoes,
           coalesce(sum(m.clicks), 0)      as cliques
      from metric_snapshots m
     where m.source = 'meta' and m.date between p_desde and p_ate
     group by m.project_id
  )
  select p.id, p.name, p.slug, p.active,
         coalesce(v.vendas, 0)::bigint,
         coalesce(v.faturamento, 0),
         coalesce(v.liquido, 0),
         coalesce(v.taxas, 0),
         coalesce(v.pendentes, 0)::bigint,
         coalesce(v.reembolsos, 0)::bigint,
         coalesce(g.gasto, 0),
         coalesce(g.impressoes, 0)::bigint,
         coalesce(g.cliques, 0)::bigint,
         p.taxa_gateway_pct,
         p.taxa_gateway_fixa,
         p.custo_entrega
    from projects p
    left join v on v.project_id = p.id
    left join g on g.project_id = p.id
   where p.active
   order by coalesce(v.faturamento, 0) desc, p.name asc;
$$;

grant execute on function placar_ofertas(date, date) to anon, authenticated;

notify pgrst, 'reload schema';
