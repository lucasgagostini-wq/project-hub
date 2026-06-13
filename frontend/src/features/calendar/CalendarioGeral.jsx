import React, { useState } from "react";
import { IconCalendar as CalendarDays, IconWorld as Globe } from "@tabler/icons-react";
import { T } from "../../lib/theme";
import { Avatar, ChipFiltro } from "../../components";
import { PageHeader } from "../../components";

function conectarGoogleAgenda() { return { ok: true }; }

const GOOGLE_EVENTOS = [
  { tipo: "google", data: "2025-05-12", label: "Reunião com fornecedor", resp: null },
  { tipo: "google", data: "2025-05-14", label: "Vencimento — pagamento de mídia", resp: null },
];

const badge = (tipo) =>
  tipo === "reuniao" ? { l: "Reunião", c: T.pos, bg: T.posBg }
  : tipo === "google" ? { l: "Google Agenda", c: T.primaryText, bg: T.primaryBg }
  : { l: "Tarefa", c: T.muted, bg: T.hair };

export default function CalendarioGeral({ tarefas = [], reunioes = [], userById, projById, usuarios = [] }) {
  const [filtro, setFiltro] = useState("todos");
  const [googleOn, setGoogleOn] = useState(false);

  const eventos = [
    ...tarefas.map((t) => ({ tipo: "tarefa", data: t.data, label: t.titulo, resp: t.resp, proj: t.proj })),
    ...reunioes.flatMap((r) => (r.participantes || []).map((p) => ({ tipo: "reuniao", data: r.data, label: r.titulo, resp: p }))),
    ...(googleOn ? GOOGLE_EVENTOS : []),
  ]
    .filter((e) => filtro === "todos" || e.resp === filtro)
    .sort((a, b) => (a.data || "").localeCompare(b.data || ""));

  return (
    <div>
      <PageHeader titulo="Calendário geral" sub="Toda ação com data e responsável aparece aqui — e no calendário pessoal de quem foi designado." />

      {/* Conexão Google Agenda */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: googleOn ? T.primaryBg : T.surface, border: `1px solid ${googleOn ? T.primary : T.border}`,
        borderRadius: 14, padding: "13px 16px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: googleOn ? T.primary : T.surfaceAlt,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarDays size={17} color={googleOn ? "#fff" : T.muted} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{googleOn ? "Google Agenda conectada" : "Conectar Google Agenda"}</div>
            <div style={{ fontSize: 12, color: googleOn ? T.primaryText : T.faint }}>
              {googleOn ? "Agenda da empresa · sincronizando nos dois sentidos" : "Sincronize reuniões e prazos com a conta da empresa."}
            </div>
          </div>
        </div>
        {googleOn ? (
          <button onClick={() => setGoogleOn(false)}
            style={{ fontSize: 12.5, color: T.primaryText, border: `1px solid ${T.border}`, background: "transparent", borderRadius: 9, padding: "7px 12px" }}>
            Desconectar
          </button>
        ) : (
          <button onClick={() => { conectarGoogleAgenda(); setGoogleOn(true); }}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#fff",
              border: "none", background: T.primary, borderRadius: 10, padding: "9px 14px" }}>
            <Globe size={15} /> Conectar
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        <ChipFiltro ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</ChipFiltro>
        {usuarios.map((u) => (
          <ChipFiltro key={u.id} ativo={filtro === u.id} onClick={() => setFiltro(u.id)}>
            {(u.nome || u.name || "").split(" ")[0]}
          </ChipFiltro>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {eventos.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center", color: T.faint, fontSize: 13.5 }}>
            Nenhum evento encontrado para este filtro.
          </div>
        )}
        {eventos.map((e, i) => {
          const u = e.resp ? userById?.(e.resp) : null;
          const p = e.proj ? projById?.(e.proj) : null;
          const b = badge(e.tipo);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 13, padding: "13px 16px" }}>
              <div style={{ textAlign: "center", width: 46 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600 }}>{(e.data || "").slice(8, 10)}</div>
                <div style={{ fontSize: 11, color: T.faint }}>mai</div>
              </div>
              <div style={{ width: 1, height: 30, background: T.hair }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.label}</div>
                <div style={{ fontSize: 12, color: T.faint, display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                  <span style={{ background: b.bg, color: b.c, padding: "1px 7px", borderRadius: 5 }}>{b.l}</span>
                  {p && <span>{p.nome || p.name}</span>}
                </div>
              </div>
              {u ? <Avatar user={u} size={28} /> : (
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "#E8F0FE", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Globe size={15} color="#1A73E8" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
