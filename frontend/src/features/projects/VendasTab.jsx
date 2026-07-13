import React, { useState, useEffect, useMemo } from "react";
import {
  IconChartBar as ChartBar,
  IconRefresh as Refresh,
} from "../../lib/icons";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { T, fontDisplay, fontBody, fmtBRL, glassStyle } from "../../lib/theme";
import { Eyebrow, MiniStat } from "../../components";
import { useMobile } from "../../lib/context";
import { listSales } from "../../lib/api/sales";

// ─────────────────────────────────────────────────────────────────────────────
// Aba Vendas · UTM — dashboard estilo UTMify com dados próprios (tabela sales,
// alimentada pelo espelho /api/v1/orders-sync + webhook Cakto).
// A UTMify não expõe API de leitura; aqui o dado é 100% nosso.
// ─────────────────────────────────────────────────────────────────────────────

const PERIODOS = [
  { id: 7, l: "7 dias" },
  { id: 30, l: "30 dias" },
  { id: 90, l: "90 dias" },
  { id: 0, l: "Tudo" },
];

const DIMENSOES = [
  { k: "utm_campaign", l: "Campanha" },
  { k: "utm_medium", l: "Conjunto" },
  { k: "utm_content", l: "Anúncio" },
  { k: "utm_source", l: "Origem" },
];

// A Utmify às vezes injeta "::<fbclid>" no utm_content — limpa pra agrupar certo.
const limpaUtm = (v) => {
  const x = String(v || "").split("::")[0].trim();
  return x || null;
};

// data de referência da venda (paga → paid_at; senão quando entrou)
const dataRef = (s) => s.paid_at || s.ordered_at || s.created_at;

export default function VendasTab({ projeto }) {
  const m = useMobile();
  const [vendas, setVendas] = useState(null); // null = carregando
  const [erro, setErro] = useState("");
  const [periodo, setPeriodo] = useState(30);
  const [dim, setDim] = useState("utm_campaign");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let vivo = true;
    setErro("");
    listSales(projeto.id)
      .then((rows) => vivo && setVendas(rows))
      .catch((e) => vivo && (setErro(e.message || "Erro ao carregar vendas."), setVendas([])));
    return () => { vivo = false; };
  }, [projeto.id, reloadKey]);

  const corte = useMemo(() => {
    if (!periodo) return null;
    const d = new Date();
    d.setDate(d.getDate() - periodo);
    return d.getTime();
  }, [periodo]);

  const noPeriodo = useMemo(() => {
    if (!vendas) return [];
    if (!corte) return vendas;
    return vendas.filter((s) => {
      const t = new Date(dataRef(s)).getTime();
      return !isNaN(t) && t >= corte;
    });
  }, [vendas, corte]);

  const stats = useMemo(() => {
    const pagas = noPeriodo.filter((s) => s.status === "paid");
    const pendentes = noPeriodo.filter((s) => s.status === "pending");
    const reembolsos = noPeriodo.filter((s) => s.status === "refunded" || s.status === "chargeback");
    const receita = pagas.reduce((t, s) => t + Number(s.amount || 0), 0);
    const pendente = pendentes.reduce((t, s) => t + Number(s.amount || 0), 0);
    const pix = pagas.filter((s) => /pix/i.test(s.payment_method || "")).length;
    const finalizadas = pagas.length + pendentes.length; // pendente = PIX gerado e não pago
    return {
      receita,
      pagas: pagas.length,
      ticket: pagas.length ? receita / pagas.length : 0,
      pendentes: pendentes.length,
      pendenteValor: pendente,
      aprovacao: finalizadas ? (pagas.length / finalizadas) * 100 : null,
      reembolsos: reembolsos.length,
      pixShare: pagas.length ? (pix / pagas.length) * 100 : null,
    };
  }, [noPeriodo]);

  // gasto do período (metric_snapshots via projeto.adTimeline — Adveronix/Sheets)
  const gastoPeriodo = useMemo(() => {
    const ads = projeto.adTimeline || [];
    if (!ads.length) return 0;
    return ads.reduce((t, d) => {
      if (corte && new Date(d.date + "T00:00:00").getTime() < corte) return t;
      return t + (d.gasto || 0);
    }, 0);
  }, [projeto.adTimeline, corte]);

  const roas = gastoPeriodo > 0 ? stats.receita / gastoPeriodo : null;

  // série diária de receita (+ gasto quando houver)
  const serie = useMemo(() => {
    const porDia = {};
    for (const s of noPeriodo) {
      if (s.status !== "paid") continue;
      const iso = String(dataRef(s)).slice(0, 10);
      porDia[iso] = porDia[iso] || { iso, receita: 0, vendas: 0, gasto: 0 };
      porDia[iso].receita += Number(s.amount || 0);
      porDia[iso].vendas += 1;
    }
    for (const d of projeto.adTimeline || []) {
      if (corte && new Date(d.date + "T00:00:00").getTime() < corte) continue;
      porDia[d.date] = porDia[d.date] || { iso: d.date, receita: 0, vendas: 0, gasto: 0 };
      porDia[d.date].gasto += d.gasto || 0;
    }
    return Object.values(porDia)
      .sort((a, b) => a.iso.localeCompare(b.iso))
      .map((d) => ({
        ...d,
        dia: new Date(d.iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }));
  }, [noPeriodo, projeto.adTimeline, corte]);

  const temGasto = serie.some((d) => d.gasto > 0);

  // atribuição por dimensão UTM
  const atribuicao = useMemo(() => {
    const grupos = {};
    for (const s of noPeriodo) {
      const chave = limpaUtm(s[dim]) || "(sem UTM)";
      grupos[chave] = grupos[chave] || { nome: chave, vendas: 0, receita: 0, pendentes: 0 };
      if (s.status === "paid") {
        grupos[chave].vendas += 1;
        grupos[chave].receita += Number(s.amount || 0);
      } else if (s.status === "pending") {
        grupos[chave].pendentes += 1;
      }
    }
    return Object.values(grupos)
      .filter((g) => g.vendas || g.pendentes)
      .sort((a, b) => b.receita - a.receita || b.vendas - a.vendas);
  }, [noPeriodo, dim]);

  const maxReceita = Math.max(...atribuicao.map((g) => g.receita), 1);

  const pill = (ativo) => ({
    border: `1px solid ${ativo ? T.primary : T.border}`,
    background: ativo ? T.primaryBg : "transparent",
    color: ativo ? T.primaryText : T.muted,
    fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "6px 12px", cursor: "pointer",
  });

  if (vendas === null) {
    return (
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <Eyebrow>Vendas · UTM</Eyebrow>
        <div style={{ textAlign: "center", padding: "26px 0", color: T.faint, fontSize: 13 }}>Carregando vendas…</div>
      </section>
    );
  }

  if (!vendas.length) {
    return (
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <Eyebrow>Vendas · UTM</Eyebrow>
        <div style={{ textAlign: "center", padding: "30px 20px", color: T.faint, fontSize: 13, lineHeight: 1.6 }}>
          <ChartBar size={30} style={{ opacity: 0.4 }} />
          <div style={{ marginTop: 10, fontWeight: 600, color: T.muted }}>Nenhuma venda registrada ainda</div>
          <div style={{ maxWidth: 460, margin: "6px auto 0" }}>
            As vendas chegam pelo webhook da Cakto ou pelo espelho de pedidos
            (<code style={{ fontSize: 12 }}>/api/v1/orders-sync</code>) — a operação manda uma cópia
            de cada pedido com as UTMs e este painel monta o dashboard de atribuição.
          </div>
          {erro && <div style={{ color: T.neg, marginTop: 10 }}>{erro}</div>}
        </div>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filtro de período */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {PERIODOS.map((p) => (
          <button key={p.id} onClick={() => setPeriodo(p.id)} style={pill(periodo === p.id)}>{p.l}</button>
        ))}
        <button onClick={() => { setVendas(null); setReloadKey((k) => k + 1); }}
          title="Recarregar"
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted,
            border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px", cursor: "pointer" }}>
          <Refresh size={13} /> Atualizar
        </button>
      </div>

      {/* KPIs */}
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <Eyebrow>Resumo do período</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
          <MiniStat label="Faturamento" value={fmtBRL(stats.receita)} sub={`${stats.pagas} vendas pagas`} />
          <MiniStat label="Ticket médio" value={fmtBRL(stats.ticket)} />
          <MiniStat label="PIX pendente" value={String(stats.pendentes)} sub={stats.pendenteValor ? fmtBRL(stats.pendenteValor) + " a recuperar" : undefined} />
          <MiniStat label="Aprovação" value={stats.aprovacao == null ? "—" : stats.aprovacao.toFixed(0) + "%"} sub="pagas ÷ (pagas + pix gerado)" />
          <MiniStat label="Gasto (ads)" value={gastoPeriodo > 0 ? fmtBRL(gastoPeriodo) : "—"} sub={gastoPeriodo > 0 ? "Adveronix/Sheets" : "conecte na aba Conexões"} />
          <MiniStat label="ROAS" value={roas == null ? "—" : roas.toFixed(2) + "x"} />
          <MiniStat label="Resultado" value={gastoPeriodo > 0 ? fmtBRL(stats.receita - gastoPeriodo) : "—"} sub="faturamento − gasto" />
          <MiniStat label="Reembolsos" value={String(stats.reembolsos)} sub={stats.pixShare != null ? `${stats.pixShare.toFixed(0)}% das pagas em Pix` : undefined} />
        </div>
        {erro && <div style={{ fontSize: 12.5, color: T.neg, marginTop: 10 }}>{erro}</div>}
      </section>

      {/* Receita por dia */}
      {serie.length > 0 && (
        <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
          <Eyebrow>{temGasto ? "Receita × gasto por dia" : "Receita por dia"}</Eyebrow>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.hair} />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: T.faint }} />
                <YAxis tick={{ fontSize: 11, fill: T.faint }} />
                <Tooltip
                  formatter={(v, nome) => [nome === "vendas" ? v : fmtBRL(v), nome]}
                  contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: fontBody, background: T.surface, color: T.ink }} />
                <Area type="monotone" dataKey="receita" stroke={T.pos} fill={T.posBg} strokeWidth={2} />
                {temGasto && <Area type="monotone" dataKey="gasto" stroke={T.neg} fill={T.negBg} strokeWidth={2} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Atribuição por UTM */}
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <Eyebrow style={{ marginBottom: 0 }}>Atribuição</Eyebrow>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DIMENSOES.map((d) => (
              <button key={d.k} onClick={() => setDim(d.k)} style={pill(dim === d.k)}>{d.l}</button>
            ))}
          </div>
        </div>

        {atribuicao.length === 0 ? (
          <div style={{ textAlign: "center", padding: "22px 0", color: T.faint, fontSize: 13 }}>
            Sem vendas com essa dimensão no período.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {atribuicao.map((g) => (
              <div key={g.nome} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: "1 1 200px", minWidth: 0,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    title={g.nome}>
                    {g.nome}
                  </span>
                  <span style={{ fontSize: 12, color: T.faint }}>{g.vendas} venda{g.vendas === 1 ? "" : "s"}</span>
                  {g.pendentes > 0 && <span style={{ fontSize: 12, color: T.warn }}>{g.pendentes} pix pend.</span>}
                  <span style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {fmtBRL(g.receita)}
                  </span>
                  <span style={{ fontSize: 11.5, color: T.faint, width: 40, textAlign: "right" }}>
                    {stats.receita > 0 ? ((g.receita / stats.receita) * 100).toFixed(0) + "%" : "—"}
                  </span>
                </div>
                <div style={{ height: 5, background: T.hair, borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${(g.receita / maxReceita) * 100}%`, background: T.primary, borderRadius: 4, transition: "width .3s ease" }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: T.faint, marginTop: 12 }}>
          Convenção Meta Ads: Campanha = utm_campaign · Conjunto = utm_medium · Anúncio = utm_content.
          Vendas sem UTM aparecem como “(sem UTM)” — geralmente PIX recuperado ou compra direta.
        </div>
      </section>
    </div>
  );
}
