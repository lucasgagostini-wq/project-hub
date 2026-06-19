import React from "react";
import {
  IconHome as Home,
  IconLayoutKanban as FolderKanban,
  IconCalendar as CalendarDays,
  IconListCheck as ListTodo,
  IconUsers as Users2,
  IconBulb as Bulb,
} from "../../lib/icons";
import { T } from "../../lib/theme";

const NAV_ITENS = [
  { id: "home",       label: "Início",    icon: Home },
  { id: "projetos",   label: "Projetos",  icon: FolderKanban },
  { id: "ideias",     label: "Ideias",    icon: Bulb },
  { id: "calendario", label: "Agenda",    icon: CalendarDays },
  { id: "tarefas",    label: "Tarefas",   icon: ListTodo },
  { id: "reunioes",   label: "Reuniões",  icon: Users2 },
];

export default function MobileBottomNav({ secao, onNav }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, background: T.surface,
      borderTop: `1px solid ${T.border}`, display: "flex", padding: "6px 4px 8px", justifyContent: "space-around" }}>
      {NAV_ITENS.map((it) => {
        const ativo = secao === it.id;
        return (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{ flex: 1, border: "none", background: "transparent", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "6px 2px", color: ativo ? T.primaryText : T.faint }}>
            <it.icon size={20} />
            <span style={{ fontSize: 10, fontWeight: ativo ? 600 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
