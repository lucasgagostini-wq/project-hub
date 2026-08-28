import React, { useCallback, useEffect, useState } from "react";
import {
  IconPlus as Plus, IconTrash as Trash, IconEye as Eye, IconCopy as Copy,
  IconLock as Lock, IconExternalLink as ExternalLink,
} from "../../lib/icons";
import { T, glassStyle, fontDisplay } from "../../lib/theme";
import { Eyebrow } from "../../components";
import { useMobile } from "../../lib/context";
import {
  listarAcessos, abrirCofre, guardarAcesso, revelarAcesso, apagarAcesso,
  listarLinks, guardarLink, apagarLink,
  listarNotas, salvarNota, apagarNota,
} from "../../lib/api/quartel";
import { senhaDaSessao, guardarSenhaNaSessao } from "../../lib/cofre";

/**
 * Central da oferta — onde a operação dela mora: acessos, links e copy.
 *
 * O cofre não guarda a senha-mestra em lugar nenhum: ela fica em memória
 * enquanto a aba estiver aberta e some no F5. Isso é de propósito.
 */

const TIPOS_ACESSO = [
  { id: "conta_ads", label: "Conta de anúncio" },
  { id: "pixel", label: "Pixel" },
  { id: "gateway", label: "Gateway" },
  { id: "dominio", label: "Domínio" },
  { id: "email", label: "E-mail" },
  { id: "banco", label: "Banco / financeiro" },
  { id: "outro", label: "Outro" },
];

const TIPOS_LINK = [
  { id: "funil", label: "Funil" },
  { id: "checkout", label: "Checkout" },
  { id: "obrigado", label: "Obrigado" },
  { id: "criativos", label: "Criativos" },
  { id: "planilha", label: "Planilha" },
  { id: "repo", label: "Repositório" },
  { id: "outro", label: "Outro" },
];

const TIPOS_NOTA = [
  { id: "headline", label: "Headline" },
  { id: "vsl", label: "VSL" },
  { id: "checkout", label: "Checkout" },
  { id: "prompt", label: "Prompt" },
  { id: "copy", label: "Copy" },
  { id: "outro", label: "Outro" },
];

const rotulo = (lista, id) => (lista.find((t) => t.id === id) || { label: id }).label;

const input = {
  padding: "9px 11px", borderRadius: 9, fontSize: 13.5,
  border: `1px solid ${T.border}`, background: T.surface, color: T.ink, width: "100%",
};
const botao = {
  padding: "9px 16px", borderRadius: 9, border: "none", background: T.primary,
  color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const botaoFraco = {
  padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
  background: T.surface, color: T.muted, fontSize: 12.5, cursor: "pointer",
};

function Secao({ titulo, acao, children }) {
  return (
    <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <Eyebrow style={{ marginBottom: 14 }}>{titulo}</Eyebrow>
        {acao}
      </div>
      {children}
    </section>
  );
}

// ── Cofre ───────────────────────────────────────────────────────────────────

function Acessos({ projeto }) {
  const [itens, setItens] = useState([]);
  const [aberto, setAberto] = useState(!!senhaDaSessao());
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [revelados, setRevelados] = useState({});
  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState({ titulo: "", tipo: "conta_ads", identificador: "", segredo: "", obs: "" });

  const buscar = useCallback(async () => {
    try { setItens(await listarAcessos(projeto.id)); }
    catch (e) { setErro(e?.message || "Não consegui ler os acessos."); }
  }, [projeto.id]);

  useEffect(() => { buscar(); }, [buscar]);

  const destrancar = async () => {
    setErro(null);
    try {
      if (await abrirCofre(projeto.id, senha)) {
        guardarSenhaNaSessao(senha);
        setSenha("");
        setAberto(true);
      } else {
        setErro("Senha-mestra incorreta.");
      }
    } catch (e) { setErro(e?.message || "Não consegui abrir o cofre."); }
  };

  const revelar = async (linha) => {
    try {
      const claro = await revelarAcesso(linha, senhaDaSessao());
      setRevelados((r) => ({ ...r, [linha.id]: claro }));
    } catch (e) { setErro(e?.message || "Não consegui abrir este item."); }
  };

  const copiar = async (linha) => {
    try {
      const claro = revelados[linha.id] ?? (await revelarAcesso(linha, senhaDaSessao()));
      await navigator.clipboard.writeText(claro);
    } catch (e) { setErro(e?.message || "Não consegui copiar."); }
  };

  const salvar = async () => {
    setErro(null);
    try {
      await guardarAcesso(projeto.id, novo, senhaDaSessao());
      setNovo({ titulo: "", tipo: "conta_ads", identificador: "", segredo: "", obs: "" });
      setCriando(false);
      await buscar();
    } catch (e) { setErro(e?.message || "Não consegui guardar."); }
  };

  const remover = async (id) => {
    try { await apagarAcesso(id); setItens((xs) => xs.filter((x) => x.id !== id)); }
    catch (e) { setErro(e?.message || "Não consegui apagar."); }
  };

  return (
    <Secao
      titulo="Acessos e contas"
      acao={aberto && (
        <button onClick={() => setCriando((v) => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5,
            color: T.primaryText, background: "transparent", border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Novo acesso
        </button>
      )}
    >
      {!aberto ? (
        <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: T.muted, fontSize: 13 }}>
            <Lock size={15} /> O conteúdo é cifrado no seu navegador. Digite a senha-mestra pra abrir.
          </div>
          <input type="password" value={senha} placeholder="senha-mestra" style={input}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && destrancar()} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={destrancar} style={botao}>Abrir cofre</button>
            <span style={{ fontSize: 11.5, color: T.faint }}>
              {itens.length === 0 ? "primeira vez: a senha que você digitar vira a do cofre" : `${itens.length} item(ns) guardado(s)`}
            </span>
          </div>
          {erro && <div style={{ fontSize: 12.5, color: T.neg }}>{erro}</div>}
        </div>
      ) : (
        <>
          {criando && (
            <div style={{ display: "grid", gap: 9, marginBottom: 18, maxWidth: 560 }}>
              <input autoFocus value={novo.titulo} placeholder="Nome do acesso — ex.: Conta de anúncio Cecilia"
                style={input} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select value={novo.tipo} style={{ ...input, width: "auto" }}
                  onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
                  {TIPOS_ACESSO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input value={novo.identificador} placeholder="login / e-mail (fica visível)"
                  style={{ ...input, flex: 1, minWidth: 180 }}
                  onChange={(e) => setNovo({ ...novo, identificador: e.target.value })} />
              </div>
              <input type="password" value={novo.segredo} placeholder="senha ou chave (cifrada)"
                style={input} onChange={(e) => setNovo({ ...novo, segredo: e.target.value })} />
              <input value={novo.obs} placeholder="observação (visível) — ex.: 2FA no celular do Folha"
                style={input} onChange={(e) => setNovo({ ...novo, obs: e.target.value })} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={salvar} style={botao}>Guardar</button>
                <button onClick={() => setCriando(false)} style={botaoFraco}>Cancelar</button>
              </div>
            </div>
          )}

          {erro && <div style={{ fontSize: 12.5, color: T.neg, marginBottom: 10 }}>{erro}</div>}

          <div style={{ display: "grid", gap: 12 }}>
            {itens.length === 0 && (
              <span style={{ fontSize: 13, color: T.faint }}>
                Nenhum acesso guardado. Comece pela conta de anúncio, o gateway e o domínio.
              </span>
            )}
            {itens.map((it) => (
              <div key={it.id} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                paddingBottom: 12, borderBottom: `1px solid ${T.hair}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{it.titulo}</div>
                  <div style={{ fontSize: 12, color: T.faint }}>
                    {rotulo(TIPOS_ACESSO, it.tipo)}{it.identificador ? ` · ${it.identificador}` : ""}
                  </div>
                  {it.obs && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{it.obs}</div>}
                  <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, marginTop: 5, wordBreak: "break-all" }}>
                    {revelados[it.id] ?? "••••••••••"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => revelar(it)} title="Revelar" style={botaoFraco}><Eye size={13} /></button>
                  <button onClick={() => copiar(it)} title="Copiar" style={botaoFraco}><Copy size={13} /></button>
                  <button onClick={() => remover(it.id)} title="Apagar" style={botaoFraco}><Trash size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Secao>
  );
}

// ── Links ───────────────────────────────────────────────────────────────────

function Links({ projeto }) {
  const [itens, setItens] = useState([]);
  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState({ tipo: "funil", titulo: "", url: "" });
  const [erro, setErro] = useState(null);

  const buscar = useCallback(async () => {
    try { setItens(await listarLinks(projeto.id)); }
    catch (e) { setErro(e?.message || "Não consegui ler os links."); }
  }, [projeto.id]);

  useEffect(() => { buscar(); }, [buscar]);

  const salvar = async () => {
    setErro(null);
    try {
      await guardarLink(projeto.id, novo);
      setNovo({ tipo: "funil", titulo: "", url: "" });
      setCriando(false);
      await buscar();
    } catch (e) { setErro(e?.message || "Não consegui salvar."); }
  };

  return (
    <Secao
      titulo="Links da oferta"
      acao={
        <button onClick={() => setCriando((v) => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5,
            color: T.primaryText, background: "transparent", border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Novo link
        </button>
      }
    >
      {criando && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <select value={novo.tipo} style={{ ...input, width: "auto" }}
            onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}>
            {TIPOS_LINK.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input value={novo.titulo} placeholder="rótulo (opcional)" style={{ ...input, width: 180 }}
            onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} />
          <input value={novo.url} placeholder="https://…" style={{ ...input, flex: 1, minWidth: 220 }}
            onChange={(e) => setNovo({ ...novo, url: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && salvar()} />
          <button onClick={salvar} style={botao}>Salvar</button>
        </div>
      )}

      {erro && <div style={{ fontSize: 12.5, color: T.neg, marginBottom: 10 }}>{erro}</div>}

      <div style={{ display: "grid", gap: 9 }}>
        {itens.length === 0 && <span style={{ fontSize: 13, color: T.faint }}>Nenhum link ainda.</span>}
        {itens.map((l) => (
          <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.faint, minWidth: 74, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {rotulo(TIPOS_LINK, l.tipo)}
            </span>
            <a href={l.url} target="_blank" rel="noreferrer"
              style={{ color: T.primaryText, fontSize: 13.5, textDecoration: "none", flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {l.titulo || l.url} <ExternalLink size={12} />
            </a>
            <button onClick={async () => { await apagarLink(l.id); buscar(); }} title="Apagar" style={botaoFraco}>
              <Trash size={13} />
            </button>
          </div>
        ))}
      </div>
    </Secao>
  );
}

// ── Copy e prompts ──────────────────────────────────────────────────────────

function Copys({ projeto }) {
  const [itens, setItens] = useState([]);
  const [editando, setEditando] = useState(null); // {id?, tipo, titulo, conteudo}
  const [erro, setErro] = useState(null);

  const buscar = useCallback(async () => {
    try { setItens(await listarNotas(projeto.id)); }
    catch (e) { setErro(e?.message || "Não consegui ler as copies."); }
  }, [projeto.id]);

  useEffect(() => { buscar(); }, [buscar]);

  const salvar = async () => {
    setErro(null);
    try {
      await salvarNota(projeto.id, editando);
      setEditando(null);
      await buscar();
    } catch (e) { setErro(e?.message || "Não consegui salvar."); }
  };

  return (
    <Secao
      titulo="Copy e prompts"
      acao={
        <button onClick={() => setEditando({ tipo: "copy", titulo: "", conteudo: "" })}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5,
            color: T.primaryText, background: "transparent", border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Nova
        </button>
      }
    >
      {editando && (
        <div style={{ display: "grid", gap: 9, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={editando.tipo} style={{ ...input, width: "auto" }}
              onChange={(e) => setEditando({ ...editando, tipo: e.target.value })}>
              {TIPOS_NOTA.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input autoFocus value={editando.titulo} placeholder="título — ex.: Headline da tela 1 (braço B)"
              style={{ ...input, flex: 1, minWidth: 200 }}
              onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} />
          </div>
          <textarea value={editando.conteudo || ""} rows={7} placeholder="conteúdo"
            style={{ ...input, fontFamily: "ui-monospace, monospace", lineHeight: 1.5 }}
            onChange={(e) => setEditando({ ...editando, conteudo: e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={salvar} style={botao}>Salvar</button>
            <button onClick={() => setEditando(null)} style={botaoFraco}>Cancelar</button>
          </div>
        </div>
      )}

      {erro && <div style={{ fontSize: 12.5, color: T.neg, marginBottom: 10 }}>{erro}</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {itens.length === 0 && !editando && (
          <span style={{ fontSize: 13, color: T.faint }}>
            Nenhuma copy guardada. Aqui entram headline, VSL, checkout e os prompts do entregável.
          </span>
        )}
        {itens.map((n) => (
          <div key={n.id} style={{ paddingBottom: 12, borderBottom: `1px solid ${T.hair}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14 }}>{n.titulo}</div>
                <div style={{ fontSize: 11.5, color: T.faint }}>{rotulo(TIPOS_NOTA, n.tipo)}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setEditando(n)} style={botaoFraco}>Editar</button>
                <button onClick={async () => { await apagarNota(n.id); buscar(); }} style={botaoFraco}>
                  <Trash size={13} />
                </button>
              </div>
            </div>
            {n.conteudo && (
              <pre style={{ margin: "8px 0 0", fontSize: 12.5, color: T.muted, whiteSpace: "pre-wrap",
                fontFamily: "ui-monospace, monospace", maxHeight: 160, overflow: "auto" }}>{n.conteudo}</pre>
            )}
          </div>
        ))}
      </div>
    </Secao>
  );
}

export default function CentralTab({ projeto }) {
  const m = useMobile();
  return (
    <div style={{ display: "grid", gap: 22, gridTemplateColumns: m ? "1fr" : "1fr 1fr", alignItems: "start" }}>
      <div style={{ display: "grid", gap: 22 }}>
        <Acessos projeto={projeto} />
        <Links projeto={projeto} />
      </div>
      <Copys projeto={projeto} />
    </div>
  );
}
