-- ============================================================
-- A VENDA CASA COM A OFERTA POR PREFIXO — 2026-08-28
--
-- O `src` que o funil manda não é a oferta: é a CENA do vídeo. Medido no banco
-- do Hub em 28/08/2026, as 13 marcas existentes eram:
--
--   reencontro 7639 · reencontronuvens 201 · reencontro1 48 · reencontronoite 20
--   petescadaria 71 · petencontrosaudade 39 · petcasa 20 · petpraia 13
--   petquintal 2 · petencontro 2 · anjopraia 107 · abracojesus 22
--   (sem src) 769
--
-- Casando por igualdade (`slug = src`), o Reencontro Pet ficava com 2 vendas em
-- vez de 147 — e o placar mandaria cortar uma oferta que vende.
--
-- Idempotente.
-- ============================================================

alter table projects
  add column if not exists src_match text;

comment on column projects.src_match is
  'Prefixos de `sales.src` que esta oferta reivindica (lista por vírgula; item com "-" exclui). O mais longo vence.';

-- ── Quem reivindica o quê ───────────────────────────────────────────────────
-- 🪤 `reencontropraia` é do ANJO, mas começa com `reencontro`. Por isso o
-- Reencontro exclui explicitamente e o Anjo reivindica o prefixo inteiro — a
-- mesma precedência do `ofertaDoPedido()` no funil (eterniza-app/api/_ofertas.js).
update projects set src_match = 'reencontro, -reencontropraia' where slug = 'reencontro';
update projects set src_match = 'pet'                           where slug = 'petencontro';
update projects set src_match = 'anjopraia, reencontropraia'    where slug = 'anjopraia';
update projects set src_match = 'abracojesus'                   where slug = 'abracojesus';

-- ── A regra, em uma função só ───────────────────────────────────────────────
-- Serve o re-roteamento em massa e qualquer consulta futura. O JS que recebe
-- venda nova aplica a mesma regra em api/_src-match.js, coberto por teste.
create or replace function projeto_do_src(p_src text)
returns uuid
language sql
stable
as $$
  select p.id
    from projects p
    cross join lateral unnest(string_to_array(p.src_match, ',')) as t(pref)
   where p.src_match is not null
     and btrim(t.pref) <> ''
     and left(btrim(t.pref), 1) <> '-'
     and lower(btrim(p_src)) like btrim(t.pref) || '%'
     -- exclusão vence sempre
     and not exists (
       select 1
         from unnest(string_to_array(p.src_match, ',')) as x(ex)
        where left(btrim(x.ex), 1) = '-'
          and lower(btrim(p_src)) like substr(btrim(x.ex), 2) || '%'
     )
   order by length(btrim(t.pref)) desc
   limit 1;
$$;

grant execute on function projeto_do_src(text) to anon, authenticated;

notify pgrst, 'reload schema';
