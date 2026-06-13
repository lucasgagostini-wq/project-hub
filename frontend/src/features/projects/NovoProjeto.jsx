import React, { useState } from "react";
import {
  IconArrowLeft as ArrowLeft,
  IconPlus as Plus,
  IconX as X,
} from "@tabler/icons-react";
import { T, fontDisplay, fontBody } from "../../lib/theme";
import { Eyebrow } from "../../components";

const inputSt = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  fontSize: 13.5,
  fontFamily: fontBody,
  outline: "none",
  background: T.surfaceAlt,
  color: T.ink,
};

const areaSt = { ...inputSt, minHeight: 72, resize: "vertical" };

function Campo({ label, name, value, onChange, area, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {area ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} style={areaSt} />
      ) : (
        <input name={name} value={value} onChange={onChange} placeholder={placeholder} style={inputSt} />
      )}
    </div>
  );
}

const VEICULOS = ["Meta Ads", "Google Ads", "TikTok Ads", "YouTube", "Email", "Orgânico"];
const NICHOS  = ["Saúde e Bem-Estar", "Finanças", "Negócios", "Beleza", "Relacionamentos", "Educação", "Tecnologia", "Entretenimento"];

export default function NovoProjeto({ onVoltar, onCriar }) {
  const [form, setForm] = useState({
    nome: "",
    nicho: "",
    oferta: "",
    publico: "",
    idade: "",
    veiculo: "",
    preco: "",
    garantia: "",
    persona_nome: "",
    persona_dor: "",
    persona_desejo: "",
    persona_objecao: "",
  });
  const [linksTipo, setLinksTipo] = useState([{ tipo: "Página de vendas", url: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [erros, setErros] = useState({});

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addLink = () => setLinksTipo((l) => [...l, { tipo: "", url: "" }]);
  const removeLink = (i) => setLinksTipo((l) => l.filter((_, j) => j !== i));
  const setLink = (i, k, v) => setLinksTipo((l) => l.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = "Obrigatório";
    if (!form.oferta.trim()) e.oferta = "Obrigatório";
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validar()) return;
    setSubmitting(true);
    const payload = {
      id: "p-" + Date.now(),
      ...form,
      links: linksTipo.filter((l) => l.url.trim()),
      persona: form.persona_nome ? {
        nome: form.persona_nome,
        dor: form.persona_dor,
        desejo: form.persona_desejo,
        objecao: form.persona_objecao,
      } : null,
      faturamento: 0, lucro: 0, gastoAds: 0, tempoOnline: 0, escala: 0,
      criativos: [], estruturas: {}, timeline: [],
    };
    await onCriar?.(payload);
    setSubmitting(false);
  };

  const secSt = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <button onClick={onVoltar}
        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent", color: T.muted, fontSize: 13, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={15} /> Voltar
      </button>

      <h1 style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 700, margin: "0 0 4px", letterSpacing: -0.5 }}>
        Novo projeto
      </h1>
      <p style={{ color: T.muted, fontSize: 13, margin: "0 0 26px" }}>
        Preencha as informações da oferta para criar a área de gestão.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Informações básicas */}
        <section style={secSt}>
          <Eyebrow>Informações básicas</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Campo label="Nome do projeto *" name="nome" value={form.nome} onChange={set} placeholder="ex: Pele de Vidro" />
              {erros.nome && <div style={{ fontSize: 12, color: T.neg, marginTop: 3 }}>{erros.nome}</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 4 }}>Nicho</div>
              <select name="nicho" value={form.nicho} onChange={set}
                style={{ ...inputSt, marginTop: 0, appearance: "none", cursor: "pointer" }}>
                <option value="">Selecione</option>
                {NICHOS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 4 }}>Principal veículo de venda</div>
              <select name="veiculo" value={form.veiculo} onChange={set}
                style={{ ...inputSt, marginTop: 0, appearance: "none", cursor: "pointer" }}>
                <option value="">Selecione</option>
                {VEICULOS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Campo label="Descrição da oferta *" name="oferta" value={form.oferta} onChange={set} area
                placeholder="O que é o produto, o que resolve, por que alguém compraria?" />
              {erros.oferta && <div style={{ fontSize: 12, color: T.neg, marginTop: 3 }}>{erros.oferta}</div>}
            </div>
          </div>
        </section>

        {/* Público */}
        <section style={secSt}>
          <Eyebrow>Público e preço</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            <Campo label="Público-alvo" name="publico" value={form.publico} onChange={set} placeholder="ex: Mulheres 30-50 com acne" />
            <Campo label="Faixa de idade" name="idade" value={form.idade} onChange={set} placeholder="ex: 25-45" />
            <Campo label="Preço / ticket" name="preco" value={form.preco} onChange={set} placeholder="ex: R$ 297" />
            <Campo label="Garantia" name="garantia" value={form.garantia} onChange={set} placeholder="ex: 7 dias" />
          </div>
        </section>

        {/* Persona */}
        <section style={secSt}>
          <Eyebrow>Persona mapeada (opcional)</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            <Campo label="Nome da persona" name="persona_nome" value={form.persona_nome} onChange={set} placeholder="ex: Juliana, 38 anos" />
            <Campo label="Onde ela está" name="persona_canal" value={form.persona_canal || ""} onChange={set} placeholder="ex: Instagram, WhatsApp" />
            <Campo label="Dor principal" name="persona_dor" value={form.persona_dor} onChange={set} area placeholder="O que mais incomoda?" />
            <Campo label="Desejo principal" name="persona_desejo" value={form.persona_desejo} onChange={set} area placeholder="O que ela quer conquistar?" />
            <div style={{ gridColumn: "1 / -1" }}>
              <Campo label="Principal objeção de compra" name="persona_objecao" value={form.persona_objecao} onChange={set} area placeholder="ex: Já tentei de tudo, não acredito mais..." />
            </div>
          </div>
        </section>

        {/* Links */}
        <section style={secSt}>
          <Eyebrow>Links do projeto</Eyebrow>
          {linksTipo.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: "0 0 160px" }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 4 }}>Tipo</div>
                <input value={l.tipo} onChange={(e) => setLink(i, "tipo", e.target.value)}
                  placeholder="ex: Página de vendas" style={inputSt} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 4 }}>URL</div>
                <input value={l.url} onChange={(e) => setLink(i, "url", e.target.value)}
                  placeholder="https://..." style={inputSt} />
              </div>
              {linksTipo.length > 1 && (
                <button onClick={() => removeLink(i)}
                  style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.muted, borderRadius: 9, padding: "10px 10px", flexShrink: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addLink}
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted,
              border: `1px dashed ${T.border}`, background: "transparent", borderRadius: 9, padding: "8px 14px" }}>
            <Plus size={14} /> Adicionar link
          </button>
        </section>

        {/* Ações */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingBottom: 40 }}>
          <button onClick={onVoltar}
            style={{ padding: "11px 22px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 14, fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={submitting}
            style={{ padding: "11px 24px", borderRadius: 11, border: "none", background: T.primary, color: "#fff", fontSize: 14, fontWeight: 600, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Criando…" : "Criar projeto"}
          </button>
        </div>
      </div>
    </div>
  );
}
