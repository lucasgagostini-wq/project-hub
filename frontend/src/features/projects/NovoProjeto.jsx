import React, { useState, useEffect } from "react";
import {
  IconArrowLeft as ArrowLeft,
  IconPlus as Plus,
  IconX as X,
  IconCopy as Copy,
  IconWand as Wand,
  IconEye as Eye,
  IconDownload as Download,
} from "../../lib/icons";
import { T, fontDisplay, fontBody, glassStyle } from "../../lib/theme";
import { Eyebrow } from "../../components";
import { clonarOferta, gerarSnapshot } from "../../lib/api/clone";
import CloneProgress from "./CloneProgress";
import { notifyStatus, pedirPermissaoNotify, avisarConcluido } from "../../lib/notify";

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

export default function NovoProjeto({ onVoltar, onCriar, inicial }) {
  const [form, setForm] = useState({
    nome: inicial?.nome || "",
    nicho: inicial?.nicho || "",
    oferta: inicial?.oferta || "",
    publico: "",
    idade: "",
    veiculo: "",
    preco: "",
    garantia: "",
    persona_nome: "",
    persona_canal: "",
    persona_dor: "",
    persona_desejo: "",
    persona_objecao: "",
  });
  const [linksTipo, setLinksTipo] = useState([{ tipo: "Página de vendas", url: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [erros, setErros] = useState({});
  const [submitErr, setSubmitErr] = useState(null);

  // ── Clonagem de oferta ──────────────────────────────────────────────
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState(null); // { tipo: "ok" | "erro", texto }
  const [cloneTynk, setCloneTynk] = useState(null); // metadata retornada pelo Tynk

  // ── Snapshot (preview sem login Tynk + download) ────────────────────
  const [snapping, setSnapping] = useState(false);
  const [snap, setSnap] = useState(null); // { previewUrl, downloadUrl }
  const [snapErr, setSnapErr] = useState(null);
  const [notifQ, setNotifQ] = useState(false); // micro-prompt de notificação
  const [snapJustSet, setSnapJustSet] = useState(false); // pulso no "Ver preview"

  const gerarPreview = async () => {
    if (snapping || !cloneUrl.trim()) return;
    setSnapping(true); setSnapErr(null);
    try {
      const r = await gerarSnapshot({ url: cloneUrl.trim() });
      setSnap({ previewUrl: r.previewUrl, downloadUrl: r.downloadUrl });
    } catch (e) {
      setSnapErr(e.message || "Não foi possível gerar o preview.");
    } finally {
      setSnapping(false);
    }
  };

  // Notifica quando snap é setado (só se aba em segundo plano)
  useEffect(() => {
    if (!snap) return;
    avisarConcluido("Project Hub", "Sua preview está pronta — clique em Ver preview.");
    setSnapJustSet(true);
    const t = setTimeout(() => setSnapJustSet(false), 2000);
    return () => clearTimeout(t);
  }, [snap]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const clonar = async () => {
    if (cloning) return;
    if (!cloneUrl.trim()) { setCloneMsg({ tipo: "erro", texto: "Cole a URL da página de vendas." }); return; }
    setCloning(true); setCloneMsg(null); setSnap(null); setSnapErr(null);
    setNotifQ(notifyStatus() === "default");
    try {
      const d = await clonarOferta({ url: cloneUrl.trim(), nome: form.nome });
      setForm((f) => ({
        ...f,
        nome:     f.nome || d.nome || "",
        nicho:    d.nicho    || f.nicho,
        oferta:   d.oferta   || f.oferta,
        publico:  d.publico  || f.publico,
        idade:    d.idade    || f.idade,
        preco:    d.preco    || f.preco,
        garantia: d.garantia || f.garantia,
        persona_nome:    d.persona?.nome    || f.persona_nome,
        persona_canal:   d.persona?.canal   || f.persona_canal,
        persona_dor:     d.persona?.dor     || f.persona_dor,
        persona_desejo:  d.persona?.desejo  || f.persona_desejo,
        persona_objecao: d.persona?.objecao || f.persona_objecao,
      }));
      const novosLinks = [
        { tipo: "Página de vendas", url: cloneUrl.trim() },
        ...((d.links || []).filter((l) => l.url)),
      ];
      if (novosLinks.length) setLinksTipo(novosLinks);
      setCloneTynk(d.tynk || null);
      const ref = d.tynk?.domain ? ` (projeto Tynk: ${d.tynk.domain})` : "";
      if (d.tynk?.import?.timedOut) {
        setCloneMsg({
          tipo: "aviso",
          texto: `Projeto criado na Tynk${ref}. A importação no Tynk demorou e segue processando lá — mas estamos gerando a preview da página automaticamente abaixo, você já vai poder ver e baixar aqui mesmo.`,
        });
      } else if (d.extracao === "vazia") {
        setCloneMsg({
          tipo: "aviso",
          texto: `Página clonada no Tynk ✓${ref}. A IA não conseguiu extrair os campos (página pode exigir login, ou tente novamente). Preencha manualmente abaixo.`,
        });
      } else {
        setCloneMsg({
          tipo: "ok",
          texto: `Página clonada no Tynk ✓${ref}. Preencha a oferta/persona abaixo e clique em Criar projeto.`,
        });
      }

      // Gera a preview da página AUTOMATICAMENTE (snapshot via Jina — rápido, ~10s, e
      // independe da importação lenta do Tynk). Assim "Ver preview"/"Baixar .html"
      // aparecem sozinhos, sem o usuário precisar clicar em nada.
      if (d.tynk) gerarPreview();
    } catch (e) {
      setCloneMsg({ tipo: "erro", texto: e.message || "Não foi possível clonar a oferta." });
    } finally {
      setCloning(false);
    }
  };

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
    setSubmitErr(null);
    const payload = {
      id: "p-" + Date.now(),
      ...form,
      links: linksTipo.filter((l) => l.url.trim()),
      persona: form.persona_nome ? {
        nome: form.persona_nome,
        canal: form.persona_canal,
        dor: form.persona_dor,
        desejo: form.persona_desejo,
        objecao: form.persona_objecao,
      } : null,
      faturamento: 0, lucro: 0, gastoAds: 0, tempoOnline: 0, escala: 0,
      criativos: [], estruturas: {}, timeline: [],
      ...(cloneTynk ? { tynk: { ...cloneTynk, ...(snap ? { snapshot: snap } : {}) } } : {}),
    };
    // try/finally: se a criação falhar (ex.: erro no Supabase), mostra a mensagem e
    // libera o botão — antes, a rejeição não-tratada deixava "Criando…" travado.
    try {
      await onCriar?.(payload);
    } catch (e) {
      setSubmitErr(e?.message || "Não foi possível criar o projeto. Tente de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  const secSt = {
    ...glassStyle(),
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
        {/* Clonar oferta */}
        <section style={{ ...secSt, background: T.primaryBg, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Wand size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 15 }}>Clonar oferta automaticamente</div>
              <div style={{ fontSize: 12.5, color: T.muted }}>Cole a página de vendas e o app extrai a oferta, público, preço e persona pra você.</div>
            </div>
          </div>

          {/* Keyframe para o pulse no "Ver preview" */}
          <style>{`
            @keyframes ph-pulse-preview {
              0%,100% { opacity:1; transform:scale(1); }
              50% { opacity:.88; transform:scale(1.05); }
            }
            .ph-pulse { animation: ph-pulse-preview 0.55s ease-in-out 3; }
          `}</style>

          {/* URL input + botão — some enquanto está clonando/snapping */}
          {!cloning && !snapping && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 4 }}>URL da página de vendas</div>
                <input value={cloneUrl} onChange={(e) => setCloneUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && clonar()}
                  placeholder="https://..." style={{ ...inputSt, marginTop: 0 }} />
              </div>
              <button onClick={clonar}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10, border: "none",
                  background: T.primary, color: "#fff", fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", flexShrink: 0 }}>
                <Copy size={15} /> Clonar oferta
              </button>
            </div>
          )}

          {/* Micro-prompt de notificação — aparece uma vez ao iniciar a clonagem */}
          {notifQ && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5,
              padding: "8px 12px", borderRadius: 9, background: "#FEF9C3", color: "#92400E",
              border: "1px solid #FDE68A" }}>
              <span>🔔 Avisar quando a preview ficar pronta?</span>
              <button onClick={async () => { await pedirPermissaoNotify(); setNotifQ(false); }}
                style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "#D97706",
                  color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Ativar
              </button>
              <button onClick={() => setNotifQ(false)}
                style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid #FDE68A",
                  background: "transparent", color: "#92400E", fontSize: 12, cursor: "pointer" }}>
                Agora não
              </button>
            </div>
          )}

          {/* Terminal de progresso — visível durante clone/snapshot e após concluído */}
          {(cloning || snapping || !!snap || cloneMsg?.tipo === "erro") && (
            <CloneProgress
              cloning={cloning}
              snapping={snapping}
              done={!!snap}
              error={snapErr || (cloneMsg?.tipo === "erro" ? cloneMsg.texto : null)}
              sourceUrl={cloneUrl}
            />
          )}

          {/* Mensagem de status (não-erro) após clone */}
          {cloneMsg && cloneMsg.tipo !== "erro" && !cloning && (
            <div style={{ fontSize: 12.5, fontWeight: 500, padding: "9px 12px", borderRadius: 9,
              color: cloneMsg.tipo === "ok" ? T.pos : "#B45309",
              background: cloneMsg.tipo === "ok" ? T.posBg : "#FEF3C7" }}>
              {cloneMsg.texto}
            </div>
          )}

          {/* Preview / Download — aparece quando o snapshot está pronto */}
          {cloneTynk && snap && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <a href={snap.previewUrl} target="_blank" rel="noreferrer"
                key={snap.previewUrl}
                className={snapJustSet ? "ph-pulse" : ""}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "none",
                  background: T.primary, color: "#fff", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
                <Eye size={14} /> Ver preview
              </a>
              <a href={snap.downloadUrl}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9,
                  border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>
                <Download size={14} /> Baixar .html
              </a>
            </div>
          )}

          {/* Botão manual de gerar preview — só se Tynk criou mas snapshot falhou */}
          {cloneTynk && !snap && !snapping && !cloning && snapErr && (
            <button onClick={gerarPreview}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9,
                border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Eye size={14} /> Tentar gerar preview novamente
            </button>
          )}
        </section>

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
        {submitErr && (
          <div role="alert" style={{ fontSize: 12.5, fontWeight: 500, padding: "9px 12px", borderRadius: 9,
            color: T.neg, background: T.negBg }}>
            {submitErr}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingBottom: 40 }}>
          <button onClick={onVoltar}
            style={{ padding: "11px 22px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 14, fontWeight: 500 }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={submitting || snapping}
            title={snapping ? "Aguarde a preview ser gerada…" : undefined}
            style={{ padding: "11px 24px", borderRadius: 11, border: "none", background: T.primary, color: "#fff", fontSize: 14, fontWeight: 600,
              opacity: submitting || snapping ? 0.6 : 1, cursor: snapping ? "not-allowed" : "pointer" }}>
            {submitting ? "Criando…" : snapping ? "Aguardando preview…" : "Criar projeto"}
          </button>
        </div>
      </div>
    </div>
  );
}
