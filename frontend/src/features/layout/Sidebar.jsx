import React, { useState } from "react";
import {
  IconHome as Home,
  IconLayoutKanban as FolderKanban,
  IconCalendar as CalendarDays,
  IconListCheck as ListTodo,
  IconUsers as Users2,
  IconLogout as LogOut,
  IconTarget as Target,
  IconBulb as Bulb,
} from "@tabler/icons-react";
import { T, fontDisplay } from "../../lib/theme";
import { Avatar } from "../../components";

const NAV_ITENS = [
  { id: "home",      label: "Início",          icon: Home },
  { id: "projetos",  label: "Projetos",         icon: FolderKanban },
  { id: "ideias",    label: "Ideias",           icon: Bulb },
  { id: "calendario",label: "Calendário geral", icon: CalendarDays },
  { id: "tarefas",   label: "Tarefas gerais",   icon: ListTodo },
  { id: "reunioes",  label: "Reuniões",          icon: Users2 },
];

export default function Sidebar({ secao, onNav, usuario, usuarios = [], onTrocar, onSair }) {
  const [trocarOpen, setTrocarOpen] = useState(false);
  return (
    <aside style={{ width: 236, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, color: T.ink,
      padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>

      <div style={{ padding: "0 8px 22px", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Target size={17} color="#fff" />
        </div>
        <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 15.5, letterSpacing: -0.3, color: T.ink }}>Project Hub</span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITENS.map((it) => {
          const ativo = secao === it.id;
          return (
            <button key={it.id} onClick={() => onNav(it.id)}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10,
                border: "none", background: ativo ? T.primaryBg : "transparent", color: ativo ? T.primaryText : T.muted,
                fontSize: 13.5, fontWeight: ativo ? 600 : 500, textAlign: "left", width: "100%" }}>
              <it.icon size={17} />{it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", position: "relative" }}>
        {trocarOpen && (
          <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, background: T.surface,
            border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, boxShadow: "0 8px 28px rgba(0,0,0,.10)" }}>
            {usuarios.map((u) => (
              <button key={u.id} onClick={() => { onTrocar(u); setTrocarOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px",
                  borderRadius: 8, border: "none", background: "transparent", textAlign: "left", color: T.ink }}>
                <Avatar user={u} size={24} />
                <span style={{ fontSize: 12.5 }}>{(u.nome || u.name || "").split(" ")[0]}</span>
              </button>
            ))}
            <button onClick={onSair} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", color: T.neg, fontSize: 12.5 }}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
        <button onClick={() => setTrocarOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px",
            borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg }}>
          <Avatar user={usuario} size={30} />
          <div style={{ textAlign: "left", lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {usuario?.nome || usuario?.name || ""}
            </div>
            <div style={{ fontSize: 11, color: T.faint }}>{usuario?.papel || usuario?.role || ""}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
