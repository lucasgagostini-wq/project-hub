import React from "react";
import { T, fontDisplay, fontBody } from "../lib/theme";

// Error boundary de topo: captura erros de render em qualquer componente filho e mostra
// uma tela amigável em vez da página em branco (o que o React faz por padrão quando um
// erro de render escapa). Boundaries precisam ser class components — não há equivalente
// em hooks. Envolve o <App/> em main.jsx.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Em produção, o ideal é enviar a um serviço de monitoramento (Sentry, etc.).
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: fontBody, background: T.bg, color: T.ink,
      }}>
        <div style={{
          maxWidth: 440, width: "100%", textAlign: "center", background: T.surface,
          border: `1px solid ${T.border}`, borderRadius: 18, padding: 32,
          boxShadow: "0 24px 80px rgba(0,0,0,0.12)",
        }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>⚠️</div>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            Algo deu errado
          </h1>
          <p style={{ color: T.muted, fontSize: 13.5, margin: "0 0 20px", lineHeight: 1.5 }}>
            Encontramos um erro inesperado nesta tela. Você pode tentar de novo ou recarregar a página.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={this.handleReset} style={{
              padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`,
              background: T.surface, color: T.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            }}>
              Tentar de novo
            </button>
            <button onClick={() => window.location.reload()} style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: T.primary, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            }}>
              Recarregar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
