// ─────────────────────────────────────────────────────────────────────────────
// Tema com dois modos (claro / escuro).
//
// `T` é um objeto MUTÁVEL compartilhado por referência em todo o app (os inline
// styles leem T.bg, T.surface, ... no render). Alternar o tema = sobrescrever as
// propriedades de `T` (applyTheme) e forçar um re-render no App. Assim não é
// preciso refatorar centenas de usos de `T`.
// ─────────────────────────────────────────────────────────────────────────────

const LIGHT = {
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

const DARK = {
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

export const PALETTES = { light: LIGHT, dark: DARK };
const THEME_KEY = "ph_theme";

// Objeto de tema "vivo" — começa no claro e é sobrescrito por applyTheme().
export const T = { ...LIGHT };

export function getThemeMode() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "light" ? v : "light";
  } catch {
    return "light";
  }
}

// Sobrescreve T com a paleta do modo, persiste e ajusta o fundo/cor do body.
export function applyTheme(mode) {
  const m = mode === "dark" ? "dark" : "light";
  Object.assign(T, PALETTES[m]);
  try {
    localStorage.setItem(THEME_KEY, m);
  } catch {
    /* localStorage indisponível — ignora */
  }
  if (typeof document !== "undefined" && document.body) {
    document.documentElement.style.colorScheme = m;
    document.body.style.background = T.bg;
    document.body.style.color = T.ink;
  }
  return m;
}

// Aplica o tema salvo já no load do módulo (antes do React renderizar) — sem flash.
applyTheme(getThemeMode());

export const fontDisplay =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', system-ui, sans-serif";
export const fontBody =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', system-ui, sans-serif";

// Aceita number | string | null/undefined sem quebrar (n.toLocaleString quebraria em null,
// e em produção valores como faturamento podem vir nulos).
export const fmtBRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLc = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Estilo global — gerado a partir do T atual (chamar no render p/ refletir o tema).
export function buildGlobalStyle() {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; background: ${T.bg}; }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    color: ${T.ink};
    transition: background-color .2s ease, color .2s ease;
  }
  button { cursor: pointer; font-family: inherit; }
  /* Foco visível por teclado (a11y). !important nos campos vence o outline:none inline. */
  :focus-visible { outline: 2px solid ${T.primary}; outline-offset: 2px; border-radius: 4px; }
  input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${T.primary} !important; outline-offset: 1px; }
  /* Respeita usuários que pedem menos animação (vestibular/acessibilidade). */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .001ms !important; animation-iteration-count: 1 !important;
      transition-duration: .001ms !important; scroll-behavior: auto !important;
    }
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 8px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.faint}; }
  .grid-bg {
    background-color: ${T.bg};
    background-image: radial-gradient(120% 90% at 50% -10%, ${T.surface} 0%, ${T.bg} 60%);
    background-attachment: fixed;
  }
`;
}
