-- ============================================================
-- Cakto — vendas via webhook
-- ============================================================

-- ── gateway_products: liga um produto do gateway a um projeto ──
-- product_id pode ser product.id (uuid), product.short_id ou offer.id
create table if not exists gateway_products (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid    not null references projects(id) on delete cascade,
  gateway     text    not null default 'cakto',
  product_id  text    not null,
  label       text,
  created_at  timestamptz not null default now(),
  unique(gateway, product_id)
);
create index if not exists idx_gateway_products_project on gateway_products(project_id);

-- ── sales: cada transação recebida do gateway ─────────────────
create table if not exists sales (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid    references projects(id) on delete set null,
  gateway          text    not null default 'cakto',
  transaction_id   text    not null,
  ref_id           text,
  event            text,
  status           text    not null,   -- paid | refunded | chargeback | refused | pending | canceled
  product_id       text,
  product_short_id text,
  offer_id         text,
  product_name     text,
  customer_name    text,
  customer_email   text,
  customer_phone   text,
  amount           numeric not null default 0,   -- valor pago (bruto)
  base_amount      numeric not null default 0,
  fees             numeric not null default 0,   -- taxa do gateway
  net_amount       numeric not null default 0,   -- comissão do produtor (líquido)
  payment_method   text,
  installments     integer,
  coupon           text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_content      text,
  utm_term         text,
  src              text,
  paid_at          timestamptz,
  ordered_at       timestamptz,
  raw              jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(gateway, transaction_id)
);
create index if not exists idx_sales_project on sales(project_id, paid_at desc);
create index if not exists idx_sales_status  on sales(status);

create trigger trg_sales_updated_at
  before update on sales
  for each row execute procedure set_updated_at();

-- ============================================================
-- ingest_cakto_sale: parseia o payload do webhook e grava a venda
-- Chamada via PostgREST RPC pela Vercel Function (service role)
-- ============================================================
create or replace function ingest_cakto_sale(p jsonb)
returns jsonb language plpgsql security definer as $$
declare
  d              jsonb := p->'data';
  v_event        text  := p->>'event';
  v_status       text;
  v_tx           text  := d->>'id';
  v_product_id   text  := d->'product'->>'id';
  v_product_short text := d->'product'->>'short_id';
  v_offer_id     text  := d->'offer'->>'id';
  v_project      uuid;
  v_net          numeric;
begin
  if v_tx is null then
    return jsonb_build_object('ok', false, 'error', 'missing data.id');
  end if;

  -- evento -> status interno
  v_status := case v_event
    when 'purchase_approved'    then 'paid'
    when 'subscription_renewed' then 'paid'
    when 'refund'               then 'refunded'
    when 'chargeback'           then 'chargeback'
    when 'purchase_refused'     then 'refused'
    when 'subscription_canceled' then 'canceled'
    when 'pix_gerado'           then 'pending'
    when 'boleto_gerado'        then 'pending'
    when 'picpay_gerado'        then 'pending'
    when 'openfinance_nubank_gerado' then 'pending'
    else coalesce(d->>'status', 'unknown')
  end;

  -- resolve o projeto por qualquer um dos ids do produto/oferta
  select project_id into v_project
  from gateway_products
  where gateway = 'cakto'
    and product_id in (v_product_id, v_product_short, v_offer_id)
  limit 1;

  -- comissão do produtor (líquido)
  select (c->>'totalAmount')::numeric into v_net
  from jsonb_array_elements(coalesce(d->'commissions', '[]'::jsonb)) c
  where c->>'type' = 'producer'
  limit 1;

  insert into sales (
    project_id, gateway, transaction_id, ref_id, event, status,
    product_id, product_short_id, offer_id, product_name,
    customer_name, customer_email, customer_phone,
    amount, base_amount, fees, net_amount,
    payment_method, installments, coupon,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, src,
    paid_at, ordered_at, raw
  ) values (
    v_project, 'cakto', v_tx, d->>'refId', v_event, v_status,
    v_product_id, v_product_short, v_offer_id, d->'product'->>'name',
    d->'customer'->>'name', d->'customer'->>'email', d->'customer'->>'phone',
    coalesce((d->>'amount')::numeric, 0), coalesce((d->>'baseAmount')::numeric, 0),
    coalesce((d->>'fees')::numeric, 0), coalesce(v_net, 0),
    d->>'paymentMethod', nullif(d->>'installments', '')::integer, d->>'couponCode',
    d->>'utm_source', d->>'utm_medium', d->>'utm_campaign', d->>'utm_content', d->>'utm_term', d->>'src',
    nullif(d->>'paidAt', '')::timestamptz, nullif(d->>'createdAt', '')::timestamptz, p
  )
  on conflict (gateway, transaction_id) do update set
    event          = excluded.event,
    status         = excluded.status,
    amount         = excluded.amount,
    base_amount    = excluded.base_amount,
    fees           = excluded.fees,
    net_amount     = excluded.net_amount,
    payment_method = excluded.payment_method,
    paid_at        = excluded.paid_at,
    raw            = excluded.raw,
    project_id     = coalesce(sales.project_id, excluded.project_id),
    updated_at     = now();

  return jsonb_build_object('ok', true, 'transaction', v_tx, 'status', v_status, 'project', v_project);
end;
$$;

-- ============================================================
-- recompute_project_metrics: mantém faturamento/lucro e snapshot
-- diário do projeto sincronizados com as vendas pagas
-- ============================================================
create or replace function recompute_project_metrics()
returns trigger language plpgsql as $$
declare
  v_project uuid := coalesce(new.project_id, old.project_id);
  v_date    date := coalesce(new.paid_at, old.paid_at)::date;
begin
  if v_project is null then
    return coalesce(new, old);
  end if;

  update projects set
    faturamento = coalesce((select sum(amount)     from sales where project_id = v_project and status = 'paid'), 0),
    lucro       = coalesce((select sum(net_amount) from sales where project_id = v_project and status = 'paid'), 0)
  where id = v_project;

  if v_date is not null then
    insert into metric_snapshots (project_id, date, revenue, net_profit, source)
    values (
      v_project, v_date,
      coalesce((select sum(amount)     from sales where project_id = v_project and status = 'paid' and paid_at::date = v_date), 0),
      coalesce((select sum(net_amount) from sales where project_id = v_project and status = 'paid' and paid_at::date = v_date), 0),
      'cakto'
    )
    on conflict (project_id, date, source) do update set
      revenue    = excluded.revenue,
      net_profit = excluded.net_profit;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_sales_recompute
  after insert or update or delete on sales
  for each row execute procedure recompute_project_metrics();

-- ============================================================
-- RLS
-- ============================================================
alter table gateway_products enable row level security;
alter table sales            enable row level security;

create policy "team_all_gateway_products" on gateway_products
  for all to authenticated using (true) with check (true);
create policy "team_all_sales" on sales
  for all to authenticated using (true) with check (true);

-- expõe a função no PostgREST imediatamente
notify pgrst, 'reload schema';
