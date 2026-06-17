import React, { useState } from "react";
import { IconTarget as Target } from "@tabler/icons-react";
import { T, fontDisplay, fontBody } from "../../lib/theme";
import { Avatar } from "../../components";
import { MOCK_USERS } from "../../lib/api/mockData";

export default function Login({ onEntrar, usuarios = MOCK_USERS }) {
  const [user, setUser] = useState(usuarios[0]);
  const [email, setEmail] = useState(usuarios[0]?.email || "");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleEntrar = async () => {
    if (loading) return;
    setLoading(true);
    setErro("");
    try {
      await onEntrar(user, email, senha);
    } catch (e) {
      setErro(e.message || "Erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", fontFamily: fontBody, color: T.ink, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380, background: T.surface, borderRadius: 20, padding: "32px 28px", border: `1px solid ${T.border}`, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Target size={16} color="#fff" />
          </div>
          <div style={{ fontFamily: fontDisplay, fontSize: 13, letterSpacing: 2, color: T.faint, fontWeight: 600 }}>
            PROJECT HUB
          </div>
        </div>

        <h1 style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 700, margin: "0 0 28px", letterSpacing: -0.5 }}>
          Entrar
        </h1>

        <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>Perfil</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0 18px" }}>
          {usuarios.map((u) => (
            <button key={u.id} onClick={() => { setUser(u); setEmail(u.email || ""); }}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 12,
                border: `1.5px solid ${user?.id === u.id ? T.primary : T.border}`, background: T.surfaceAlt, textAlign: "left" }}>
              <Avatar user={u} size={26} />
              <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.1, color: T.ink }}>{(u.nome || u.name || "").split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEntrar()}
          placeholder="••••••••"
          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.ink, fontSize: 14, outline: "none", fontFamily: fontBody }}
        />

        {erro && (
          <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 9, background: T.negBg, color: T.neg, fontSize: 12.5 }}>
            {erro}
          </div>
        )}

        <button
          onClick={handleEntrar}
          disabled={loading}
          style={{ width: "100%", marginTop: 18, padding: "13px", borderRadius: 12, border: "none", background: loading ? T.faint : T.primary, color: "#fff", fontSize: 14.5, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Entrando…" : `Entrar como ${(user?.nome || user?.name || "").split(" ")[0]}`}
        </button>

        <p style={{ fontSize: 12, color: T.faint, textAlign: "center", marginTop: 16 }}>
          Protótipo — qualquer senha entra
        </p>
      </div>
    </div>
  );
}
