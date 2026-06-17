export const T = {
  bg: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFAFA",
  ink: "#1D1D1F",
  muted: "#6E6E73",
  faint: "#A1A1A6",
  border: "#E5E5EA",
  hair: "#F0F0F2",
  pos: "#34C759",
  posBg: "rgba(52,199,89,0.12)",
  neg: "#FF3B30",
  negBg: "rgba(255,59,48,0.12)",
  warn: "#FF9F0A",
  warnBg: "rgba(255,159,10,0.12)",
  primary: "#0071E3",
  primaryBg: "rgba(0,113,227,0.10)",
  primaryText: "#0066CC",
};

export const fontDisplay =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif";
export const fontBody =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', system-ui, sans-serif";

export const fmtBRL = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLc = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; background: ${T.bg}; }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    color: ${T.ink};
  }
  button { cursor: pointer; font-family: inherit; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D2D2D7; border-radius: 8px; }
  ::-webkit-scrollbar-thumb:hover { background: #B0B0B5; }
  .grid-bg {
    background-color: ${T.bg};
    background-image: radial-gradient(120% 90% at 50% -10%, #FFFFFF 0%, ${T.bg} 60%);
    background-attachment: fixed;
  }
`;
