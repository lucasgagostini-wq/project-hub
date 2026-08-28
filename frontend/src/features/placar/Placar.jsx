import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  IconCurrencyDollar as DollarSign,
  IconTrendingUp as TrendingUp,
  IconTarget as Target,
  IconSpeakerphone as Megaphone,
  IconRefresh as Refresh,
  IconChevronRight as ChevronRight,
  IconRocket as Rocket,
} from "../../lib/icons";
import { T, fontDisplay, fmtBRL, glassStyle } from "../../lib/theme";
import { Kpi, Eyebrow, PageHeader, ChipFiltro } from "../../components";
import { useMobile } from "../../lib/context";
import { carregarPlacar, decisoes, periodoDe } from "../../lib/api/placar";

const PERIODOS = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

const CORES_NIVEL = {
  urgente: { c: T.neg, bg: T.negBg, rotulo: "Urgente" },
  oportunidade: { c: T.pos, bg: T.posBg, rotulo: "Oportunidade" },
  atencao: { c: "#F59E0B", bg: "rgba(245,158,11,0.12)", rotulo: "Atenção" },
};

function Numero({ valor, cor, sufixo = "" }) {
  return (
    <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: cor || T.ink }}>
      {valor}{sufixo}
    </span>
  );
}

function LinhaOferta({ c, onAbrir, isMobile }) {
  const positivo = c.lucro >= 0;
  const roi = c.roi == null ? "—" : `${c.roi.toFixed(2)}x`;
  const corRoi = c.roi == null ? T.faint : c.roi >= 2 ? T.pos : c.roi < 1 ? T.neg : T.ink;

  const celulas = [
    { rotulo: "Vendas", valor: String(c.vendas) },
    { rotulo: "Faturou", valor: fmtBRL(c.faturamento) },
    { rotulo: "Gastou", valor: fmtBRL(c.gasto), cor: c.gasto > 0 ? T.ink : T.faint },
    { rotulo: "Lucro", valor: fmtBRL(c.lucro), cor: positivo ? T.pos : T.neg },
    { rotulo: "ROI", valor: roi, cor: corRoi },
    { rotulo: "CPA", valor: c.cpa == null ? "—" : fmtBRL(c.cpa) },
  ];

  return (
    <div
      onClick={() => onAbrir?.(c.project_id)}
      style={{
        ...glassStyle(), borderRadius: 14, padding: isMobile ? "14px 16px" : "16px 20px",
        display: "grid", gap: 12, cursor: "pointer",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(160px, 1.4fr) repeat(6, minmax(72px, 1fr)) 18px",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {c.nome}
          </div>
          <div style={{ fontSize: 11.5, color: T.faint }}>
            {c.slug || "sem slug"}
            {c.pendentes > 0 && ` · ${c.pendentes} PIX pendente${c.pendentes > 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {isMobile ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {celulas.map((cel) => (
            <div key={cel.rotulo}>
              <div style={{ fontSize: 10.5, color: T.faint, textTransform: "uppercase", letterSpacing: 0.6 }}>{cel.rotulo}</div>
              <div style={{ fontSize: 14 }}><Numero valor={cel.valor} cor={cel.cor} /></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {celulas.map((cel) => (
            <div key={cel.rotulo} style={{ textAlign: "right", fontSize: 14.5 }}>
              <Numero valor={cel.valor} cor={cel.cor} />
            </div>
          ))}
          <ChevronRight size={16} color={T.faint} />
        </>
      )}
    </div>
  );
}

export default function Placar({ onAbrirProjeto, onNovaOferta }) {
  const isMobile = useMobile();
  const [periodo, setPeriodo] = useState("hoje");
  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const janela = useMemo(() => periodoDe(periodo), [periodo]);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setLinhas(await carregarPlacar(janela));
    } catch (e) {
      // O placar em branco engana mais do que o erro na tela: se a função ainda
      // não foi aplicada no banco, é isso que precisa aparecer.
      const msg = String(e?.message || e);
      // Erro mais provável logo depois de um deploy: o SQL do placar ainda não
      // foi aplicado no banco. Melhor dizer isso do que "erro desconhecido".
      setErro(/placar_ofertas|function|does not exist|schema cache/i.test(msg)
        ? "Falta aplicar o SQL do placar no Supabase (migration 20260828120000 + seed das ofertas)."
        : msg || "Não consegui carregar o placar.");
      setLinhas([]);
    } finally {
      setCarregando(false);
    }
  }, [janela]);

  useEffect(() => { buscar(); }, [buscar]);

  const total = useMemo(() => {
    const t = linhas.reduce(
      (a, c) => ({
        faturamento: a.faturamento + c.faturamento,
        gasto: a.gasto + c.gasto,
        lucro: a.lucro + c.lucro,
        vendas: a.vendas + c.vendas,
      }),
      { faturamento: 0, gasto: 0, lucro: 0, vendas: 0 }
    );
    return { ...t, roi: t.gasto > 0 ? t.faturamento / t.gasto : null };
  }, [linhas]);

  const fila = useMemo(() => decisoes(linhas), [linhas]);
  const algumEstimado = linhas.some((c) => c.custoEstimado);

  return (
    <div>
      <PageHeader
        titulo="Placar das ofertas"
        sub={`O que cada oferta fez ${janela.label} — venda, gasto e o que sobra.`}
        acao={
          <button onClick={buscar} disabled={carregando}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
              border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 13, cursor: "pointer" }}>
            <Refresh size={15} /> {carregando ? "Atualizando…" : "Atualizar"}
          </button>
        }
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {PERIODOS.map((p) => (
          <ChipFiltro key={p.id} ativo={periodo === p.id} onClick={() => setPeriodo(p.id)}>{p.label}</ChipFiltro>
        ))}
      </div>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", marginBottom: 26 }}>
        <Kpi label="Faturamento" value={fmtBRL(total.faturamento)} hint={`${total.vendas} venda${total.vendas === 1 ? "" : "s"}`} icon={DollarSign} accent={T.primary} />
        <Kpi label="Gasto em anúncio" value={fmtBRL(total.gasto)} hint={total.gasto === 0 ? "nada registrado" : undefined} icon={Megaphone} />
        <Kpi label="Lucro" value={fmtBRL(total.lucro)} hint={algumEstimado ? "taxa estimada" : undefined} icon={TrendingUp} />
        <Kpi label="ROI" value={total.roi == null ? "—" : `${total.roi.toFixed(2)}x`} hint={total.roi == null ? "sem gasto" : undefined} icon={Target} />
      </div>

      {erro && (
        <div style={{ ...glassStyle(), borderRadius: 14, padding: 18, marginBottom: 22, borderLeft: `3px solid ${T.neg}` }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>O placar não carregou</div>
          <div style={{ fontSize: 13, color: T.muted }}>{erro}</div>
        </div>
      )}

      {fila.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <Eyebrow>O que fazer agora</Eyebrow>
          <div style={{ display: "grid", gap: 10 }}>
            {fila.map((d, i) => {
              const cor = CORES_NIVEL[d.nivel];
              return (
                <div key={`${d.projectId}-${i}`} onClick={() => onAbrirProjeto?.(d.projectId)}
                  style={{ ...glassStyle(), borderRadius: 14, padding: "14px 18px", cursor: "pointer",
                    borderLeft: `3px solid ${cor.c}`, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cor.c, background: cor.bg,
                    padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>{cor.rotulo}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{d.titulo} — {d.oferta}</div>
                    <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>{d.motivo}</div>
                    <div style={{ fontSize: 12.5, color: T.faint, marginTop: 2 }}>{d.acao}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Eyebrow>Oferta por oferta</Eyebrow>

      {!isMobile && linhas.length > 0 && (
        <div style={{ display: "grid", gap: 12, padding: "0 20px 8px",
          gridTemplateColumns: "minmax(160px, 1.4fr) repeat(6, minmax(72px, 1fr)) 18px" }}>
          <span />
          {["Vendas", "Faturou", "Gastou", "Lucro", "ROI", "CPA"].map((h) => (
            <span key={h} style={{ fontSize: 10.5, color: T.faint, textTransform: "uppercase",
              letterSpacing: 0.7, textAlign: "right", fontWeight: 600 }}>{h}</span>
          ))}
          <span />
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {carregando && linhas.length === 0 && (
          <div style={{ ...glassStyle(), borderRadius: 14, padding: 24, color: T.muted, fontSize: 13.5 }}>
            Somando as vendas…
          </div>
        )}

        {!carregando && !erro && linhas.length === 0 && (
          <div style={{ ...glassStyle(), borderRadius: 16, padding: 28, textAlign: "center" }}>
            <Rocket size={26} color={T.faint} />
            <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 17, margin: "12px 0 6px" }}>
              Nenhuma oferta cadastrada
            </div>
            <p style={{ color: T.muted, fontSize: 13.5, maxWidth: 460, margin: "0 auto 16px" }}>
              O placar lê as ofertas cadastradas aqui. Cada oferta precisa do <b>slug</b> igual ao que o
              funil grava na venda (ex.: <code>reencontro</code>, <code>petencontro</code>) e do prefixo
              da campanha no Meta (ex.: <code>[REEPET]</code>) pra puxar o gasto sozinha.
            </p>
            {onNovaOferta && (
              <button onClick={onNovaOferta}
                style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: T.primary,
                  color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Cadastrar a primeira oferta
              </button>
            )}
          </div>
        )}

        {linhas.map((c) => (
          <LinhaOferta key={c.project_id} c={c} onAbrir={onAbrirProjeto} isMobile={isMobile} />
        ))}
      </div>

      {algumEstimado && linhas.length > 0 && (
        <p style={{ fontSize: 12, color: T.faint, marginTop: 18 }}>
          O gateway não manda a taxa pro Hub, então taxa e custo de entrega saem do que está
          configurado em cada oferta — o lucro acima é <b>estimado</b>, não extrato.
        </p>
      )}
    </div>
  );
}
