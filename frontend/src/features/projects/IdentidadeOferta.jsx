import React, { useState } from "react";
import { T, glassStyle } from "../../lib/theme";
import { Eyebrow } from "../../components";
import { useMobile } from "../../lib/context";

/**
 * Identidade e custo da oferta — o que faz ela aparecer no placar.
 *
 * Sem `slug` a oferta não recebe venda nenhuma (é por ele que o espelho do funil
 * roteia: `sales.src`); sem conta + prefixo do Meta ela nunca sabe quanto gastou.
 * Sem os custos, o "lucro" do placar seria faturamento − gasto, ignorando a taxa
 * do gateway e o custo de entregar.
 */

const CAMPOS = [
  { k: "slug", label: "Slug da oferta", dica: "A marca que o funil grava na venda. Ex.: reencontro, petencontro, abracojesus.", ph: "reencontro" },
  { k: "funilUrl", label: "URL do funil", dica: "Onde o cliente compra.", ph: "https://memoriaseterniza.online" },
  { k: "metaAccountId", label: "Conta(s) de anúncio", dica: "Só os números, separados por vírgula se for mais de uma.", ph: "993024823734489" },
  { k: "metaCampaignPrefix", label: "Prefixo da campanha", dica: "Como a campanha desta oferta é nomeada no Meta. Ex.: [REEPET].", ph: "[REEPET]" },
];

const CUSTOS = [
  { k: "taxaPct", label: "Taxa do gateway (%)", ph: "1.22", passo: "0.01" },
  { k: "taxaFixa", label: "Taxa fixa por venda (R$)", ph: "0.99", passo: "0.01" },
  { k: "custoEntrega", label: "Custo de entrega por venda (R$)", ph: "1.30", passo: "0.01" },
];

export default function IdentidadeOferta({ projeto, onSalvar }) {
  const m = useMobile();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [draft, setDraft] = useState({});
  const [erro, setErro] = useState(null);

  const abrir = () => {
    setDraft({
      slug: projeto.slug || "",
      funilUrl: projeto.funilUrl || "",
      metaAccountId: projeto.metaAccountId || "",
      metaCampaignPrefix: projeto.metaCampaignPrefix || "",
      taxaPct: projeto.taxaPct ?? 0,
      taxaFixa: projeto.taxaFixa ?? 0,
      custoEntrega: projeto.custoEntrega ?? 0,
    });
    setErro(null);
    setEditando(true);
  };

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar?.({
        ...draft,
        slug: String(draft.slug || "").trim().toLowerCase() || null,
        taxaPct: Number(draft.taxaPct) || 0,
        taxaFixa: Number(draft.taxaFixa) || 0,
        custoEntrega: Number(draft.custoEntrega) || 0,
      });
      setEditando(false);
    } catch (e) {
      // Slug repetido bate no índice único do banco — melhor dizer do que engolir.
      setErro(String(e?.message || e).includes("projects_slug_key")
        ? "Esse slug já está em outra oferta."
        : (e?.message || "Não consegui salvar."));
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "9px 11px", borderRadius: 9, fontSize: 13.5,
    border: `1px solid ${T.border}`, background: T.surface, color: T.ink,
  };

  const pronta = projeto.slug && projeto.metaAccountId && projeto.metaCampaignPrefix;

  return (
    <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Identidade e custo da oferta</Eyebrow>
        {!editando && (
          <button onClick={abrir}
            style={{ fontSize: 12.5, color: T.primaryText, background: "transparent", border: "none", cursor: "pointer" }}>
            Editar
          </button>
        )}
      </div>

      {!editando ? (
        <>
          {!pronta && (
            <div style={{ fontSize: 12.5, color: T.neg, background: T.negBg, padding: "8px 11px",
              borderRadius: 8, marginBottom: 14 }}>
              Falta preencher: {[
                !projeto.slug && "slug (sem ele a oferta não recebe venda)",
                !projeto.metaAccountId && "conta de anúncio",
                !projeto.metaCampaignPrefix && "prefixo da campanha",
              ].filter(Boolean).join(" · ")}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 12 }}>
            {[...CAMPOS, ...CUSTOS].map((c) => {
              const v = projeto[c.k];
              const vazio = v === "" || v === null || v === undefined;
              return (
                <div key={c.k}>
                  <div style={{ fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: 0.6 }}>{c.label}</div>
                  <div style={{ fontSize: 13.5, color: vazio ? T.faint : T.ink, wordBreak: "break-all" }}>
                    {vazio ? "—" : String(v)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {CAMPOS.map((c) => (
            <label key={c.k} style={{ display: "block" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <input value={draft[c.k] ?? ""} placeholder={c.ph} style={inputStyle}
                onChange={(e) => setDraft((d) => ({ ...d, [c.k]: e.target.value }))} />
              <div style={{ fontSize: 11.5, color: T.faint, marginTop: 3 }}>{c.dica}</div>
            </label>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
            {CUSTOS.map((c) => (
              <label key={c.k} style={{ display: "block" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
                <input type="number" step={c.passo} value={draft[c.k] ?? 0} placeholder={c.ph} style={inputStyle}
                  onChange={(e) => setDraft((d) => ({ ...d, [c.k]: e.target.value }))} />
              </label>
            ))}
          </div>
          {erro && <div style={{ fontSize: 12.5, color: T.neg }}>{erro}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={salvar} disabled={salvando}
              style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: T.primary,
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button onClick={() => setEditando(false)}
              style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${T.border}`,
                background: T.surface, color: T.muted, fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
