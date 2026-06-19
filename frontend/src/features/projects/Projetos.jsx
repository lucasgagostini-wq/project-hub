import React, { useState } from "react";
import { IconSearch as Search, IconPlus as Plus } from "../../lib/icons";
import { T, fontBody } from "../../lib/theme";
import { PageHeader } from "../../components";
import { CardProjeto } from "../home/HomeGeral";

export default function Projetos({ projetos = [], onAbrir, onNovo, onSetImagem }) {
  const [busca, setBusca] = useState("");
  const lista = projetos.filter((p) =>
    (p.nome || "").toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        titulo="Projetos"
        sub="Cada projeto tem sua própria área de gestão de oferta."
        acao={
          <button onClick={onNovo}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11,
              border: "none", background: T.primary, color: "#fff", fontSize: 13.5, fontWeight: 600 }}>
            <Plus size={16} /> Novo projeto
          </button>
        }
      />

      <div style={{ position: "relative", marginBottom: 20, maxWidth: 320 }}>
        <Search size={15} color={T.faint} style={{ position: "absolute", left: 12, top: 11 }} />
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar projeto"
          style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 11, border: `1px solid ${T.border}`,
            background: T.surfaceAlt, color: T.ink, fontSize: 13.5, outline: "none", fontFamily: fontBody }} />
      </div>

      {lista.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: T.faint, fontSize: 14 }}>
          {busca ? "Nenhum projeto encontrado." : "Nenhum projeto ainda. Crie o primeiro!"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 14 }}>
          {lista.map((p) => <CardProjeto key={p.id} p={p} onAbrir={onAbrir} onSetImagem={onSetImagem} />)}
        </div>
      )}
    </div>
  );
}
