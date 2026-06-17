import React, { useState } from "react";
import { IconCheck as Check, IconPlus as Plus } from "@tabler/icons-react";
import { T, fontBody } from "../../lib/theme";
import { Avatar, Eyebrow, PageHeader } from "../../components";

function fmtData(d) {
  if (!d) return null;
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}` : d;
}

const inp = () => ({
  width: "100%", padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.border}`,
  fontSize: 13, fontFamily: fontBody, outline: "none", background: T.surfaceAlt, color: T.ink,
});

export default function TarefasGerais({
  tarefas = [], usuarios = [], usuarioAtual, projetos = [],
  userById, projById, onCriar, onToggle,
}) {
  const [form, setForm] = useState({ titulo: "", resp: "", proj: "", data: "" });
  const [filtro, setFiltro] = useState("todas"); // todas | minhas

  const podeCriar = form.titulo.trim() && form.resp;
  const delegando = form.resp && usuarioAtual && form.resp !== usuarioAtual.id;

  const criar = () => {
    if (!podeCriar) return;
    onCriar?.({ titulo: form.titulo.trim(), resp: form.resp, proj: form.proj || null, data: form.data || null });
    setForm({ titulo: "", resp: "", proj: "", data: "" });
  };

  const visiveis = filtro === "minhas" && usuarioAtual
    ? tarefas.filter((t) => t.resp === usuarioAtual.id)
    : tarefas;
  const pend = visiveis.filter((t) => !t.feito);
  const ok   = visiveis.filter((t) => t.feito);

  const Linha = (t) => {
    const resp = userById?.(t.resp);
    const quem = userById?.(t.delegadoPor);
    const p = projById?.(t.proj);
    const data = fmtData(t.data);
    const delegada = t.delegadoPor && t.delegadoPor !== t.resp;
    return (
      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 13, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 13, padding: "12px 16px" }}>
        <button onClick={() => onToggle?.(t.id, !t.feito)}
          style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${t.feito ? T.pos : T.border}`,
            background: t.feito ? T.pos : T.surface, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0 }}>
          {t.feito && <Check size={13} color="#fff" />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: t.feito ? "line-through" : "none", color: t.feito ? T.faint : T.ink }}>{t.titulo}</div>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(p?.nome || p?.name) && <span>{p.nome || p.name}</span>}
            {data && <span>vence {data}</span>}
            {delegada && quem && <span>· delegada por {quem.nome || quem.name}</span>}
          </div>
        </div>
        {resp && <Avatar user={resp} size={26} />}
      </div>
    );
  };

  return (
    <div>
      <PageHeader titulo="Tarefas" sub="Crie, delegue e acompanhe as tarefas do time." />

      {/* Nova tarefa / delegar */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 18, marginBottom: 22 }}>
        <Eyebrow>Nova tarefa</Eyebrow>
        <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && criar()} placeholder="O que precisa ser feito?" style={inp()} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <select value={form.resp} onChange={(e) => setForm({ ...form, resp: e.target.value })} style={{ ...inp(), cursor: "pointer" }}>
              <option value="">Responsável…</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome || u.name}</option>)}
            </select>
            <select value={form.proj} onChange={(e) => setForm({ ...form, proj: e.target.value })} style={{ ...inp(), cursor: "pointer" }}>
              <option value="">Projeto (opcional)</option>
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome || p.name}</option>)}
            </select>
            <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} style={{ ...inp(), cursor: "pointer" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={criar} disabled={!podeCriar}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none",
                background: podeCriar ? T.primary : T.faint, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: podeCriar ? "pointer" : "not-allowed" }}>
              <Plus size={15} /> {delegando ? "Delegar tarefa" : "Criar tarefa"}
            </button>
          </div>
        </div>
      </section>

      {/* Filtro */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ id: "todas", l: "Todas" }, { id: "minhas", l: "Minhas" }].map((o) => {
          const on = filtro === o.id;
          return (
            <button key={o.id} onClick={() => setFiltro(o.id)}
              style={{ padding: "6px 14px", borderRadius: 999, border: `1px solid ${on ? T.primary : T.border}`,
                background: on ? T.primaryBg : T.surface, color: on ? T.primaryText : T.muted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {o.l}
            </button>
          );
        })}
      </div>

      <Eyebrow>Pendentes · {pend.length}</Eyebrow>
      {pend.length === 0 && <div style={{ color: T.faint, fontSize: 13, marginBottom: 18 }}>Nenhuma tarefa pendente.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>{pend.map(Linha)}</div>
      {ok.length > 0 && (
        <>
          <Eyebrow>Concluídas · {ok.length}</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{ok.map(Linha)}</div>
        </>
      )}
    </div>
  );
}
