export const T = {
  bg: "#0D1117",
  surface: "#111827",
  surfaceAlt: "#1A2333",
  ink: "#F1F5F9",
  muted: "#94A3B8",
  faint: "#64748B",
  border: "#1E2A3A",
  hair: "#162032",
  pos: "#10B981",
  posBg: "rgba(16,185,129,0.12)",
  neg: "#EF4444",
  negBg: "rgba(239,68,68,0.12)",
  warn: "#F59E0B",
  warnBg: "rgba(245,158,11,0.12)",
  primary: "#3B82F6",
  primaryBg: "rgba(59,130,246,0.10)",
  primaryText: "#60A5FA",
};

export const fontDisplay = "'Space Grotesk', ui-sans-serif, system-ui";
export const fontBody = "'Inter', ui-sans-serif, system-ui";

export const fmtBRL = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLc = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; background: ${T.bg}; }
  button { cursor: pointer; font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1E2A3A; border-radius: 6px; }
  ::-webkit-scrollbar-thumb:hover { background: #2D3E55; }
  .grid-bg {
    background-color: #0D1117;
    background-image:
      linear-gradient(rgba(59,130,246,0.10) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.10) 1px, transparent 1px),
      linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
    background-size: 64px 64px, 64px 64px, 16px 16px, 16px 16px;
    animation: gridDrift 35s linear infinite;
  }
  @keyframes gridDrift {
    0%   { background-position: 0 0, 0 0, 0 0, 0 0; }
    100% { background-position: 0 64px, 0 64px, 0 16px, 0 16px; }
  }
`;
