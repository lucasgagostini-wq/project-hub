import React, { useState, useEffect, useRef } from "react";

const ETAPAS = [
  {
    label: "criando projeto no Tynk",
    subs: ["reservando o domínio…"],
    dur: 1500,
  },
  {
    label: "importando a página",
    subs: [
      "lendo o HTML…",
      "seguindo redirecionamentos…",
      "esperando o Tynk processar…",
      "isso pode levar um tempinho…",
    ],
    dur: 22000,
  },
  {
    label: "extraindo a oferta com IA",
    subs: ["lendo a copy…", "achando público e preço…", "montando a persona…"],
    dur: null, // mantém até cloning virar false
  },
  {
    label: "capturando a preview",
    subs: ["embutindo o CSS…", "baixando as imagens…", "empacotando o .html…"],
    dur: null, // mantém até snapping virar false
  },
];

const C = {
  bg: "#0D1117",
  border: "#2A2F37",
  header: "#161B22",
  text: "#C9D1D9",
  url: "#58A6FF",
  ok: "#3FB950",
  spinner: "#D29922",
  muted: "#8B949E",
  err: "#F85149",
  dot1: "#FF5F56",
  dot2: "#FFBD2E",
  dot3: "#27C93F",
};

function useBlinkCursor(active) {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    if (!active) { setVis(true); return; }
    const t = setInterval(() => setVis((v) => !v), 530);
    return () => clearInterval(t);
  }, [active]);
  return vis;
}

export default function CloneProgress({ cloning, snapping, done, error, sourceUrl }) {
  // etapa ativa (0-3), quantas estão concluídas
  const [etapaAtiva, setEtapaAtiva] = useState(0);
  const [concluidas, setConcluidas] = useState(0);
  const [subIdx, setSubIdx] = useState(0);

  const timerRef = useRef(null);
  const subTimerRef = useRef(null);
  const cursor = useBlinkCursor(!done && !error);

  // Avança etapas internas enquanto cloning=true
  useEffect(() => {
    if (!cloning) return;
    // Reseta ao iniciar
    setEtapaAtiva(0); setConcluidas(0); setSubIdx(0);

    // Etapa 0 → 1 após 1500ms
    timerRef.current = setTimeout(() => {
      setConcluidas(1); setEtapaAtiva(1); setSubIdx(0);
      // Etapa 1 → 2 após 22000ms (se clone ainda não resolveu)
      timerRef.current = setTimeout(() => {
        setConcluidas(2); setEtapaAtiva(2); setSubIdx(0);
      }, 22000);
    }, 1500);

    return () => clearTimeout(timerRef.current);
  }, [cloning]);

  // Quando clone termina e começa snapshot
  useEffect(() => {
    if (!snapping) return;
    clearTimeout(timerRef.current);
    setConcluidas(3); setEtapaAtiva(3); setSubIdx(0);
  }, [snapping]);

  // Quando done
  useEffect(() => {
    if (!done) return;
    clearTimeout(timerRef.current);
    setConcluidas(4); setEtapaAtiva(-1);
  }, [done]);

  // Rotaciona sub-mensagem da etapa ativa
  useEffect(() => {
    if (done || error || etapaAtiva < 0) return;
    const subs = ETAPAS[etapaAtiva]?.subs || [];
    if (subs.length <= 1) return;
    subTimerRef.current = setInterval(() => {
      setSubIdx((i) => (i + 1) % subs.length);
    }, 900);
    return () => clearInterval(subTimerRef.current);
  }, [etapaAtiva, done, error]);

  // Reset subIdx ao mudar de etapa
  useEffect(() => { setSubIdx(0); }, [etapaAtiva]);

  const barra = "[" + "█".repeat(concluidas) + "░".repeat(4 - concluidas) + "] " + concluidas + "/4";

  const urlDisplay = sourceUrl
    ? sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 50)
    : "…";

  return (
    <div style={{
      fontFamily: "'Fira Mono', 'Cascadia Code', 'Consolas', 'Monaco', monospace",
      fontSize: 12.5,
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      overflow: "hidden",
      userSelect: "none",
    }}>
      {/* Header — traffic-light dots */}
      <div style={{
        background: C.header,
        borderBottom: `1px solid ${C.border}`,
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.dot1 }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.dot2 }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.dot3 }} />
        </div>
        <span style={{ color: C.muted, fontSize: 11.5, marginLeft: 4 }}>project-hub — clonar oferta</span>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Comando */}
        <div>
          <span style={{ color: C.ok }}>$ </span>
          <span style={{ color: C.text }}>clonar </span>
          <span style={{ color: C.url }}>{urlDisplay}</span>
        </div>

        {/* Linha de separação */}
        <div style={{ color: C.border, marginBottom: 2 }}>{"─".repeat(44)}</div>

        {/* Etapas */}
        {ETAPAS.map((etapa, i) => {
          const feita = i < concluidas;
          const ativa = i === etapaAtiva && !done && !error;
          const sub = ativa ? (etapa.subs[subIdx % etapa.subs.length] || "") : "";

          return (
            <div key={i} aria-live={ativa ? "polite" : undefined} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: feita ? C.ok : ativa ? C.spinner : C.border,
                  fontSize: ativa ? 14 : 13,
                }}>
                  {feita ? "✓" : ativa ? <SpinnerChar /> : "○"}
                </span>
                <span style={{
                  color: feita ? C.ok : ativa ? C.text : C.muted,
                  fontWeight: ativa ? 600 : 400,
                }}>
                  {etapa.label}
                </span>
              </div>
              {ativa && sub && (
                <div style={{ paddingLeft: 22, color: C.muted, fontSize: 11.5 }}>
                  {sub}
                </div>
              )}
            </div>
          );
        })}

        {/* Erro */}
        {error && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 4, color: C.err }}>
            <span>✗</span>
            <span style={{ fontSize: 12 }}>{error}</span>
          </div>
        )}

        {/* Linha final quando done */}
        {done && (
          <div style={{ color: C.ok, marginTop: 4, fontWeight: 600 }}>
            ✓ preview pronta — clique em <span style={{ color: C.url }}>Ver preview</span>
          </div>
        )}

        {/* Barra de progresso */}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: concluidas === 4 ? C.ok : C.spinner }}>{barra}</span>
          {!done && !error && (
            <span style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: cursor ? C.ok : "transparent",
              verticalAlign: "middle",
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// Spinner animado via CSS-in-JS simples (troca frame a cada 120ms)
const SPIN_FRAMES = ["|", "/", "—", "\\"];
function SpinnerChar() {
  const [f, setF] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setF((i) => (i + 1) % SPIN_FRAMES.length), 120);
    return () => clearInterval(t);
  }, []);
  return <span style={{ color: "#D29922" }}>{SPIN_FRAMES[f]}</span>;
}
