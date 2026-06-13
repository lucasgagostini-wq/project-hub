import React from "react";
import { IconCheck as Check } from "@tabler/icons-react";
import { T } from "../../lib/theme";
import { Avatar, Eyebrow, PageHeader } from "../../components";

export default function TarefasGerais({ tarefas = [], setTarefas, userById, projById }) {
  const toggle = (id) =>
    setTarefas?.((ts) => ts.map((t) => (t.id === id ? { ...t, feito: !t.feito } : t)));

  const pend = tarefas.filter((t) => !t.feito);
  const ok   = tarefas.filter((t) => t.feito);

  const Linha = (t) => {
    const u = userById?.(t.resp);
    const p = projById?.(t.proj);
    return (
      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 13, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 13, padding: "12px 16px" }}>
        <button onClick={() => toggle(t.id)}
          style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${t.feito ? T.pos : T.border}`,
            background: t.feito ? T.pos : T.surface, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          {t.feito && <Check size={13} color="#fff" />}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: t.feito ? "line-through" : "none", color: t.feito ? T.faint : T.ink }}>{t.titulo}</div>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>
            {p?.nome || p?.name || "—"} · vence {(t.data || "").slice(8, 10)}/05
          </div>
        </div>
        {u && <Avatar user={u} size={26} />}
      </div>
    );
  };

  return (
    <div>
      <PageHeader titulo="Tarefas gerais" sub="Tarefas de todos os projetos, com responsável e prazo." />
      <Eyebrow>Pendentes · {pend.length}</Eyebrow>
      {pend.length === 0 && <div style={{ color: T.faint, fontSize: 13, marginBottom: 18 }}>Nenhuma tarefa pendente.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>{pend.map(Linha)}</div>
      <Eyebrow>Concluídas · {ok.length}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{ok.map(Linha)}</div>
    </div>
  );
}
