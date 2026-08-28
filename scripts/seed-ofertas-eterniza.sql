-- ============================================================
-- CADASTRO DAS OFERTAS QUE RODAM HOJE — 2026-08-28
--
-- Rodar DEPOIS da migration 20260828120000_ofertas_placar.sql.
-- Idempotente: rodar de novo atualiza, não duplica.
--
-- De onde vem cada número (nada aqui é chute):
--  · slugs: as 4 chaves de OFERTAS em eterniza-app/api/_ofertas.js — é o valor
--    que o funil grava em cada venda (`src`), lido em api/_hub_sync.js:70.
--  · prefixos de campanha: `campanhaPadrao` do mesmo _ofertas.js, a regra que já
--    tem teste próprio lá (test/gasto-por-oferta.test.js). `[REE` é aberto de
--    propósito e por isso exclui as ofertas vizinhas — sem a exclusão, o
--    Reencontro engole o gasto do Pet.
--  · contas de anúncio: as três que rodam o Reencontro, conferidas na API do Meta
--    em 28/08/2026 — SHEETMIDIA 579420481091649, Eterniza projetos 993024823734489
--    e Cecilia 799256834716421.
--  · taxa: WOOVI cobra 100% desde 18/08/2026 — 0,80% com piso R$0,50, e no ticket
--    da casa o percentual nunca alcança o piso ⇒ R$0,50 FIXO por venda.
--  · custo de entrega: CUSTO_VIDEO_USD 0.24 × USD_BRL 5.19 = R$1,25 por vídeo.
--
-- ⚠️ `funil_url` fica em branco onde o domínio de cada oferta não estava
-- confirmado — preencher na tela da oferta, não chutar aqui.
-- ============================================================

insert into projects
  (name, niche, vehicle, active, slug, funil_url, meta_account_id, meta_campaign_prefix,
   taxa_gateway_pct, taxa_gateway_fixa, custo_entrega)
values
  ('Reencontro',        'Memorial · luto',      'VSL + PIX', true, 'reencontro',
   'https://memoriaseterniza.online',
   '579420481091649,993024823734489,799256834716421',
   '[REE, -[REEPET], -[ANJ], -[JES]', 0, 0.50, 1.25),

  ('Reencontro Pet',    'Memorial · pet',       'VSL + PIX', true, 'petencontro',
   null,
   '579420481091649,993024823734489,799256834716421',
   '[REEPET]', 0, 0.50, 1.25),

  ('Anjo da Praia',     'Memorial · anjo',      'VSL + PIX', true, 'anjopraia',
   null,
   '579420481091649,993024823734489,799256834716421',
   '[ANJ]', 0, 0.50, 1.25),

  ('Abraço com Jesus',  'Memorial · fé',        'VSL + PIX', true, 'abracojesus',
   null,
   '579420481091649,993024823734489,799256834716421',
   '[JES]', 0, 0.50, 1.25)

on conflict (slug) where slug is not null do update set
  meta_account_id      = excluded.meta_account_id,
  meta_campaign_prefix = excluded.meta_campaign_prefix,
  taxa_gateway_pct     = excluded.taxa_gateway_pct,
  taxa_gateway_fixa    = excluded.taxa_gateway_fixa,
  custo_entrega        = excluded.custo_entrega,
  updated_at           = now();

-- ── Re-roteia o que já está espelhado ───────────────────────────────────────
-- As vendas entraram todas no mesmo projeto (o funil manda um HUB_SYNC_PROJECT_ID
-- só), mas cada uma carrega a sua oferta em `src`. Isto devolve cada venda pra
-- sua dona. Vendas sem `src` (as antigas) ficam onde estão — não há como saber.
--
-- 🪤 O TRIGGER PRECISA SAIR DO CAMINHO. `trg_sales_recompute` é AFTER UPDATE
-- FOR EACH ROW e, por linha, roda três agregações sobre a `sales` inteira. Num
-- update de milhares de vendas isso vira dezenas de milhares de varreduras e o
-- SQL Editor estoura por timeout (medido em 28/08/2026). Desligamos, atualizamos
-- em bloco e recalculamos UMA vez — o resultado final é idêntico.
-- ⚠️ O disable pega lock exclusivo na `sales`: venda que chegar nesses segundos
-- espera, não se perde. Rodar fora do pico mesmo assim.
begin;

alter table sales disable trigger trg_sales_recompute;

update sales s
   set project_id = d.pid
  from (select id, projeto_do_src(src) as pid from sales where src is not null) d
 where d.id = s.id
   and d.pid is not null
   and s.project_id is distinct from d.pid;

alter table sales enable trigger trg_sales_recompute;

commit;

-- ── Refaz à mão o que o trigger faria ───────────────────────────────────────
-- Uma passada por projeto, em vez de uma por venda.
update projects p set
  faturamento = coalesce((select sum(amount)     from sales where project_id = p.id and status = 'paid'), 0),
  lucro       = coalesce((select sum(net_amount) from sales where project_id = p.id and status = 'paid'), 0);

-- Snapshots diários de receita (os que o trigger grava com source='cakto').
-- Como venda mudou de dono, os antigos ficaram apontando pro projeto errado.
delete from metric_snapshots where source = 'cakto';

insert into metric_snapshots (project_id, date, revenue, net_profit, source)
select project_id, paid_at::date, sum(amount), sum(net_amount), 'cakto'
  from sales
 where status = 'paid' and paid_at is not null and project_id is not null
 group by project_id, paid_at::date
on conflict (project_id, date, source) do update set
  revenue    = excluded.revenue,
  net_profit = excluded.net_profit;

-- ── Confere o resultado ─────────────────────────────────────────────────────
select p.name,
       p.slug,
       count(s.id)                                             as vendas_espelhadas,
       count(s.id) filter (where s.status = 'paid')            as pagas,
       coalesce(sum(s.amount) filter (where s.status = 'paid'), 0) as faturamento
  from projects p
  left join sales s on s.project_id = p.id
 where p.slug is not null
 group by p.name, p.slug
 order by faturamento desc;
