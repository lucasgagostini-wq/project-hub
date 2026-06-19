import React from "react";
import {
  IconTrendingUp as TrendingUp,
  IconTrendingDown as TrendingDown,
  IconPlayerPlay as Play,
  IconPhoto as ImageIcon,
} from "@tabler/icons-react";
import { T, fontDisplay, fontBody } from "../lib/theme";

export function Avatar({ user, size = 30 }) {
  if (!user) return null;
  const foto = user.avatar || user.avatar_url;
  if (foto) {
    return (
      <img
        src={foto}
        alt={user.nome || user.name || ""}
        title={user.nome || user.name}
        style={{ width: size, height: size, borderRadius: 999, objectFit: "cover", flexShrink: 0, display: "block" }}
      />
    );
  }
  return (
    <div
      title={user.nome || user.name}
      style={{
        width: size, height: size, borderRadius: 999, background: user.cor || user.color || T.faint,
        color: "#fff", fontSize: size * 0.38, fontWeight: 600, fontFamily: fontDisplay,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {user.inicial || user.initial || (user.nome || user.name || "?").slice(0, 2)}
    </div>
  );
}

export function Delta({ value, suffix = "" }) {
  const up = value >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12.5,
      fontWeight: 600, fontFamily: fontDisplay,
      color: up ? T.pos : T.neg, background: up ? T.posBg : T.negBg,
      padding: "2px 7px", borderRadius: 6,
    }}>
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {up ? "+" : ""}{value}{suffix}
    </span>
  );
}

export function Kpi({ label, value, hint, delta, icon: Icon, accent }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, color: T.muted, letterSpacing: 0.2, fontWeight: 500 }}>{label}</span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent || T.hair, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={15} color={accent ? "#fff" : T.muted} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 27, fontWeight: 600, color: T.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {delta !== undefined && <Delta value={delta} suffix="%" />}
        {hint && <span style={{ fontSize: 12, color: T.faint }}>{hint}</span>}
      </div>
    </div>
  );
}

export function Eyebrow({ children, style }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: T.faint, fontFamily: fontDisplay, marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

export function PageHeader({ titulo, sub, acao }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
      <div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 25, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{titulo}</h1>
        {sub && <p style={{ color: T.muted, fontSize: 13.5, margin: "5px 0 0" }}>{sub}</p>}
      </div>
      {acao}
    </div>
  );
}

export function LinhaInfo({ label, valor }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{valor || "—"}</div>
    </div>
  );
}

export function MiniStat({ label, value, sub }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function MiniEstrutura({ icon: Icon, titulo, linhas }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={15} color={T.ink} />
        <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 13.5 }}>{titulo}</span>
      </div>
      {linhas.map(([l, v], i) => (
        <div key={i} style={{ marginBottom: i < linhas.length - 1 ? 9 : 0 }}>
          <div style={{ fontSize: 11, color: T.faint }}>{l}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.35 }}>{v || "—"}</div>
        </div>
      ))}
    </div>
  );
}

export function Campo({ label, valor, icon: Icon, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={13} color={T.faint} />}{label}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{valor}</div>
    </div>
  );
}

export function CreativeThumb({ creative, color, size = 44 }) {
  const url = creative.thumbnailUrl || creative.thumb || null;
  const isVideo = /vsl|reel|v[ií]deo/i.test(creative.nome || creative.name || "");
  return (
    <div style={{
      position: "relative", width: size, height: size, borderRadius: 10, overflow: "hidden",
      flexShrink: 0, border: `1px solid ${T.border}`,
      background: url ? "#000" : `linear-gradient(135deg, ${color}, ${T.ink})`,
    }}>
      {url ? (
        <img src={url} alt={creative.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isVideo ? <Play size={15} color="#fff" fill="#fff" /> : <ImageIcon size={15} color="#fff" />}
        </div>
      )}
      {url && isVideo && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.22)" }}>
          <Play size={14} color="#fff" fill="#fff" />
        </div>
      )}
    </div>
  );
}

export function ChipFiltro({ ativo, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 500,
      border: `1px solid ${ativo ? T.primary : T.border}`, background: ativo ? T.primaryBg : T.surface,
      color: ativo ? T.primaryText : T.muted,
    }}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ATIVO: { l: "Ativo", c: T.pos, bg: T.posBg },
    EM_REVISAO: { l: "Em revisão", c: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    PAUSADO: { l: "Pausado", c: T.muted, bg: T.hair },
  };
  const s = map[status] || map.PAUSADO;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, color: s.c, background: s.bg, padding: "2px 9px", borderRadius: 6 }}>{s.l}</span>
  );
}

export function RoasTag({ roas }) {
  // roas pode vir null/undefined/NaN (ex.: em produção o gasto de anúncios não tem
  // API de leitura, então lucro/ROAS ficam nulos). Sem a guarda, `roas.toFixed` quebra
  // ou renderiza "NaNx". Mostramos "—" quando não há valor calculável.
  if (!Number.isFinite(roas)) {
    return (
      <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, color: T.faint }}>—</span>
    );
  }
  const bom = roas >= 1;
  return (
    <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums", color: bom ? T.pos : T.neg }}>
      {roas.toFixed(1)}x
    </span>
  );
}
