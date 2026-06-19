import React, { useState, useCallback } from "react";
import { IconTarget as Target, IconLogout as LogOut, IconUserCog as UserCog } from "@tabler/icons-react";
import { T, fontDisplay } from "../../lib/theme";
import { Avatar } from "../../components";
import { useDismissable } from "../../lib/hooks/useDismissable";

export default function MobileTopBar({ usuario, usuarios = [], onTrocar, onEditarPerfil, onSair }) {
  const [aberto, setAberto] = useState(false);
  const fecharMenu = useCallback(() => setAberto(false), []);
  const menuRef = useDismissable(aberto, fecharMenu);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: T.surface, borderBottom: `1px solid ${T.border}`, color: T.ink,
      padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Target size={16} color="#fff" />
        </div>
        <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>Project Hub</span>
      </div>
      <div ref={menuRef} style={{ position: "relative" }}>
        <button onClick={() => setAberto((o) => !o)} aria-haspopup="true" aria-expanded={aberto} aria-label="Menu do perfil"
          style={{ border: "none", background: "transparent", padding: 0 }}>
          <Avatar user={usuario} size={32} />
        </button>
        {aberto && (
          <div role="menu" aria-label="Trocar de perfil" style={{ position: "absolute", top: 42, right: 0, background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 6, width: 170, boxShadow: "0 10px 30px rgba(0,0,0,.12)", zIndex: 40 }}>
            {usuarios.map((u) => (
              <button key={u.id} onClick={() => { onTrocar(u); setAberto(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", textAlign: "left", color: T.ink }}>
                <Avatar user={u} size={24} />
                <span style={{ fontSize: 12.5 }}>{(u.nome || u.name || "").split(" ")[0]}</span>
              </button>
            ))}
            <div style={{ height: 1, background: T.hair, margin: "4px 0" }} />
            <button onClick={() => { onEditarPerfil?.(); setAberto(false); }}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", color: T.ink, fontSize: 12.5 }}>
              <UserCog size={15} /> Editar perfil
            </button>
            <button onClick={onSair} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", color: T.neg, fontSize: 12.5 }}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
