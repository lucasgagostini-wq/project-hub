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
  IconCreditCard as CreditCard,
  IconChartBar as ChartBar,
  IconCopy as Copy,
  IconPlugConnected as PlugConnected,
  IconCircleCheck as CircleCheck,
  IconExternalLink as ExternalLink,
  IconRefresh as Refresh,
  IconDownload as Download,
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
import { sincronizarMetricas } from "../../lib/api/metrics";
import IdeiasProjeto from "../ideas/IdeiasProjeto";

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
// Card de informações da clonagem (Tynk)
// ─────────────────────────────────────────────────────────────────────────────
function TynkInfoCard({ tynk, onGerarSnapshot }) {
  const [snapping, setSnapping] = useState(false);
  const [snapErr, setSnapErr] = useState(null);

  const fmtData = (s) =>
    s ? new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;
  const status = tynk.isPublished
    ? { l: "Publicada", c: T.pos, bg: T.posBg }
    : { l: "Rascunho", c: T.muted, bg: T.hair };

  const Linha = ({ label, valor }) =>
    valor ? (
      <div style={{ display: "flex", gap: 12, padding: "5px 0", borderTop: `1px solid ${T.hair}` }}>
        <div style={{ width: 130, flexShrink: 0, fontSize: 12, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 13, wordBreak: "break-all", lineHeight: 1.4 }}>{valor}</div>
      </div>
    ) : null;

  const Btn = ({ href, children }) =>
    href ? (
      <a href={href} target="_blank" rel="noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
          color: T.primaryText, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "7px 12px", textDecoration: "none" }}>
        <ExternalLink size={13} /> {children}
      </a>
    ) : null;

  const snap = tynk.snapshot;

  const handleGerarSnapshot = async () => {
    if (snapping || !onGerarSnapshot) return;
    setSnapping(true); setSnapErr(null);
    try {
      await onGerarSnapshot();
    } catch (e) {
      setSnapErr(e.message || "Não foi possível gerar o preview.");
    } finally {
      setSnapping(false);
    }
  };

  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Copy size={15} color="#fff" />
        </div>
        <Eyebrow style={{ marginBottom: 0 }}>Página clonada (Tynk)</Eyebrow>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: status.c, background: status.bg, padding: "2px 9px", borderRadius: 6 }}>{status.l}</span>
      </div>
      <div>
        <Linha label="Domínio" valor={tynk.domain} />
        <Linha label="Project ID" valor={tynk.projectId} />
        <Linha label="Criado em" valor={fmtData(tynk.createdAt)} />
        <Linha label="Clonado em" valor={fmtData(tynk.clonadoEm)} />
        <Linha label="Import" valor={tynk.import?.timedOut ? "pendente (importação demorou — verifique no Tynk)" : tynk.import?.importId ? `${tynk.import.success ? "ok" : "falhou"} · ${tynk.import.importId}` : null} />
        <Linha label="Status marketplace" valor={tynk.marketplaceApprovalStatus} />
        <Linha label="Tags" valor={Array.isArray(tynk.tags) && tynk.tags.length ? tynk.tags.join(", ") : null} />
        <Linha label="Página original" valor={tynk.sourceUrl} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
        <Btn href={tynk.pageUrl}>Ver página</Btn>
        <Btn href={tynk.editUrl}>Editar no Tynk</Btn>
        <Btn href={tynk.sourceUrl}>Página original</Btn>

        {/* Preview da oferta — persiste após salvar o projeto */}
        {snap?.previewUrl ? (
          <>
            <a href={snap.previewUrl} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
                color: "#fff", border: "none", background: T.primary, borderRadius: 9, padding: "7px 12px", textDecoration: "none" }}>
              <Eye size={13} /> Ver preview
            </a>
            <a href={snap.downloadUrl}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
                color: T.primaryText, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "7px 12px", textDecoration: "none" }}>
              <Download size={13} /> Baixar .html
            </a>
          </>
        ) : tynk.sourceUrl && onGerarSnapshot ? (
          <button onClick={handleGerarSnapshot} disabled={snapping}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600,
              color: T.primaryText, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "7px 12px",
              cursor: snapping ? "wait" : "pointer", opacity: snapping ? 0.7 : 1 }}>
            <Eye size={13} /> {snapping ? "Gerando preview…" : "Gerar preview da oferta"}
          </button>
        ) : null}
      </div>
      {snapErr && <div style={{ fontSize: 12, color: T.neg, marginTop: 8 }}>{snapErr}</div>}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Resumo
// ─────────────────────────────────────────────────────────────────────────────
function ResumoTab({ projeto, onGerarSnapshot }) {
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

      {projeto.tynk && <TynkInfoCard tynk={projeto.tynk} onGerarSnapshot={onGerarSnapshot} />}

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
// Gasto (UTMFy) × Faturamento (Cakto) — alimentado pelas conexões
// ─────────────────────────────────────────────────────────────────────────────
function ResumoIntegracoes({ projeto, onSyncMetricas, onEditarGasto }) {
  const m = useMobile();
  const cakto = !!projeto.conexoes?.cakto?.conectado;

  const [sinc, setSinc] = useState(false);
  const [erro, setErro] = useState("");
  const [meta, setMeta] = useState(null); // { em, real }
  const [editGasto, setEditGasto] = useState(false);
  const [draftGasto, setDraftGasto] = useState("");

  const faturamento = cakto ? (projeto.faturamento || 0) : null;
  const gasto = projeto.gastoAds || 0;          // entrada manual
  const temGasto = gasto > 0;
  const lucro = faturamento != null && temGasto ? faturamento - gasto : null;
  const roas = faturamento != null && temGasto ? faturamento / gasto : null;
  const maxBar = Math.max(faturamento || 0, gasto || 0, 1);

  const sincronizar = async () => {
    setSinc(true); setErro("");
    try {
      const r = await sincronizarMetricas(projeto);
      const patch = {};
      if (r.faturamento != null) patch.faturamento = r.faturamento;
      if (r.gastoAds != null) patch.gastoAds = r.gastoAds;
      if (r.lucro != null) patch.lucro = r.lucro;
      onSyncMetricas?.(patch);
      setMeta({ em: r.sincronizadoEm, real: r.faturamento != null, escopo: r.escopo });
    } catch (e) {
      setErro(e.message || "Erro ao sincronizar.");
    } finally {
      setSinc(false);
    }
  };

  const salvarGasto = () => {
    const v = Math.max(0, Number(String(draftGasto).replace(",", ".")) || 0);
    onEditarGasto?.(v);
    setEditGasto(false);
  };

  const horaSync = meta?.em
    ? new Date(meta.em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;

  const Metric = ({ label, fonte, valor, indisponivel, pendente, pendenteMsg, cor }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>{label}</div>
      {indisponivel ? (
        <div style={{ fontSize: 13, color: T.faint, marginTop: 6 }}>Conecte {fonte}</div>
      ) : pendente ? (
        <div style={{ fontSize: 12.5, color: T.faint, marginTop: 6, lineHeight: 1.35 }}>{pendenteMsg}</div>
      ) : (
        <>
          <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 4, color: cor || T.ink }}>{valor}</div>
          <div style={{ fontSize: 10.5, color: T.faint, marginTop: 2 }}>via {fonte}</div>
        </>
      )}
    </div>
  );

  const Barra = ({ label, valor, cor }) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: T.muted }}>{label}</span>
        <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(valor || 0)}</span>
      </div>
      <div style={{ height: 8, background: T.hair, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((valor || 0) / maxBar) * 100}%`, background: cor, borderRadius: 5, transition: "width .4s ease" }} />
      </div>
    </div>
  );

  const inputGastoSt = { width: "100%", padding: "6px 9px", borderRadius: 8, border: `1px solid ${T.border}`,
    fontSize: 14, fontFamily: fontBody, outline: "none", background: T.surfaceAlt, color: T.ink };

  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <Eyebrow style={{ marginBottom: 4 }}>Gasto × Faturamento</Eyebrow>
          <div style={{ fontSize: 12.5, color: T.faint }}>
            Faturamento real da Cakto. Informe o gasto de anúncios (visto no UTMfy) manualmente.
          </div>
        </div>
        {cakto && (
          <button onClick={sincronizar} disabled={sinc}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600,
              color: "#fff", border: "none", background: sinc ? T.faint : T.primary, borderRadius: 10,
              padding: "9px 14px", cursor: sinc ? "wait" : "pointer", flexShrink: 0 }}>
            <Refresh size={14} /> {sinc ? "Sincronizando…" : "Sincronizar faturamento"}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
        <Metric label="Faturamento" fonte="Cakto" indisponivel={!cakto} valor={fmtBRL(faturamento || 0)} cor={T.pos} />

        {/* Gasto com anúncios — entrada manual */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>Gasto com anúncios</span>
            {!editGasto && (
              <button onClick={() => { setDraftGasto(temGasto ? String(gasto) : ""); setEditGasto(true); }}
                title="Editar gasto" style={{ border: "none", background: "transparent", color: T.faint, display: "flex", padding: 2 }}>
                <Pencil size={13} />
              </button>
            )}
          </div>
          {editGasto ? (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input autoFocus type="number" min="0" step="0.01" value={draftGasto}
                onChange={(e) => setDraftGasto(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") salvarGasto(); if (e.key === "Escape") setEditGasto(false); }}
                placeholder="0,00" style={inputGastoSt} />
              <button onClick={salvarGasto} title="Salvar"
                style={{ border: "none", background: T.primary, color: "#fff", borderRadius: 8, padding: "0 9px" }}><Check size={14} /></button>
              <button onClick={() => setEditGasto(false)} title="Cancelar"
                style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.muted, borderRadius: 8, padding: "0 9px" }}><X size={14} /></button>
            </div>
          ) : temGasto ? (
            <>
              <div style={{ fontFamily: fontDisplay, fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{fmtBRL(gasto)}</div>
              <div style={{ fontSize: 10.5, color: T.faint, marginTop: 2 }}>manual (UTMfy)</div>
            </>
          ) : (
            <button onClick={() => { setDraftGasto(""); setEditGasto(true); }}
              style={{ marginTop: 8, fontSize: 12.5, color: T.primaryText, fontWeight: 600, border: "none", background: "transparent", padding: 0 }}>
              + Informar gasto
            </button>
          )}
        </div>

        <Metric label="Lucro" fonte="Cakto − gasto" pendente={lucro == null} pendenteMsg="informe o gasto"
          valor={fmtBRL(lucro || 0)} cor={(lucro || 0) >= 0 ? T.pos : T.neg} />
        <Metric label="ROAS" fonte="fat. ÷ gasto" pendente={roas == null} pendenteMsg="informe o gasto"
          valor={roas != null ? `${roas.toFixed(2)}x` : "—"} cor={(roas || 0) >= 1 ? T.pos : T.neg} />
      </div>

      {faturamento != null && temGasto && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
          <Barra label="Faturamento (Cakto)" valor={faturamento} cor={T.pos} />
          <Barra label="Gasto em anúncios" valor={gasto} cor={T.primary} />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 11.5, color: T.faint, flexWrap: "wrap" }}>
        {!cakto && <span>Conecte a Cakto na aba <b style={{ color: T.muted }}>Conexões</b> para puxar o faturamento.</span>}
        {horaSync && <span>Faturamento sincronizado {horaSync}</span>}
        {meta?.real && (
          <span style={{ color: T.pos, background: T.posBg, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
            faturamento real (Cakto)
          </span>
        )}
        {meta?.escopo === "sem-produtos" && (
          <span style={{ color: T.warn, background: T.warnBg, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
            mapeie os produtos da Cakto na aba Conexões para separar o faturamento deste projeto
          </span>
        )}
        {erro && <span style={{ color: T.neg }}>{erro}</span>}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Aba Anúncios/Desempenho
// ─────────────────────────────────────────────────────────────────────────────
function AnunciosTab({ projeto, onRegistrar, naoAtribuidos = [], onAtribuir, onSyncMetricas, onEditarGasto }) {
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
      <ResumoIntegracoes projeto={projeto} onSyncMetricas={onSyncMetricas} onEditarGasto={onEditarGasto} />

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
// Aba Conexões — integrações de API (Cakto, UTMFy)
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE: nenhum segredo é coletado nem guardado aqui. Os secrets (client_secret,
// webhook secret, tokens) vivem só no servidor, em variáveis de ambiente. Esta aba só
// liga a integração e guarda config não-sensível (ex.: quais produtos são deste projeto).
const PROVEDORES = [
  {
    key: "cakto",
    nome: "Cakto",
    tipo: "Gateway de pagamento",
    desc: "Sincroniza vendas, faturamento e reembolsos direto do checkout.",
    icon: CreditCard,
    cor: "#0EA56A",
    site: "https://cakto.com.br",
    obrigatorios: [],
    campos: [
      { k: "produtos", label: "Produtos da Cakto (IDs)", placeholder: "ex.: prod_123, abc12, offer_789 — separados por vírgula",
        hint: "É o que separa o faturamento por projeto. Aceita product.id, product.short_id ou offer.id. Em produção o mesmo vínculo vem da tabela gateway_products (preenchida pelo webhook)." },
    ],
    webhookPath: "/api/cakto-webhook",
    notaServidor: "As credenciais (CAKTO_CLIENT_ID, CAKTO_CLIENT_SECRET e CAKTO_WEBHOOK_SECRET) ficam só no servidor, em variáveis de ambiente — nunca são digitadas nem guardadas aqui.",
  },
  {
    key: "utmfy",
    nome: "UTMFy",
    tipo: "Métricas de anúncios",
    desc: "Recebe as vendas da Cakto. O gasto de anúncios é informado manualmente.",
    icon: ChartBar,
    cor: "#7C5CFF",
    site: "https://utmify.com.br",
    obrigatorios: [],
    campos: [],
    notaServidor: "O token do UTMfy (UTMFY_API_TOKEN) fica só no servidor. O UTMfy não expõe API pública de leitura de gasto — por isso o gasto é informado manualmente na aba Desempenho.",
  },
];

// Campo de configuração NÃO-sensível (ex.: lista de produtos). Segredos não passam por aqui.
function CampoConfig({ campo, valor, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>{campo.label}</div>
      <input
        type="text"
        value={valor || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={campo.placeholder}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10,
          border: `1px solid ${T.border}`, fontSize: 13, fontFamily: fontBody, outline: "none",
          background: T.surfaceAlt, color: T.ink }}
      />
      {campo.hint && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 5, lineHeight: 1.4 }}>{campo.hint}</div>}
    </div>
  );
}

function IntegracaoCard({ prov, valores, onConectar, onDesconectar }) {
  const [draft, setDraft] = useState(valores || {});
  const [copiado, setCopiado] = useState(false);
  const Icon = prov.icon;
  const conectado = !!valores?.conectado;
  const webhookUrl = prov.webhookPath
    ? (typeof window !== "undefined" ? window.location.origin : "") + prov.webhookPath
    : null;

  const faltando = prov.obrigatorios.filter((k) => !(draft[k] || "").trim());
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const copiar = () => {
    if (!webhookUrl) return;
    navigator.clipboard?.writeText(webhookUrl).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    });
  };

  return (
    <section style={{ background: T.surface, border: `1px solid ${conectado ? "rgba(52,199,89,0.45)" : T.border}`,
      borderRadius: 18, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: prov.cor, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 600 }}>{prov.nome}</span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: T.muted,
              background: T.hair, padding: "2px 8px", borderRadius: 6 }}>{prov.tipo}</span>
            {conectado ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600,
                color: T.pos, background: T.posBg, padding: "2px 9px", borderRadius: 6 }}>
                <CircleCheck size={13} /> Conectado
              </span>
            ) : (
              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.muted, background: T.hair,
                padding: "2px 9px", borderRadius: 6 }}>Não conectado</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: T.muted, margin: "5px 0 0", lineHeight: 1.45 }}>{prov.desc}</p>
        </div>
      </div>

      {prov.campos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {prov.campos.map((c) => (
            <CampoConfig key={c.k} campo={c} valor={draft[c.k]} onChange={(v) => set(c.k, v)} />
          ))}
        </div>
      )}

      {prov.notaServidor && (
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: prov.campos.length > 0 ? 14 : 0,
          background: T.hair, borderRadius: 10, padding: "10px 12px" }}>
          <span style={{ fontSize: 14, lineHeight: 1.2, flexShrink: 0 }}>🔒</span>
          <p style={{ fontSize: 11.5, color: T.muted, margin: 0, lineHeight: 1.45 }}>{prov.notaServidor}</p>
        </div>
      )}

      {webhookUrl && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>
            URL do webhook <span style={{ color: T.faint, fontWeight: 400 }}>(cole no painel da Cakto)</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={webhookUrl}
              style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
                fontSize: 12.5, fontFamily: fontBody, background: T.hair, color: T.muted, outline: "none" }} />
            <button onClick={copiar}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", borderRadius: 10,
                border: `1px solid ${T.border}`, background: T.surface, color: copiado ? T.pos : T.ink,
                fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>
              {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        marginTop: 18, flexWrap: "wrap" }}>
        <a href={prov.site} target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.muted, textDecoration: "none" }}>
          <ExternalLink size={13} /> Onde encontrar minhas chaves
        </a>
        <div style={{ display: "flex", gap: 8 }}>
          {conectado && (
            <button onClick={onDesconectar}
              style={{ fontSize: 12.5, fontWeight: 600, color: T.neg, border: `1px solid ${T.border}`,
                background: T.surface, borderRadius: 10, padding: "9px 14px" }}>
              Desconectar
            </button>
          )}
          <button onClick={() => onConectar(draft)} disabled={faltando.length > 0}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600,
              color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px",
              background: faltando.length > 0 ? T.faint : T.primary,
              cursor: faltando.length > 0 ? "not-allowed" : "pointer" }}>
            <PlugConnected size={15} /> {conectado ? "Salvar alterações" : "Salvar e conectar"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ConexoesTab({ projeto, onSalvar }) {
  const conexoes = projeto.conexoes || {};

  const salvarProvedor = (prov, dados) => {
    const novo = { ...conexoes, [prov.key]: { ...dados, conectado: true, em: new Date().toISOString() } };
    onSalvar?.(novo, `conectou o ${prov.nome}`);
  };
  const desconectarProvedor = (prov) => {
    const novo = { ...conexoes, [prov.key]: { ...(conexoes[prov.key] || {}), conectado: false } };
    onSalvar?.(novo, `desconectou o ${prov.nome}`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: T.primaryBg,
        border: `1px solid ${T.border}`, borderRadius: 14, padding: "13px 16px" }}>
        <PlugConnected size={18} color={T.primary} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12.5, color: T.muted, margin: 0, lineHeight: 1.5 }}>
          Conecte as APIs deste projeto. Os segredos (client secret, webhook secret, tokens) ficam só no
          servidor, em variáveis de ambiente — aqui você apenas liga a integração e mapeia os produtos.
          Em produção, o faturamento por projeto é calculado no Supabase a partir do webhook da Cakto.
        </p>
      </div>

      {PROVEDORES.map((prov) => (
        <IntegracaoCard
          key={prov.key}
          prov={prov}
          valores={conexoes[prov.key]}
          onConectar={(dados) => salvarProvedor(prov, dados)}
          onDesconectar={() => desconectarProvedor(prov)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProjetoDetalhe — orquestrador das abas
// ─────────────────────────────────────────────────────────────────────────────
export default function ProjetoDetalhe({
  projeto, aba, setAba, onVoltar, userById, atividade = [],
  onEditarPersona, onEditarOferta, onRegistrar, naoAtribuidos = [], onAtribuir, onEditarEstrutura,
  onEditarConexoes, onSyncMetricas, onEditarGasto, onEditarIdeias, onGerarSnapshot,
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
          { id: "ideias", l: "Ideias" },
          { id: "anuncios", l: "Desempenho" },
          { id: "conexoes", l: "Conexões" },
        ].map((t) => (
          <button key={t.id} onClick={() => setAba(t.id)}
            style={{ border: "none", background: "transparent", padding: "10px 4px", marginRight: 18, whiteSpace: "nowrap",
              fontSize: 13.5, fontWeight: aba === t.id ? 600 : 500, color: aba === t.id ? T.primaryText : T.muted,
              borderBottom: `2px solid ${aba === t.id ? T.primary : "transparent"}`, marginBottom: -1 }}>
            {t.l}
          </button>
        ))}
      </div>

      {aba === "resumo"    && <ResumoTab projeto={projeto} onGerarSnapshot={onGerarSnapshot} />}
      {aba === "overview"  && <ProjetoOverview projeto={projeto} />}
      {aba === "oferta"    && <GestaoOferta projeto={projeto} userById={userById} atividade={atividade} onEditarPersona={onEditarPersona} onEditarOferta={onEditarOferta} />}
      {aba === "estruturas"&& <EstruturasTab projeto={projeto} onEditarEstrutura={onEditarEstrutura} />}
      {aba === "ideias"    && <IdeiasProjeto projeto={projeto} onSalvar={onEditarIdeias} />}
      {aba === "anuncios"  && <AnunciosTab projeto={projeto} onRegistrar={onRegistrar} naoAtribuidos={naoAtribuidos} onAtribuir={onAtribuir} onSyncMetricas={onSyncMetricas} onEditarGasto={onEditarGasto} />}
      {aba === "conexoes"  && <ConexoesTab projeto={projeto} onSalvar={onEditarConexoes} />}
    </div>
  );
}
