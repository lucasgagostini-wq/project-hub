import React, { useState } from "react";
import {
  IconBulb as Bulb,
  IconPlus as Plus,
  IconTrash as Trash,
  IconRocket as Rocket,
} from "@tabler/icons-react";
import { T, fontDisplay } from "../../lib/theme";
import { PageHeader, Eyebrow } from "../../components";
import { useMobile } from "../../lib/context";
import { StatusSelect, inputIdeiaSt } from "./common";

export default function IdeiasGerais({ ideias = [], onAdd, onPatch, onRemove, onCriarProjeto }) {
  const m = useMobile();
  const [form, setForm] = useState({ titulo: "", nicho: "", descricao: "" });
  const inp = inputIdeiaSt();

  const add = () => {
    if (!form.titulo.trim()) return;
    onAdd?.({ titulo: form.titulo.trim(), nicho: form.nicho.trim(), descricao: form.descricao.trim() });
    setForm({ titulo: "", nicho: "", descricao: "" });
  };
  const patch = (id, campos) => onPatch?.(id, campos);
  const remove = (id) => onRemove?.(id);

  return (
    <div>
      <PageHeader titulo="Ideias" sub="Banco de ideias para novos projetos / ofertas." />

      {/* Form de nova ideia */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <Eyebrow>Nova ideia</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1.4fr 1fr", gap: 12, marginBottom: 12 }}>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Título da ideia (ex: Curso de finanças p/ mães)" style={inp} />
          <input value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nicho (opcional)" style={inp} />
        </div>
        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Anote a sacada: ângulo, público, por que pode funcionar…" style={{ ...inp, minHeight: 60, resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={add} disabled={!form.titulo.trim()}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none",
              background: form.titulo.trim() ? T.primary : T.faint, color: "#fff", fontSize: 13.5, fontWeight: 600,
              cursor: form.titulo.trim() ? "pointer" : "not-allowed" }}>
            <Plus size={15} /> Adicionar ideia
          </button>
        </div>
      </section>

      <Eyebrow>{ideias.length} {ideias.length === 1 ? "ideia" : "ideias"}</Eyebrow>
      {ideias.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "44px 0", color: T.faint }}>
          <Bulb size={26} />
          <span style={{ fontSize: 13.5 }}>Nenhuma ideia ainda. Anote a primeira aí em cima.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {ideias.map((i) => {
            const descartada = i.status === "descartada";
            return (
              <div key={i.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16,
                display: "flex", flexDirection: "column", gap: 10, opacity: descartada ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>{i.titulo}</div>
                  <button onClick={() => remove(i.id)} title="Remover"
                    style={{ border: "none", background: "transparent", color: T.faint, padding: 2, flexShrink: 0 }}>
                    <Trash size={15} />
                  </button>
                </div>
                {i.nicho && (
                  <span style={{ alignSelf: "flex-start", fontSize: 11.5, color: T.muted, background: T.hair, padding: "2px 9px", borderRadius: 6 }}>{i.nicho}</span>
                )}
                {i.descricao && <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.45 }}>{i.descricao}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${T.hair}` }}>
                  <StatusSelect value={i.status} onChange={(v) => patch(i.id, { status: v })} />
                  <button onClick={() => onCriarProjeto?.(i)}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: T.primaryText,
                      border: `1px solid ${T.border}`, background: T.surface, borderRadius: 8, padding: "6px 10px" }}>
                    <Rocket size={13} /> Virar projeto
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
