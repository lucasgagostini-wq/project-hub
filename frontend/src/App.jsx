import React, { useState, useEffect } from "react";
import {
  IconDeviceDesktop as Monitor,
  IconDeviceMobile as Smartphone,
  IconMoon as MoonIcon,
  IconSun as SunIcon,
} from "@tabler/icons-react";

import { T, fontBody, buildGlobalStyle, applyTheme, getThemeMode } from "./lib/theme";
import { MobileCtx } from "./lib/context";
import { supabase, isMockMode } from "./lib/supabase";
import {
  MOCK_USERS, MOCK_PROJETOS, MOCK_ATIVIDADE, MOCK_TAREFAS,
  MOCK_REUNIOES, MOCK_NAO_ATRIBUIDOS,
} from "./lib/api/mockData";
import { signOut, listUsers, getActor, setActor, updateProfile } from "./lib/api/auth";
import { listProjects, createProject, updateProject, upsertOffer, upsertPersona, upsertConexoes } from "./lib/api/projects";
import { listTasks, createTask, updateTask } from "./lib/api/tasks";
import { listMeetings } from "./lib/api/meetings";
import { logActivity, listActivity } from "./lib/api/activity";
import { listIdeas, createIdea, updateIdea, deleteIdea } from "./lib/api/ideas";
import { gerarSnapshot } from "./lib/api/clone";

import Login             from "./features/auth/Login";
import Sidebar           from "./features/layout/Sidebar";
import MobileTopBar      from "./features/layout/MobileTopBar";
import MobileBottomNav   from "./features/layout/MobileBottomNav";
import HomeGeral         from "./features/home/HomeGeral";
import CalendarioGeral   from "./features/calendar/CalendarioGeral";
import TarefasGerais     from "./features/tasks/TarefasGerais";
import Reunioes          from "./features/meetings/Reunioes";
import Projetos          from "./features/projects/Projetos";
import ProjetoDetalhe    from "./features/projects/ProjetoDetalhe";
import NovoProjeto       from "./features/projects/NovoProjeto";
import IdeiasGerais      from "./features/ideas/IdeiasGerais";
import MeuPerfil         from "./features/profile/MeuPerfil";

// Persistência local enquanto não há Supabase (modo mock).
// Mantém projetos/atividade salvos no navegador para sobreviver a reload.
function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* quota cheia (ex.: imagens grandes em base64) — ignora */
  }
}

function useIsMobile(breakpoint = 760) {
  const [m, setM] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return m;
}

export default function App() {
  // ── Auth ────────────────────────────────────────────────────────────
  const [logado, setLogado]             = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [usuarios, setUsuarios]         = useState(MOCK_USERS);
  const [authLoading, setAuthLoading]   = useState(!isMockMode);

  // ── Navigation ──────────────────────────────────────────────────────
  const [secao, setSecao]           = useState("home");
  const [projAtivo, setProjAtivo]   = useState(null);
  const [abaProjeto, setAbaProjeto] = useState("resumo");
  const [novoOpen, setNovoOpen]     = useState(false);
  const [novoInicial, setNovoInicial] = useState(null); // prefill ao "virar projeto"
  const [perfilOpen, setPerfilOpen]   = useState(false); // modal "Meu perfil"

  // ── Tema (claro / escuro) ────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState(getThemeMode());
  const toggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark";
    applyTheme(next);     // muta o T compartilhado + persiste
    setThemeMode(next);   // força o re-render que repinta todo o app
  };

  // ── Data ────────────────────────────────────────────────────────────
  const [projetos, setProjetos]           = useState(isMockMode ? loadLocal("ph_projetos", MOCK_PROJETOS) : []);
  const [atividade, setAtividade]         = useState(isMockMode ? loadLocal("ph_atividade", MOCK_ATIVIDADE) : []);
  const [ideias, setIdeias]               = useState(isMockMode ? loadLocal("ph_ideias", []) : []);
  const [tarefas, setTarefas]             = useState(isMockMode ? MOCK_TAREFAS : []);
  const [reunioes, setReunioes]           = useState(isMockMode ? MOCK_REUNIOES : []);
  const [naoAtribuidos, setNaoAtribuidos] = useState(MOCK_NAO_ATRIBUIDOS);

  // ── Responsive ──────────────────────────────────────────────────────
  const autoMobile = useIsMobile();
  const [previewMode, setPreviewMode] = useState("web");
  const isMobile = previewMode === "mobile" ? true : previewMode === "web" ? false : autoMobile;

  // ── Boot do modo "time" (sem login): carrega os perfis e restaura o ator ──
  useEffect(() => {
    if (isMockMode) { setAuthLoading(false); return; }
    (async () => {
      try {
        const users = await listUsers();
        setUsuarios(users);
        const actor = getActor();
        if (actor) {
          setUsuarioAtual(users.find((u) => u.id === actor.id) || actor);
          await carregarDados();
          setLogado(true);
        }
      } catch (e) {
        console.error("[App] boot:", e);
      } finally {
        setAuthLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistência local (modo mock) ───────────────────────────────────
  useEffect(() => { if (isMockMode) saveLocal("ph_projetos", projetos); }, [projetos]);
  useEffect(() => { if (isMockMode) saveLocal("ph_atividade", atividade); }, [atividade]);
  useEffect(() => { if (isMockMode) saveLocal("ph_ideias", ideias); }, [ideias]);

  // Carrega os dados COMPARTILHADOS (Supabase). Atividade vem do audit_log.
  async function carregarDados() {
    const [projs, tasks, meetings, ideas, ativ] = await Promise.all([
      listProjects(), listTasks(), listMeetings(), listIdeas(), listActivity(),
    ]);
    setProjetos(projs);
    setTarefas(tasks);
    setReunioes(meetings);
    setIdeias(ideas);
    setAtividade(ativ);
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  const userById = (id) => usuarios.find((u) => u.id === id);
  const projById = (id) => projetos.find((p) => p.id === id);

  const registrar = async (projId, acao) => {
    const entry = {
      id: "a" + Date.now(), proj: projId,
      user: usuarioAtual?.id, acao, quando: "Agora mesmo",
    };
    setAtividade((a) => [entry, ...a]);
    if (!isMockMode) await logActivity(projId, usuarioAtual?.id, acao).catch(() => {});
  };

  const navTo       = (s) => { setSecao(s); setProjAtivo(null); };
  const abrirProjeto = (id) => { setProjAtivo(id); setAbaProjeto("resumo"); };

  const setImagem = (id, img) =>
    setProjetos((ps) => ps.map((p) => (p.id === id ? { ...p, imagem: img } : p)));

  // ── Ideias gerais (mock = estado/localStorage; Supabase = tabela ideas) ──
  const addIdeia = async (dados) => {
    if (isMockMode) {
      setIdeias((xs) => [{ id: "ig-" + Date.now(), status: "ideia", criadoEm: new Date().toISOString(), ...dados }, ...xs]);
      return;
    }
    try {
      const nova = await createIdea({ ...dados, created_by: usuarioAtual?.id });
      setIdeias((xs) => [nova, ...xs]);
    } catch (e) { console.error("[ideias] criar:", e); }
  };
  const patchIdeia = async (id, campos) => {
    setIdeias((xs) => xs.map((i) => (i.id === id ? { ...i, ...campos } : i)));
    if (!isMockMode) await updateIdea(id, campos).catch((e) => console.error("[ideias] atualizar:", e));
  };
  const removeIdeia = async (id) => {
    setIdeias((xs) => xs.filter((i) => i.id !== id));
    if (!isMockMode) await deleteIdea(id).catch((e) => console.error("[ideias] remover:", e));
  };

  // ── Tarefas (criar/delegar + concluir) ──────────────────────────────────
  const criarTarefa = async (payload) => {
    const base = { ...payload, created_by: usuarioAtual?.id };
    if (isMockMode) {
      setTarefas((ts) => [{ id: "t" + Date.now(), feito: false, delegadoPor: usuarioAtual?.id, ...base }, ...ts]);
    } else {
      try {
        const nova = await createTask(base);
        setTarefas((ts) => [nova, ...ts]);
      } catch (e) { console.error("[tarefas] criar:", e); return; }
    }
    const alvo = usuarios.find((u) => u.id === payload.resp);
    const nomeAlvo = alvo?.nome || alvo?.name;
    const acao = payload.resp && payload.resp !== usuarioAtual?.id
      ? `delegou a tarefa "${payload.titulo}" para ${nomeAlvo || "alguém"}`
      : `criou a tarefa "${payload.titulo}"`;
    await registrar(payload.proj || null, acao);
  };

  const toggleTarefa = async (id, feito) => {
    setTarefas((ts) => ts.map((t) => (t.id === id ? { ...t, feito } : t)));
    if (!isMockMode) await updateTask(id, { feito }).catch((e) => console.error("[tarefas] concluir:", e));
  };

  const handleSair = async () => {
    await signOut().catch(() => {});
    setLogado(false);
    setUsuarioAtual(null);
  };

  // ── Login handler ────────────────────────────────────────────────────
  const handleEntrar = async (perfil) => {
    if (isMockMode) {
      setUsuarioAtual(perfil);
      setLogado(true);
      return;
    }
    setActor(perfil);
    setUsuarioAtual(perfil);
    try { await carregarDados(); } catch (e) { console.error("[App] entrar:", e); }
    setLogado(true);
  };

  // Troca de perfil (sem deslogar): muda o ator das próximas ações. Dados são compartilhados.
  const trocarPerfil = (perfil) => {
    if (!isMockMode) setActor(perfil);
    setUsuarioAtual(perfil);
  };

  // Salva edições do próprio perfil (apelido, cor, foto) e propaga no app.
  const salvarPerfil = async (patch) => {
    const merged = {
      ...usuarioAtual,
      nome: patch.nome, name: patch.nome,
      cor: patch.cor, color: patch.cor,
      inicial: patch.inicial, initial: patch.inicial,
      avatar: patch.avatar,
    };
    setUsuarioAtual(merged);
    setUsuarios((us) => us.map((u) => (u.id === merged.id ? merged : u)));
    if (!isMockMode) setActor(merged);
    try { await updateProfile(merged.id, patch); } catch (e) { console.error("[perfil] salvar:", e); }
    setPerfilOpen(false);
  };

  // ── Loading screen ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <>
        <style>{buildGlobalStyle()}</style>
        <div className="grid-bg" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", color: T.muted, fontSize: 14,
        }}>
          Conectando…
        </div>
      </>
    );
  }

  // ── Login screen ─────────────────────────────────────────────────────
  if (!logado) {
    return (
      <>
        <style>{buildGlobalStyle()}</style>
        <Login
          usuarios={usuarios}
          onEntrar={handleEntrar}
        />
      </>
    );
  }

  const projeto = projAtivo ? projById(projAtivo) : null;

  return (
    <MobileCtx.Provider value={isMobile}>
      <div
        className="grid-bg"
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          minHeight: "100vh",
          fontFamily: fontBody,
          color: T.ink,
        }}
      >
        <style>{buildGlobalStyle()}</style>

        {/* ── Layout chrome ── */}
        {isMobile ? (
          <MobileTopBar
            usuario={usuarioAtual}
            usuarios={usuarios}
            onTrocar={trocarPerfil}
            onEditarPerfil={() => setPerfilOpen(true)}
            onSair={handleSair}
          />
        ) : (
          <Sidebar
            secao={secao}
            onNav={navTo}
            usuario={usuarioAtual}
            usuarios={usuarios}
            onTrocar={trocarPerfil}
            onEditarPerfil={() => setPerfilOpen(true)}
            onSair={handleSair}
          />
        )}

        {/* ── Main content ── */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: isMobile ? "16px 16px 92px" : "30px 40px 60px",
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {projeto ? (
            <ProjetoDetalhe
              projeto={projeto}
              aba={abaProjeto}
              setAba={setAbaProjeto}
              onVoltar={() => setProjAtivo(null)}
              userById={userById}
              atividade={atividade.filter((a) => a.proj === projeto.id)}
              onRegistrar={(acao) => registrar(projeto.id, acao)}
              naoAtribuidos={naoAtribuidos}
              onAtribuir={(ad) => {
                setNaoAtribuidos((prev) => prev.filter((x) => x.id !== ad.id));
                registrar(projeto.id, `atribuiu o anúncio "${ad.nome}" a este projeto`);
              }}
              onEditarPersona={async (novaPersona) => {
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, persona: novaPersona } : p))
                );
                if (!isMockMode) await upsertPersona(projeto.id, novaPersona).catch(console.error);
                registrar(projeto.id, "editou a persona");
              }}
              onEditarOferta={async (campos) => {
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, ...campos } : p))
                );
                if (!isMockMode) await upsertOffer(projeto.id, campos).catch(console.error);
                registrar(projeto.id, "atualizou a estruturação da oferta");
              }}
              onEditarEstrutura={async (qual, novo) => {
                setProjetos((ps) =>
                  ps.map((p) =>
                    p.id === projeto.id
                      ? { ...p, estruturas: { ...(p.estruturas || {}), [qual]: novo } }
                      : p
                  )
                );
                if (!isMockMode) {
                  const updated = { ...projeto.estruturas, [qual]: novo };
                  await updateProject(projeto.id, { estruturas: updated }).catch(console.error);
                }
                registrar(projeto.id, `editou a estrutura de ${qual}`);
              }}
              onEditarConexoes={async (conexoes, label) => {
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, conexoes } : p))
                );
                if (!isMockMode) await upsertConexoes(projeto.id, conexoes).catch(console.error);
                if (label) registrar(projeto.id, label);
              }}
              onSyncMetricas={async (patch) => {
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, ...patch } : p))
                );
                if (!isMockMode) await updateProject(projeto.id, patch).catch(console.error);
                registrar(projeto.id, "sincronizou as métricas das integrações");
              }}
              onEditarGasto={async (gastoAds) => {
                const fat = projeto.faturamento || 0;
                const patch = { gastoAds, lucro: fat - gastoAds };
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, ...patch } : p))
                );
                if (!isMockMode) await updateProject(projeto.id, patch).catch(console.error);
                registrar(projeto.id, "informou o gasto de anúncios");
              }}
              onEditarIdeias={async (ideias, label) => {
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, ideias } : p))
                );
                if (!isMockMode) await updateProject(projeto.id, { ideias }).catch(console.error);
                if (label) registrar(projeto.id, label);
              }}
              onGerarSnapshot={async () => {
                const url = projeto.tynk?.sourceUrl;
                if (!url) throw new Error("URL da oferta não encontrada.");
                const snap = await gerarSnapshot({ url, projectId: projeto.id });
                const tynkUpdated = { ...projeto.tynk, snapshot: snap };
                setProjetos((ps) =>
                  ps.map((p) => (p.id === projeto.id ? { ...p, tynk: tynkUpdated } : p))
                );
                if (!isMockMode) await updateProject(projeto.id, { tynk: tynkUpdated }).catch(console.error);
              }}
            />
          ) : (
            <>
              {secao === "home" && (
                <HomeGeral
                  projetos={projetos}
                  onAbrir={abrirProjeto}
                  onSetImagem={setImagem}
                />
              )}
              {secao === "projetos" && (
                <Projetos
                  projetos={projetos}
                  onAbrir={abrirProjeto}
                  onNovo={() => setNovoOpen(true)}
                  onSetImagem={setImagem}
                />
              )}
              {secao === "ideias" && (
                <IdeiasGerais
                  ideias={ideias}
                  onAdd={addIdeia}
                  onPatch={patchIdeia}
                  onRemove={removeIdeia}
                  onCriarProjeto={(idea) => {
                    setNovoInicial({
                      nome: idea.titulo || "",
                      nicho: idea.nicho || "",
                      oferta: idea.descricao || "",
                    });
                    setNovoOpen(true);
                  }}
                />
              )}
              {secao === "calendario" && (
                <CalendarioGeral
                  tarefas={tarefas}
                  reunioes={reunioes}
                  userById={userById}
                  projById={projById}
                  usuarios={usuarios}
                />
              )}
              {secao === "tarefas" && (
                <TarefasGerais
                  tarefas={tarefas}
                  usuarios={usuarios}
                  usuarioAtual={usuarioAtual}
                  projetos={projetos}
                  userById={userById}
                  projById={projById}
                  onCriar={criarTarefa}
                  onToggle={toggleTarefa}
                />
              )}
              {secao === "reunioes" && (
                <Reunioes reunioes={reunioes} userById={userById} />
              )}
            </>
          )}
        </main>

        {/* ── Novo projeto overlay ── */}
        {novoOpen && (
          <div
            onClick={() => { setNovoOpen(false); setNovoInicial(null); }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.28)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-start", justifyContent: "center",
              padding: "0", overflow: "auto", zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: T.surface, minHeight: "100vh", width: "100%",
                maxWidth: 760, padding: "32px 32px 60px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
              }}
            >
              <NovoProjeto
                inicial={novoInicial}
                onVoltar={() => { setNovoOpen(false); setNovoInicial(null); }}
                onCriar={async (p) => {
                  let projeto = p;
                  if (!isMockMode) {
                    try { projeto = await createProject(p); }
                    catch (e) { console.error("[App] criar projeto:", e); }
                  }
                  setProjetos((ps) => [...ps, projeto]);
                  setNovoOpen(false);
                  setNovoInicial(null);
                  await registrar(projeto.id, "criou o projeto");
                  abrirProjeto(projeto.id);
                }}
              />
            </div>
          </div>
        )}

        {/* ── Meu perfil overlay ── */}
        {perfilOpen && usuarioAtual && (
          <MeuPerfil perfil={usuarioAtual} onSalvar={salvarPerfil} onFechar={() => setPerfilOpen(false)} />
        )}

        {/* ── Mobile bottom nav ── */}
        {isMobile && <MobileBottomNav secao={secao} onNav={navTo} />}

        {/* ── Controles flutuantes (tema + preview) ── */}
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? 78 : 18,
            right: 18,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Alternador de tema claro/escuro */}
          <button
            onClick={toggleTheme}
            title={themeMode === "dark" ? "Tema claro" : "Tema escuro"}
            aria-label={themeMode === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            style={{
              width: 36, height: 36, borderRadius: 999, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: T.surface, color: T.muted,
              border: `1px solid ${T.border}`,
              boxShadow: "0 6px 20px rgba(0,0,0,.12)",
            }}
          >
            {themeMode === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          {/* Preview Web/Mobile */}
          <div
            style={{
              display: "flex",
              gap: 2,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 999,
              padding: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,.12)",
            }}
          >
          {[
            { id: "web",    icon: Monitor,    l: "Web" },
            { id: "mobile", icon: Smartphone, l: "Mobile" },
          ].map((o) => {
            const on = (o.id === "mobile") === isMobile;
            return (
              <button
                key={o.id}
                onClick={() => setPreviewMode(o.id)}
                title={o.l}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 11px", borderRadius: 999, border: "none",
                  background: on ? T.primary : "transparent",
                  color: on ? "#fff" : T.muted,
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <o.icon size={14} /> {o.l}
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </MobileCtx.Provider>
  );
}
