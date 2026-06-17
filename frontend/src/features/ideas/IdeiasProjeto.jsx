import React, { useState } from "react";
import {
  IconBulb as Bulb,
  IconPlus as Plus,
  IconTrash as Trash,
} from "@tabler/icons-react";
import { T, fontDisplay } from "../../lib/theme";
import { Eyebrow } from "../../components";
import { useMobile } from "../../lib/context";
import { StatusSelect, inputIdeiaSt } from "./common";

const TIPOS = ["Order bump", "Upsell", "Downsell", "Novo pacote", "Cross-sell", "Outro"];

export default function IdeiasProjeto({ projeto, onSalvar }) {
  const m = useMobile();
  const ideias = projeto.ideias || [];
  const [form, setForm] = useState({ tipo: "Order bump", titulo: "", preco: "", descricao: "" });
  const inp = inputIdeiaSt();

  const salvar = (novas, label) => onSalvar?.(novas, label);

  const add = () => {
    if (!form.titulo.trim()) return;
    const nova = {
      id: "ip-" + Date.now(),
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      preco: form.preco.trim(),
      descricao: form.descricao.trim(),
      status: "ideia",
      criadoEm: new Date().toISOString(),
    };
    salvar([nova, ...ideias], `adicionou a ideia "${nova.titulo}"`);
    setForm({ tipo: "Order bump", titulo: "", preco: "", descricao: "" });
  };
  const patch = (id, campos) => salvar(ideias.map((i) => (i.id === id ? { ...i, ...campos } : i)), null);
  const remove = (id) => salvar(ideias.filter((i) => i.id !== id), "removeu uma ideia");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Form */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
        <Eyebrow>Nova ideia de oferta</Eyebrow>
        <div style={{ fontSize: 12.5, color: T.faint, margin: "-8px 0 14px" }}>
          Order bumps, upsells, downsells e novos pacotes para esta oferta.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "180px 1fr 140px", gap: 12, marginBottom: 12 }}>
          <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            style={{ ...inp, appearance: "none", cursor: "pointer" }}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nome da ideia (ex: Kit aplicação premium)" style={inp} />
          <input value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Preço (ex: R$ 47)" style={inp} />
        </div>
        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="O que é, por que faz sentido nesta oferta, gatilho…" style={{ ...inp, minHeight: 56, resize: "vertical" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={add} disabled={!form.titulo.trim()}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none",
              background: form.titulo.trim() ? T.primary : T.faint, color: "#fff", fontSize: 13.5, fontWeight: 600,
              cursor: form.titulo.trim() ? "pointer" : "not-allowed" }}>
            <Plus size={15} /> Adicionar
          </button>
        </div>
      </section>

      {/* Lista */}
      {ideias.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "36px 0", color: T.faint }}>
          <Bulb size={26} />
          <span style={{ fontSize: 13.5 }}>Nenhuma ideia de oferta ainda.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ideias.map((i) => {
            const descartada = i.status === "descartada";
            return (
              <div key={i.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 13, padding: "14px 16px",
                display: "flex", gap: 14, alignItems: "flex-start", opacity: descartada ? 0.6 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.primaryText, background: T.primaryBg, padding: "2px 8px", borderRadius: 6 }}>{i.tipo}</span>
                    <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14.5 }}>{i.titulo}</span>
                    {i.preco && <span style={{ fontSize: 12.5, color: T.muted, fontWeight: 600 }}>· {i.preco}</span>}
                  </div>
                  {i.descricao && <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.45 }}>{i.descricao}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <StatusSelect value={i.status} onChange={(v) => patch(i.id, { status: v })} />
                  <button onClick={() => remove(i.id)} title="Remover"
                    style={{ border: "none", background: "transparent", color: T.faint, padding: 2 }}>
                    <Trash size={15} />
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
