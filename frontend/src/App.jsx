import React, { useState, useEffect } from "react";
import {
  IconDeviceDesktop as Monitor,
  IconDeviceMobile as Smartphone,
} from "@tabler/icons-react";

import { T, fontBody, GLOBAL_STYLE } from "./lib/theme";
import { MobileCtx } from "./lib/context";
import { supabase, isMockMode } from "./lib/supabase";
import {
  MOCK_USERS, MOCK_PROJETOS, MOCK_ATIVIDADE, MOCK_TAREFAS,
  MOCK_REUNIOES, MOCK_NAO_ATRIBUIDOS,
} from "./lib/api/mockData";
import { signIn, signOut, getProfile, listUsers } from "./lib/api/auth";
import { listProjects, updateProject, upsertOffer, upsertPersona } from "./lib/api/projects";
import { listTasks, updateTask } from "./lib/api/tasks";
import { listMeetings } from "./lib/api/meetings";
import { logActivity } from "./lib/api/activity";

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

  // ── Data ────────────────────────────────────────────────────────────
  const [projetos, setProjetos]           = useState(isMockMode ? MOCK_PROJETOS : []);
  const [atividade, setAtividade]         = useState(isMockMode ? MOCK_ATIVIDADE : []);
  const [tarefas, setTarefas]             = useState(isMockMode ? MOCK_TAREFAS : []);
  const [reunioes, setReunioes]           = useState(isMockMode ? MOCK_REUNIOES : []);
  const [naoAtribuidos, setNaoAtribuidos] = useState(MOCK_NAO_ATRIBUIDOS);

  // ── Responsive ──────────────────────────────────────────────────────
  const autoMobile = useIsMobile();
  const [previewMode, setPreviewMode] = useState("web");
  const isMobile = previewMode === "mobile" ? true : previewMode === "web" ? false : autoMobile;

  // ── Supabase session restore ─────────────────────────────────────────
  useEffect(() => {
    if (isMockMode) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await handleSession(session.user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await handleSession(session.user);
      } else if (event === "SIGNED_OUT") {
        setLogado(false);
        setUsuarioAtual(null);
        setProjetos([]);
        setTarefas([]);
        setReunioes([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(authUser) {
    try {
      const [profile, allUsers, projs, tasks, meetings] = await Promise.all([
        getProfile(authUser.id),
        listUsers(),
        listProjects(),
        listTasks(),
        listMeetings(),
      ]);
      setUsuarioAtual(profile);
      setUsuarios(allUsers);
      setProjetos(projs);
      setTarefas(tasks);
      setReunioes(meetings);
      setLogado(true);
    } catch (err) {
      console.error("[App] handleSession error:", err);
    }
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

  const handleSair = async () => {
    await signOut().catch(() => {});
    setLogado(false);
    setUsuarioAtual(null);
  };

  // ── Login handler ────────────────────────────────────────────────────
  const handleEntrar = async (userOrProfile, email, senha) => {
    if (isMockMode) {
      setUsuarioAtual(userOrProfile);
      setLogado(true);
      return;
    }
    const { user } = await signIn(email, senha);
    await handleSession(user);
  };

  // ── Loading screen ───────────────────────────────────────────────────
  if (authLoading) {
    return (
      <>
        <style>{GLOBAL_STYLE}</style>
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
        <style>{GLOBAL_STYLE}</style>
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
        <style>{GLOBAL_STYLE}</style>

        {/* ── Layout chrome ── */}
        {isMobile ? (
          <MobileTopBar
            usuario={usuarioAtual}
            usuarios={usuarios}
            onTrocar={setUsuarioAtual}
            onSair={handleSair}
          />
        ) : (
          <Sidebar
            secao={secao}
            onNav={navTo}
            usuario={usuarioAtual}
            usuarios={usuarios}
            onTrocar={setUsuarioAtual}
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
                  setTarefas={setTarefas}
                  userById={userById}
                  projById={projById}
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
            onClick={() => setNovoOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(13,17,23,0.92)",
              display: "flex", alignItems: "flex-start", justifyContent: "center",
              padding: "0", overflow: "auto", zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: T.bg, minHeight: "100vh", width: "100%",
                maxWidth: 760, padding: "32px 32px 60px",
              }}
            >
              <NovoProjeto
                onVoltar={() => setNovoOpen(false)}
                onCriar={async (p) => {
                  setProjetos((ps) => [...ps, p]);
                  setAtividade((a) => [
                    { id: "a" + Date.now(), proj: p.id, user: usuarioAtual?.id, acao: "criou o projeto", quando: "Agora mesmo" },
                    ...a,
                  ]);
                  setNovoOpen(false);
                  abrirProjeto(p.id);
                }}
              />
            </div>
          </div>
        )}

        {/* ── Mobile bottom nav ── */}
        {isMobile && <MobileBottomNav secao={secao} onNav={navTo} />}

        {/* ── Viewport preview toggle ── */}
        <div
          style={{
            position: "fixed",
            bottom: isMobile ? 78 : 18,
            right: 18,
            zIndex: 60,
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
    </MobileCtx.Provider>
  );
}
