import React, { useState, useRef } from "react";
import { IconX as X, IconCamera as Camera } from "@tabler/icons-react";
import { T, fontDisplay, fontBody } from "../../lib/theme";
import { Avatar } from "../../components";
import { useEscape } from "../../lib/hooks/useDismissable";
import { resizeImageToDataURL } from "../../lib/image";

const CORES = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1"];

function inicialDe(nome) {
  const parts = (nome || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0][0] || "";
  const b = parts.length > 1 ? parts[1][0] : (parts[0][1] || "");
  return (a + b).toUpperCase() || "?";
}

export default function MeuPerfil({ perfil, onSalvar, onFechar }) {
  const [nome, setNome] = useState(perfil?.nome || perfil?.name || "");
  const [cor, setCor] = useState(perfil?.cor || perfil?.color || CORES[0]);
  const [avatar, setAvatar] = useState(perfil?.avatar || perfil?.avatar_url || null);
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef();
  useEscape(true, onFechar); // Esc fecha o modal (o backdrop já fecha no clique)

  const escolherFoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setAvatar(await resizeImageToDataURL(f)); } catch { /* ignora */ }
    finally { e.target.value = ""; } // permite re-selecionar o mesmo arquivo
  };

  const salvar = async () => {
    if (salvando || !nome.trim()) return;
    setSalvando(true);
    // try/finally garante que o botão sai de "Salvando…" mesmo se onSalvar rejeitar
    // (antes, um erro deixava o botão travado para sempre).
    try {
      await onSalvar?.({ nome: nome.trim(), cor, avatar, inicial: inicialDe(nome) });
    } finally {
      setSalvando(false);
    }
  };

  const preview = { nome, name: nome, cor, color: cor, avatar, inicial: inicialDe(nome) };

  return (
    <div onClick={onFechar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 70 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Meu perfil"
        style={{ background: T.surface, borderRadius: 18, padding: 26, width: "100%", maxWidth: 420,
          border: `1px solid ${T.border}`, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", fontFamily: fontBody, color: T.ink }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 700, margin: 0 }}>Meu perfil</h2>
          <button onClick={onFechar} style={{ border: "none", background: "transparent", color: T.muted, cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Foto + trocar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ borderRadius: 999, padding: 4, border: `3px solid ${cor}` }}>
            <Avatar user={preview} size={92} />
          </div>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: `1px solid ${T.border}`,
              background: T.surface, color: T.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <Camera size={14} /> {avatar ? "Trocar foto" : "Adicionar foto"}
          </button>
          {avatar && (
            <button onClick={() => setAvatar(null)} style={{ border: "none", background: "transparent", color: T.faint, fontSize: 11.5, cursor: "pointer" }}>
              remover foto
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
        </div>

        {/* Nome / apelido */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 5 }}>Apelido</div>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome ou apelido"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
              fontSize: 14, fontFamily: fontBody, outline: "none", background: T.surfaceAlt, color: T.ink }} />
        </div>

        {/* Cor */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 8 }}>Cor do perfil</div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {CORES.map((c) => (
              <button key={c} onClick={() => setCor(c)} aria-label={c}
                style={{ width: 30, height: 30, borderRadius: 999, background: c, cursor: "pointer",
                  border: cor === c ? `3px solid ${T.ink}` : `2px solid ${T.border}` }} />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onFechar}
            style={{ padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={salvar} disabled={salvando || !nome.trim()}
            style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: nome.trim() ? T.primary : T.faint, color: "#fff",
              fontSize: 13.5, fontWeight: 600, cursor: nome.trim() ? "pointer" : "not-allowed", opacity: salvando ? 0.7 : 1 }}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
