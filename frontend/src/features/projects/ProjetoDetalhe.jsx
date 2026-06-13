import React, { useState, useMemo } from "react";
import {
  IconArrowLeft as ArrowLeft,
  IconCurrencyDollar as DollarSign,
  IconLayoutKanban as FolderKanban,
  IconMessage as MessageSquare,
  IconTrendingUp as TrendingUp,
  IconSpeakerphone as Megaphone,
  IconClock as Clock,
  IconEye as Eye,
  IconLink as Link2,
  IconPencil as Pencil,
  IconX as X,
  IconCheck as Check,
  IconUsers as Users2,
  IconActivity as Activity,
  IconPlus as Plus,
} from "@tabler/icons-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { T, fontDisplay, fontBody, fmtBRL, fmtBRLc } from "../../lib/theme";
import {
  Kpi, Eyebrow, LinhaInfo, MiniStat, MiniEstrutura, Campo,
  CreativeThumb, StatusBadge, RoasTag, Avatar,
} from "../../components";
import { useMobile } from "../../lib/context";
import { gerarTimeline } from "../../lib/utils";
import { MOCK_ESTRUTURAS } from "../../lib/api/mockData";

// ─────────────────────────────────────────────────────────────────────────────
// Prévia da oferta (modal)
// ─────────────────────────────────────────────────────────────────────────────
function PreviaOferta({ projeto, est, onFechar }) {
  const Chip = ({ children }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500,
      color: "#fff", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.22)",
      padding: "5px 11px", borderRadius: 999 }}>{children}</span>
  );
  const Sec = ({ titulo, children }) => (
    <div style={{ padding: "18px 26px", borderTop: `1px solid ${T.hair}` }}>
      <Eyebrow>{titulo}</Eyebrow>
      {children}
    </div>
  );
  const Row = ({ label, valor }) =>
    valor ? (
      <div style={{ display: "flex", gap: 14, padding: "6px 0" }}>
        <div style={{ width: 110, flexShrink: 0, fontSize: 12.5, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{valor}</div>
      </div>
    ) : null;

  return (
    <div onClick={onFechar} style={{ position: "fixed", inset: 0, background: "rgba(24,24,27,.4)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflow: "auto", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 20, width: "100%",
        maxWidth: 640, overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.28)" }}>
        <div style={{ position: "relative", padding: "24px 26px", color: "#fff",
          background: projeto.imagem ? "#000" : "linear-gradient(120deg, #1F1E1C 0%, #3A352F 100%)" }}>
          {projeto.imagem && (
            <img src={projeto.imagem} alt={projeto.nome}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.78) 100%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase",
                color: "rgba(255,255,255,.7)", fontFamily: fontDisplay }}>{projeto.nicho}</div>
              <button onClick={onFechar} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,.8)" }}><X size={20} /></button>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginTop: 6, lineHeight: 1.1 }}>{projeto.nome}</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.86)", margin: "10px 0 0", maxWidth: 520 }}>{projeto.oferta}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              {est.venda?.preco && <Chip><DollarSign size={13} /> {est.venda.preco}</Chip>}
              {est.venda?.garantia && <Chip>Garantia: {est.venda.garantia}</Chip>}
              <Chip><Megaphone size={13} /> {projeto.veiculo}</Chip>
            </div>
          </div>
        </div>
        <div style={{ maxHeight: "52vh", overflowY: "auto" }}>
          <Sec titulo="Para quem é">
            <Row label="Público" valor={projeto.publico} />
            <Row label="Idade" valor={projeto.idade} />
            {projeto.persona && <>
              <Row label="Persona" valor={projeto.persona.nome} />
              <Row label="Dor" valor={projeto.persona.dor} />
              <Row label="Desejo" valor={projeto.persona.desejo} />
            </>}
          </Sec>
          <Sec titulo="Como vende">
            <Row label="Funil" valor={est.venda?.funil} />
            <Row label="Preço" valor={est.venda?.preco} />
            <Row label="Garantia" valor={est.venda?.garantia} />
            <Row label="Upsells" valor={est.venda?.upsells} />
            <Row label="Order bumps" valor={est.venda?.bumps} />
          </Sec>
          <Sec titulo="O que entrega">
            <Row label="Entregável" valor={est.entregavel?.oQueRecebe} />
            <Row label="Plataforma" valor={est.entregavel?.plataforma} />
            <Row label="Acesso" valor={est.entregavel?.acesso} />
            <Row label="Bônus" valor={est.entregavel?.bonus} />
          </Sec>
          <Sec titulo="Suporte">
            <Row label="Canais" valor={est.suporte?.canais} />
            <Row label="Resposta" valor={est.suporte?.sla} />
            <Row label="Reembolso" valor={est.suporte?.reembolso} />
          </Sec>
          {(projeto.links || []).length > 0 && (
            <Sec titulo="Links">
              {projeto.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: T.ink, textDecoration: "none", padding: "5px 0" }}>
                  <Link2 size={13} color={T.faint} /> <span style={{ color: T.muted }}>{l.tipo}:</span>
                  <span style={{ textDecoration: "underline" }}>{l.url}</span>
                </a>
              ))}
            </Sec>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Resumo
// ─────────────────────────────────────────────────────────────────────────────
function ResumoTab({ projeto }) {
  const m = useMobile();
  const [previa, setPrevia] = useState(false);
  const est = projeto.estruturas || MOCK_ESTRUTURAS[projeto.id] || {};
  const margem = projeto.faturamento ? Math.round((projeto.lucro / projeto.faturamento) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: `1px solid ${T.border}`,
        minHeight: 188, display: "flex", alignItems: "flex-end",
        background: projeto.imagem ? "#000" : "linear-gradient(120deg, #1F1E1C 0%, #3A352F 100%)" }}>
        {projeto.imagem && (
          <img src={projeto.imagem} alt={projeto.nome}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.72) 100%)" }} />
        <div style={{ position: "relative", padding: m ? 18 : 24, width: "100%", display: "flex",
          alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase",
              color: "rgba(255,255,255,.7)", fontFamily: fontDisplay, marginBottom: 8 }}>{projeto.nicho}</div>
            <div style={{ fontFamily: fontDisplay, fontSize: m ? 24 : 30, fontWeight: 700, color: "#fff", letterSpacing: -0.6, lineHeight: 1.05 }}>{projeto.nome}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12.5, color: "rgba(255,255,255,.82)" }}>
              <Megaphone size={14} /> {projeto.veiculo} <span style={{ opacity: .5 }}>·</span> <Clock size={14} /> {projeto.tempoOnline}d no ar
            </div>
          </div>
          <button onClick={() => setPrevia(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11, border: "none",
              background: "rgba(255,255,255,.96)", color: "#0D1117", fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>
            <Eye size={16} /> Prévia da oferta
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
        <MiniStat label="Faturamento" value={fmtBRL(projeto.faturamento || 0)} />
        <MiniStat label="Lucro líquido" value={fmtBRL(projeto.lucro || 0)} sub={`margem ${margem}%`} />
        <MiniStat label="Gasto com anúncios" value={fmtBRL(projeto.gastoAds || 0)} />
        <MiniStat label="Oferta no ar" value={`${projeto.tempoOnline || 0} dias`} sub={projeto.escala > 0 ? "escalando" : "em queda"} />
      </div>

      {projeto.persona && (
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1.3fr 1fr", gap: 14 }}>
          <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
            <Eyebrow>A oferta</Eyebrow>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>{projeto.oferta}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
              <LinhaInfo label="Público" valor={projeto.publico} />
              <LinhaInfo label="Idade" valor={projeto.idade} />
              <LinhaInfo label="Preço" valor={est.venda?.preco || projeto.preco} />
              <LinhaInfo label="Garantia" valor={est.venda?.garantia || projeto.garantia} />
            </div>
          </section>
          <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
            <Eyebrow>Persona</Eyebrow>
            <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{projeto.persona.nome}</div>
            <LinhaInfo label="Dor principal" valor={projeto.persona.dor} />
            <div style={{ height: 12 }} />
            <LinhaInfo label="Desejo" valor={projeto.persona.desejo} />
          </section>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
        <MiniEstrutura icon={DollarSign} titulo="Venda" linhas={[["Preço", est.venda?.preco || projeto.preco], ["Garantia", est.venda?.garantia || projeto.garantia]]} />
        <MiniEstrutura icon={FolderKanban} titulo="Entregável" linhas={[["Plataforma", est.entregavel?.plataforma], ["Acesso", est.entregavel?.acesso]]} />
        <MiniEstrutura icon={MessageSquare} titulo="Suporte" linhas={[["Canais", est.suporte?.canais], ["SLA", est.suporte?.sla]]} />
      </div>

      {previa && <PreviaOferta projeto={projeto} est={est} onFechar={() => setPrevia(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Visão Geral (overview)
// ─────────────────────────────────────────────────────────────────────────────
function ProjetoOverview({ projeto }) {
  const m = useMobile();
  const margem = projeto.faturamento ? Math.round((projeto.lucro / projeto.faturamento) * 100) : 0;
  const criativos = projeto.criativos || [];
  const maxV = criativos.length ? Math.max(...criativos.map((c) => c.vendas || 0)) : 1;
  const THUMB_CORES = ["#B89C82", "#7FA6A0", "#A6809A"];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
        <Kpi label="Faturamento" value={fmtBRL(projeto.faturamento || 0)} icon={DollarSign} accent={T.ink} delta={projeto.escala > 0 ? 18 : -9} />
        <Kpi label="Lucro líquido" value={fmtBRL(projeto.lucro || 0)} icon={TrendingUp} hint={`margem ${margem}%`} />
        <Kpi label="Gasto com anúncios" value={fmtBRL(projeto.gastoAds || 0)} icon={Megaphone} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1.4fr", gap: 14 }}>
        <Kpi label="Tempo de oferta no ar" value={`${projeto.tempoOnline || 0} dias`} icon={Clock} hint={projeto.escala > 0 ? "escalando" : "em queda"} />
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 500, marginBottom: 14 }}>Top 3 criativos que mais vendem</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {criativos.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: fontDisplay, fontSize: 13, fontWeight: 600, color: T.faint, width: 10, textAlign: "center" }}>{i + 1}</span>
                <CreativeThumb creative={c} color={THUMB_CORES[i % THUMB_CORES.length]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nome}</div>
                  <div style={{ height: 5, background: T.hair, borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
                    <div style={{ height: "100%", width: `${maxV ? (c.vendas / maxV) * 100 : 0}%`, background: T.primary, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{c.vendas}</div>
                  <div style={{ fontSize: 10.5, color: T.faint }}>vendas</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendário da oferta
// ─────────────────────────────────────────────────────────────────────────────
function CalendarioOferta({ projeto, userById }) {
  const acoes = [
    { dia: 4, label: "Subiu novo criativo", resp: "u4" },
    { dia: 9, label: "Trocou headline da VSL", resp: "u3" },
    { dia: 16, label: "Aumentou verba 30%", resp: "u2" },
    { dia: 23, label: "Novo upsell no checkout", resp: "u1" },
  ];
  const dias = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
      <Eyebrow>Calendário da oferta — maio</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, marginBottom: 16 }}>
        {dias.map((d) => {
          const ac = acoes.find((a) => a.dia === d);
          return (
            <div key={d} title={ac?.label}
              style={{ aspectRatio: "1", borderRadius: 8, border: `1px solid ${ac ? T.ink : T.hair}`,
                background: ac ? T.primary : T.surface, color: ac ? "#fff" : T.faint, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 11.5, fontFamily: fontDisplay,
                fontVariantNumeric: "tabular-nums" }}>
              {d}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {acoes.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
            <span style={{ fontFamily: fontDisplay, color: T.faint, width: 22 }}>{String(a.dia).padStart(2, "0")}/05</span>
            <Avatar user={userById?.(a.resp)} size={20} />
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Gestão de Oferta
// ─────────────────────────────────────────────────────────────────────────────
function GestaoOferta({ projeto, userById, atividade = [], onEditarPersona, onEditarOferta }) {
  const m = useMobile();
  const timeline = useMemo(
    () => projeto.timeline || gerarTimeline((projeto.fatSemana || 0) / 7, projeto.escala || 0),
    [projeto.id] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const totalPeriodo = timeline.reduce((s, d) => s + (d.delta || 0), 0);
  const [editPersona, setEditPersona] = useState(false);
  const [draft, setDraft] = useState(projeto.persona || {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Estruturação */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <Eyebrow>Estruturação da oferta</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: "16px 28px" }}>
          <Campo label="A oferta" valor={projeto.oferta} full />
          <Campo label="Público-alvo" valor={projeto.publico} />
          <Campo label="Idade do público" valor={projeto.idade} icon={Users2} />
          <Campo label="Maior veículo de venda" valor={projeto.veiculo} icon={Megaphone} />
          <div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 7 }}>Links</div>
            {(projeto.links || []).map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: T.ink, textDecoration: "none", marginBottom: 6 }}>
                <Link2 size={13} color={T.faint} />
                <span style={{ color: T.muted }}>{l.tipo}:</span> <span style={{ textDecoration: "underline" }}>{l.url}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Persona */}
      {projeto.persona && (
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Eyebrow>Persona mapeada</Eyebrow>
            {!editPersona ? (
              <button onClick={() => { setDraft(projeto.persona); setEditPersona(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
                <Pencil size={13} /> Editar
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditPersona(false)}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
                  <X size={13} /> Cancelar
                </button>
                <button onClick={() => { onEditarPersona?.(draft); setEditPersona(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#fff", border: "none", background: T.primary, borderRadius: 9, padding: "6px 12px" }}>
                  <Check size={13} /> Salvar
                </button>
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: "16px 28px" }}>
            {[["nome","Quem é"],["canal","Onde está"],["dor","Dor principal"],["desejo","Desejo"],["objecao","Principal objeção"]].map(([k, label]) => (
              <div key={k}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
                {editPersona ? (
                  <textarea value={draft[k] || ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                    style={{ width: "100%", minHeight: 52, resize: "vertical", padding: "8px 10px", borderRadius: 9,
                      border: `1px solid ${T.border}`, fontSize: 13, fontFamily: fontBody, outline: "none", background: T.surfaceAlt, color: T.ink }} />
                ) : (
                  <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{projeto.persona[k]}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gráfico */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <Eyebrow>Linha do tempo da oferta</Eyebrow>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, color: T.faint }}>Resultado no período (30 dias)</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: totalPeriodo >= 0 ? T.pos : T.neg }}>
              {totalPeriodo >= 0 ? "+" : ""}{fmtBRL(totalPeriodo)}
            </div>
          </div>
        </div>
        <div style={{ height: 200, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ left: -18, right: 6, top: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.hair} vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: T.faint }} interval={5} tickLine={false} axisLine={{ stroke: T.border }} />
              <YAxis tick={{ fontSize: 10, fill: T.faint }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: fontBody, background: T.surface, color: T.ink }}
                formatter={(v, n, p) => [
                  <span key="t">{fmtBRLc(v)} <b style={{ color: p.payload.delta >= 0 ? T.pos : T.neg }}>
                    ({p.payload.delta >= 0 ? "+" : ""}{fmtBRL(p.payload.delta)})</b></span>, "Faturamento do dia"]}
                labelFormatter={(l) => `Dia ${l}`} />
              <Area type="monotone" dataKey="faturamento" stroke={T.primary} strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1.2fr 1fr", gap: 22 }}>
        <CalendarioOferta projeto={projeto} userById={userById} />
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <Eyebrow>Rastreamento de mudanças</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {atividade.length === 0 && <span style={{ fontSize: 13, color: T.faint }}>Nenhuma alteração ainda.</span>}
            {atividade.map((a) => {
              const u = userById?.(a.user || a.user_id);
              return (
                <div key={a.id} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  {u && <Avatar user={u} size={28} />}
                  <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                    <b style={{ fontWeight: 600 }}>{(u?.nome || u?.name || "").split(" ")[0]}</b>{" "}
                    <span style={{ color: T.muted }}>{a.acao || a.action}</span>
                    <div style={{ fontSize: 11.5, color: T.faint, marginTop: 1 }}>{a.quando || a.created_at}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Estruturas
// ─────────────────────────────────────────────────────────────────────────────
const CAMPOS_VENDA = [
  ["funil","Funil de vendas",true],["preco","Preço / ticket"],["garantia","Garantia"],
  ["gateway","Gateway de pagamento"],["upsells","Upsells / Downsells",true],["bumps","Order bumps",true],
];
const CAMPOS_ENTREGAVEL = [
  ["oQueRecebe","O que o cliente recebe",true],["plataforma","Plataforma de entrega"],["formato","Formato"],
  ["acesso","Tempo de acesso"],["bonus","Bônus",true],["cronograma","Liberação / cronograma",true],
];
const CAMPOS_SUPORTE = [
  ["canais","Canais de atendimento"],["sla","Tempo de resposta (SLA)"],["responsavel","Responsável pelo suporte"],
  ["reembolso","Política de reembolso"],["faq","FAQ / dúvidas comuns",true],
];

function EstruturaSecao({ titulo, icon: Icon, campos, valores, onSalvar }) {
  const m = useMobile();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(valores);
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  const inputSt = { width: "100%", marginTop: 6, padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: fontBody, outline: "none", background: T.surfaceAlt, color: T.ink };

  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon size={16} color={T.ink} />
          <Eyebrow style={{ marginBottom: 0 }}>{titulo}</Eyebrow>
        </div>
        {!edit ? (
          <button onClick={() => { setDraft(valores); setEdit(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
            <Pencil size={13} /> Editar
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEdit(false)}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
              <X size={13} /> Cancelar
            </button>
            <button onClick={() => { onSalvar?.(draft); setEdit(false); }}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#fff", border: "none", background: T.primary, borderRadius: 9, padding: "6px 12px" }}>
              <Check size={13} /> Salvar
            </button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: "16px 28px" }}>
        {campos.map(([k, label, full]) => (
          <div key={k} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
            {edit ? (
              full ? (
                <textarea value={draft[k] || ""} onChange={(e) => set(k, e.target.value)} style={{ ...inputSt, minHeight: 50, resize: "vertical" }} />
              ) : (
                <input value={draft[k] || ""} onChange={(e) => set(k, e.target.value)} style={inputSt} />
              )
            ) : (
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{valores[k] || "—"}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function EstruturasTab({ projeto, onEditarEstrutura }) {
  const base = projeto.estruturas || MOCK_ESTRUTURAS[projeto.id] || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <EstruturaSecao titulo="Estrutura de venda" icon={DollarSign} campos={CAMPOS_VENDA} valores={base.venda || {}} onSalvar={(v) => onEditarEstrutura?.("venda", v)} />
      <EstruturaSecao titulo="Estrutura de entregável" icon={FolderKanban} campos={CAMPOS_ENTREGAVEL} valores={base.entregavel || {}} onSalvar={(v) => onEditarEstrutura?.("entregavel", v)} />
      <EstruturaSecao titulo="Estrutura de suporte" icon={MessageSquare} campos={CAMPOS_SUPORTE} valores={base.suporte || {}} onSalvar={(v) => onEditarEstrutura?.("suporte", v)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Anúncios/Desempenho
// ─────────────────────────────────────────────────────────────────────────────
function AnunciosTab({ projeto, onRegistrar, naoAtribuidos = [], onAtribuir }) {
  const m = useMobile();
  const CORES = ["#B89C82", "#7FA6A0", "#A6809A"];
  const [utmfyOn, setUtmfyOn] = useState(true);

  const criativos = projeto.criativos || [];
  const totalVendas = criativos.reduce((s, c) => s + (c.vendas || 0), 0);
  const ticket = projeto.faturamento / Math.max(1, totalVendas);
  const roasDe = (vendas, gasto) => (gasto > 0 ? (vendas * ticket) / gasto : 0);

  const ads = useMemo(() =>
    criativos.filter((c) => c.nome && c.nome !== "—").map((c, i) => {
      const gasto = Math.round((projeto.gastoAds || 0) / Math.max(1, criativos.length));
      return { id: "ad-" + projeto.id + "-" + i, nome: c.nome, status: "ATIVO", gasto, vendas: c.vendas, roas: roasDe(c.vendas, gasto), thumbnailUrl: c.thumbnailUrl };
    }), [projeto.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Banner UTMfy */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: utmfyOn ? "rgba(124,92,255,0.10)" : T.surface, border: `1px solid ${utmfyOn ? "rgba(124,92,255,0.3)" : T.border}`,
        borderRadius: 14, padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: utmfyOn ? "#7C5CFF" : T.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Activity size={17} color={utmfyOn ? "#fff" : T.muted} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{utmfyOn ? "UTMfy conectado" : "Conectar UTMfy"}</div>
            <div style={{ fontSize: 12, color: utmfyOn ? "#A78BFA" : T.faint }}>
              {utmfyOn ? "Métricas sincronizadas do gerenciador e do checkout" : "Traga faturamento, gasto, ROAS e vendas para o app."}
            </div>
          </div>
        </div>
        {utmfyOn ? (
          <button onClick={() => setUtmfyOn(false)} style={{ fontSize: 12.5, color: "#A78BFA", border: "1px solid rgba(124,92,255,0.3)", background: "transparent", borderRadius: 9, padding: "7px 12px" }}>
            Desconectar
          </button>
        ) : (
          <button onClick={() => setUtmfyOn(true)} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#fff", border: "none", background: "#7C5CFF", borderRadius: 10, padding: "9px 14px" }}>
            <Activity size={15} /> Conectar
          </button>
        )}
      </div>

      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <Eyebrow>Desempenho por criativo</Eyebrow>
        {!utmfyOn ? (
          <div style={{ textAlign: "center", padding: "26px 0", color: T.faint, fontSize: 13 }}>Conecte o UTMfy para ver o desempenho dos criativos.</div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "26px 0", color: T.faint, fontSize: 13 }}>Sem dados do UTMfy para este projeto ainda.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ads.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 13, border: `1px solid ${T.border}`, borderRadius: 13, padding: "12px 14px" }}>
                <CreativeThumb creative={a} color={CORES[i % CORES.length]} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 12, color: T.faint }}>via UTMfy</div>
                </div>
                {!m && (
                  <div style={{ textAlign: "right", width: 70 }}>
                    <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(a.gasto)}</div>
                    <div style={{ fontSize: 10.5, color: T.faint }}>gasto</div>
                  </div>
                )}
                <div style={{ textAlign: "right", width: 46 }}>
                  <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{a.vendas}</div>
                  <div style={{ fontSize: 10.5, color: T.faint }}>vendas</div>
                </div>
                <div style={{ textAlign: "right", width: 52 }}>
                  <RoasTag roas={a.roas} />
                  <div style={{ fontSize: 10.5, color: T.faint }}>ROAS</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {utmfyOn && naoAtribuidos.length > 0 && (
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <Eyebrow>Campanhas não atribuídas</Eyebrow>
          <p style={{ fontSize: 12.5, color: T.faint, margin: "-6px 0 16px" }}>O UTMfy trouxe estas campanhas sem projeto. Atribua ao projeto correto.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {naoAtribuidos.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 13, border: `1px dashed ${T.border}`, borderRadius: 13, padding: "12px 14px" }}>
                <CreativeThumb creative={a} color={CORES[i % CORES.length]} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 12, color: T.faint }}>via UTMfy · camp. {a.metaCampaignId}</div>
                </div>
                <button onClick={() => onAtribuir?.(a)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "none", background: T.primary, color: "#fff", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
                  <Plus size={14} /> Atribuir
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjetoDetalhe — orquestrador das abas
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjetoDetalhe({
  projeto, aba, setAba, onVoltar, userById, atividade = [],
  onEditarPersona, onEditarOferta, onRegistrar, naoAtribuidos = [], onAtribuir, onEditarEstrutura,
}) {
  return (
    <div>
      <button onClick={onVoltar}
        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent",
          color: T.muted, fontSize: 13, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={15} /> Projetos
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{projeto.nome}</h1>
          <p style={{ color: T.muted, fontSize: 13, margin: "4px 0 0" }}>{projeto.nicho} · {projeto.veiculo}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 26, overflowX: "auto" }}>
        {[
          { id: "resumo", l: "Resumo" },
          { id: "overview", l: "Visão geral" },
          { id: "oferta", l: "Gestão de oferta" },
          { id: "estruturas", l: "Estruturas" },
          { id: "anuncios", l: "Desempenho" },
        ].map((t) => (
          <button key={t.id} onClick={() => setAba(t.id)}
            style={{ border: "none", background: "transparent", padding: "10px 4px", marginRight: 18, whiteSpace: "nowrap",
              fontSize: 13.5, fontWeight: aba === t.id ? 600 : 500, color: aba === t.id ? T.primaryText : T.muted,
              borderBottom: `2px solid ${aba === t.id ? T.primary : "transparent"}`, marginBottom: -1 }}>
            {t.l}
          </button>
        ))}
      </div>

      {aba === "resumo"    && <ResumoTab projeto={projeto} />}
      {aba === "overview"  && <ProjetoOverview projeto={projeto} />}
      {aba === "oferta"    && <GestaoOferta projeto={projeto} userById={userById} atividade={atividade} onEditarPersona={onEditarPersona} onEditarOferta={onEditarOferta} />}
      {aba === "estruturas"&& <EstruturasTab projeto={projeto} onEditarEstrutura={onEditarEstrutura} />}
      {aba === "anuncios"  && <AnunciosTab projeto={projeto} onRegistrar={onRegistrar} naoAtribuidos={naoAtribuidos} onAtribuir={onAtribuir} />}
    </div>
  );
}
