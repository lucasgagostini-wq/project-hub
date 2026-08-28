import React, { useCallback, useEffect, useState } from "react";
import { IconPlus as Plus, IconTrash as Trash } from "../../lib/icons";
import { T, glassStyle } from "../../lib/theme";
import { Eyebrow } from "../../components";
import { listarDiario, registrarNoDiario, apagarDoDiario, diaSP } from "../../lib/api/placar";

/**
 * Diário da oferta — o que mudou e quando.
 *
 * Substitui o "calendário da oferta", que mostrava quatro ações fixas escritas no
 * código ("Subiu novo criativo", "Aumentou verba 30%") em um mês de mentira. Aqui
 * o que aparece é o que alguém registrou, e serve pra uma coisa só: explicar por
 * que o número do placar mudou de um dia pro outro.
 */

const TIPOS = [
  { id: "verba", label: "Verba", cor: "#F59E0B" },
  { id: "criativo", label: "Criativo", cor: "#8B5CF6" },
  { id: "preco", label: "Preço", cor: "#0EA5E9" },
  { id: "pagina", label: "Página", cor: "#10B981" },
  { id: "oferta", label: "Oferta", cor: "#EC4899" },
  { id: "outro", label: "Outro", cor: "#94A3B8" },
];

const corDoTipo = (t) => (TIPOS.find((x) => x.id === t) || TIPOS[5]).cor;
const rotuloDoTipo = (t) => (TIPOS.find((x) => x.id === t) || TIPOS[5]).label;

function dataCurta(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}`;
}

export default function DiarioOferta({ projeto, autorId }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [abrindo, setAbrindo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("verba");
  const [quando, setQuando] = useState(diaSP());
  const [salvando, setSalvando] = useState(false);

  const buscar = useCallback(async () => {
    setCarregando(true);
    try {
      setItens(await listarDiario(projeto.id));
      setErro(null);
    } catch (e) {
      setErro(e?.message || "Não consegui ler o diário.");
    } finally {
      setCarregando(false);
    }
  }, [projeto.id]);

  useEffect(() => { buscar(); }, [buscar]);

  const registrar = async () => {
    if (!titulo.trim()) return;
    setSalvando(true);
    try {
      await registrarNoDiario(projeto.id, { titulo, tipo, ocorreu_em: quando, autor_id: autorId || null });
      setTitulo("");
      setAbrindo(false);
      await buscar();
    } catch (e) {
      setErro(e?.message || "Não consegui registrar.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id) => {
    try {
      await apagarDoDiario(id);
      setItens((xs) => xs.filter((x) => x.id !== id));
    } catch (e) {
      setErro(e?.message || "Não consegui apagar.");
    }
  };

  const inputStyle = {
    padding: "8px 10px", borderRadius: 9, fontSize: 13,
    border: `1px solid ${T.border}`, background: T.surface, color: T.ink,
  };

  return (
    <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <Eyebrow style={{ marginBottom: 14 }}>Diário da oferta</Eyebrow>
        <button onClick={() => setAbrindo((v) => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.primaryText,
            background: "transparent", border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Registrar
        </button>
      </div>

      {abrindo && (
        <div style={{ display: "grid", gap: 9, marginBottom: 18 }}>
          <input autoFocus value={titulo} placeholder="O que mudou? Ex.: subiu verba do CBO pra R$300/dia"
            style={inputStyle} onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && registrar()} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
              {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input type="date" value={quando} onChange={(e) => setQuando(e.target.value)} style={inputStyle} />
            <button onClick={registrar} disabled={salvando || !titulo.trim()}
              style={{ padding: "8px 15px", borderRadius: 9, border: "none", background: T.primary,
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
                opacity: !titulo.trim() ? 0.5 : 1 }}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {erro && <div style={{ fontSize: 12.5, color: T.neg, marginBottom: 12 }}>{erro}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {carregando && <span style={{ fontSize: 13, color: T.faint }}>Carregando…</span>}
        {!carregando && itens.length === 0 && (
          <span style={{ fontSize: 13, color: T.faint }}>
            Nada registrado ainda. Anote aqui toda mudança de verba, criativo, preço ou página —
            é o que explica a variação do placar depois.
          </span>
        )}
        {itens.map((it) => (
          <div key={it.id} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ fontSize: 11.5, color: T.faint, fontVariantNumeric: "tabular-nums", paddingTop: 2, minWidth: 34 }}>
              {dataCurta(it.ocorreu_em)}
            </span>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: corDoTipo(it.tipo), marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>{it.titulo}</div>
              <div style={{ fontSize: 11.5, color: T.faint }}>{rotuloDoTipo(it.tipo)}</div>
            </div>
            <button onClick={() => remover(it.id)} title="Apagar"
              style={{ background: "transparent", border: "none", color: T.faint, cursor: "pointer", padding: 2 }}>
              <Trash size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
