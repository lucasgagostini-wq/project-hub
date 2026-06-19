import React, { useRef } from "react";
import {
  IconCurrencyDollar as DollarSign,
  IconLayoutKanban as FolderKanban,
  IconTrophy as Trophy,
  IconSpeakerphone as Megaphone,
  IconClock as Clock,
  IconCamera as Camera,
  IconPhoto as ImageIcon,
  IconChevronRight as ChevronRight,
} from "../../lib/icons";
import { T, fontDisplay, fontBody, fmtBRL } from "../../lib/theme";
import { Kpi, Eyebrow, Delta } from "../../components";
import { useMobile } from "../../lib/context";
import { PageHeader } from "../../components";
import { resizeImageToDataURL } from "../../lib/image";

function CardProjeto({ p, onAbrir, onSetImagem }) {
  const margem = p.faturamento ? Math.round((p.lucro / p.faturamento) * 100) : 0;
  const fileRef = useRef(null);
  const escolherImagem = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Redimensiona antes de salvar — evita guardar base64 de vários MB no estado/Storage.
      const dataUrl = await resizeImageToDataURL(file, 600, 0.82);
      onSetImagem?.(p.id, dataUrl);
    } catch { /* leitura inválida — ignora */ }
    finally { e.target.value = ""; } // permite re-selecionar o mesmo arquivo
  };
  return (
    <div onClick={() => onAbrir(p.id)}
      style={{ cursor: "pointer", textAlign: "left", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 116, background: p.imagem ? "#000" : T.bg, borderBottom: `1px solid ${T.hair}` }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={escolherImagem} style={{ display: "none" }} />
        {p.imagem ? (
          <img src={p.imagem} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            style={{ width: "100%", height: "100%", border: "none", background: "transparent", color: T.faint,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
            <ImageIcon size={20} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Adicionar imagem</span>
          </button>
        )}
        {p.imagem && (
          <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} title="Trocar imagem"
            style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, border: "none",
              background: "rgba(24,24,27,.55)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={14} />
          </button>
        )}
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{p.nome}</div>
            <span style={{ fontSize: 11.5, color: T.muted, background: T.hair, padding: "2px 8px", borderRadius: 6 }}>{p.nicho}</span>
          </div>
          <ChevronRight size={18} color={T.faint} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11.5, color: T.faint }}>Faturamento</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(p.faturamento)}</div>
          </div>
          <Delta value={margem} suffix="%" />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, color: T.muted, borderTop: `1px solid ${T.hair}`, paddingTop: 11 }}>
          <Megaphone size={13} /> {p.veiculo} <span style={{ color: T.faint }}>·</span> <Clock size={13} /> {p.tempoOnline}d no ar
        </div>
      </div>
    </div>
  );
}

export default function HomeGeral({ projetos, onAbrir, onSetImagem }) {
  const m = useMobile();
  const ativos = projetos.filter((p) => p.ativo !== false);
  const fatTotal = ativos.reduce((s, p) => s + (p.faturamento || 0), 0);
  const destaque = [...ativos].sort((a, b) => (b.fatSemana || 0) - (a.fatSemana || 0))[0];

  return (
    <div>
      <PageHeader titulo="Início" sub="Visão geral de todos os projetos ativos." />

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        <Kpi label="Faturamento total" value={fmtBRL(fatTotal)} icon={DollarSign} accent={T.ink} delta={12} hint="vs. mês anterior" />
        <Kpi label="Projetos ativos" value={ativos.length} icon={FolderKanban} hint="em operação agora" />
        {destaque && (
          <div onClick={() => onAbrir(destaque.id)} style={{ cursor: "pointer" }}>
            <div style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)", color: "#fff", borderRadius: 16, padding: "18px 20px", height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12.5, color: "#C9C7C0", fontWeight: 500 }}>Projeto destaque da semana</span>
                <Trophy size={16} color="#E7C04A" />
              </div>
              <div style={{ fontFamily: fontDisplay, fontSize: 21, fontWeight: 600, lineHeight: 1.1 }}>{destaque.nome}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: fontDisplay, fontSize: 14, color: "#E7C04A", fontWeight: 600 }}>{fmtBRL(destaque.fatSemana || 0)}</span>
                <span style={{ fontSize: 12, color: "#9C9A94" }}>esta semana</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Eyebrow>Projetos</Eyebrow>
      {ativos.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: T.faint, fontSize: 14 }}>
          Nenhum projeto ativo ainda.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {ativos.map((p) => <CardProjeto key={p.id} p={p} onAbrir={onAbrir} onSetImagem={onSetImagem} />)}
        </div>
      )}
    </div>
  );
}

export { CardProjeto };
