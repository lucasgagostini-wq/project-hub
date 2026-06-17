import React, { useState } from "react";
import { IconTarget as Target } from "@tabler/icons-react";
import { T, fontDisplay, fontBody } from "../../lib/theme";
import { Avatar } from "../../components";
import { MOCK_USERS } from "../../lib/api/mockData";

// Card de perfil estilo Netflix — destaca no hover; clicou, entra.
function ProfileButton({ user, onClick }) {
  const [hover, setHover] = useState(false);
  const nome = (user.nome || user.name || "").split(" ")[0];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Entrar como ${nome}`}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        border: "none", background: "transparent", padding: 8, cursor: "pointer",
        transform: hover ? "translateY(-2px)" : "none", transition: "transform .15s ease",
      }}
    >
      <div style={{
        borderRadius: 24, padding: 4,
        border: `3px solid ${hover ? T.primary : "transparent"}`,
        transition: "border-color .15s ease",
      }}>
        <Avatar user={user} size={96} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: hover ? T.ink : T.muted, transition: "color .15s ease" }}>
        {nome}
      </span>
    </button>
  );
}

export default function Login({ onEntrar, usuarios = MOCK_USERS }) {
  // Protótipo: sem login/senha. Por enquanto, um perfil só.
  const perfis = (usuarios || []).slice(0, 1);

  return (
    <div className="grid-bg" style={{
      minHeight: "100vh", fontFamily: fontBody, color: T.ink,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, gap: 36,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Target size={18} color="#fff" />
        </div>
        <div style={{ fontFamily: fontDisplay, fontSize: 14, letterSpacing: 2, color: T.faint, fontWeight: 600 }}>
          PROJECT HUB
        </div>
      </div>

      <h1 style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 600, margin: 0, letterSpacing: -0.4, textAlign: "center" }}>
        Quem está acessando?
      </h1>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {perfis.map((u) => (
          <ProfileButton key={u.id} user={u} onClick={() => onEntrar(u)} />
        ))}
      </div>

      <p style={{ fontSize: 12, color: T.faint, textAlign: "center", margin: 0 }}>
        Protótipo — sem login. Clique no perfil para entrar.
      </p>
    </div>
  );
}
