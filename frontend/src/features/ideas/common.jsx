import React from "react";
import { T, fontBody } from "../../lib/theme";

// Estágios de uma ideia (do brainstorm ao teste/descarte).
export const STATUS_IDEIA = [
  { id: "ideia",      l: "Ideia" },
  { id: "avaliando",  l: "Avaliando" },
  { id: "aprovada",   l: "Aprovada" },
  { id: "testando",   l: "Testando" },
  { id: "descartada", l: "Descartada" },
];

// Cor lida do T no momento do render (T é mutável p/ tema claro/escuro).
export function corStatus(id) {
  switch (id) {
    case "aprovada":   return { c: T.pos, bg: T.posBg };
    case "testando":   return { c: T.primaryText, bg: T.primaryBg };
    case "avaliando":  return { c: T.warn, bg: T.warnBg };
    case "descartada": return { c: T.faint, bg: T.hair };
    default:           return { c: T.muted, bg: T.hair };
  }
}

// Dropdown de status reutilizável.
export function StatusSelect({ value, onChange }) {
  const s = corStatus(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: "none", cursor: "pointer", fontFamily: fontBody,
        fontSize: 11.5, fontWeight: 600, color: s.c, background: s.bg,
        border: "none", borderRadius: 6, padding: "3px 9px",
      }}
    >
      {STATUS_IDEIA.map((o) => (
        <option key={o.id} value={o.id} style={{ color: T.ink, background: T.surface }}>{o.l}</option>
      ))}
    </select>
  );
}

// Função (não constante) p/ ler o T no render e refletir o tema atual.
export const inputIdeiaSt = () => ({
  width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.border}`,
  fontSize: 13, fontFamily: fontBody, outline: "none", background: T.surfaceAlt, color: T.ink,
});
