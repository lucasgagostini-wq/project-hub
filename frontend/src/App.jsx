import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Home, FolderKanban, CalendarDays, ListTodo, Users2, LogOut,
  TrendingUp, TrendingDown, DollarSign, Target, Megaphone, Clock,
  Plus, ArrowLeft, Link2, MapPin, Pencil, Check, X, Trophy, Activity,
  ChevronRight, Globe, MessageSquare, Search, Copy, Play, Image as ImageIcon,
  MoreHorizontal, Trash2, Camera, Pause, Settings, Crosshair, Monitor, Smartphone, Eye,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Tema — papel quente, tinta quase preta, um único acento            */
/* ------------------------------------------------------------------ */
const T = {
  bg: "#F7F6F3",
  surface: "#FFFFFF",
  ink: "#18181B",
  muted: "#75736C",
  faint: "#A8A6A0",
  border: "#E8E6E0",
  hair: "#F0EEE9",
  pos: "#1E8E5A",
  posBg: "#E8F3EC",
  neg: "#C8412F",
  negBg: "#F8EBE8",
  primary: "#18181B",
};

const fmtBRL = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtBRLc = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* Responsividade: detecta tela estreita e disponibiliza via contexto. */
const MobileCtx = React.createContext(false);
const useMobile = () => React.useContext(MobileCtx);
function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 760 : false);
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < 760);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return m;
}

/* ------------------------------------------------------------------ */
/*  Dados fictícios                                                     */
/* ------------------------------------------------------------------ */
const USERS = [
  { id: "u1", nome: "Rafael Lima", inicial: "RL", cor: "#18181B", papel: "Fundador" },
  { id: "u2", nome: "Marina Souza", inicial: "MS", cor: "#1E8E5A", papel: "Gestora de Tráfego" },
  { id: "u3", nome: "Bruno Alves", inicial: "BA", cor: "#C8412F", papel: "Copywriter" },
  { id: "u4", nome: "Carla Dias", inicial: "CD", cor: "#7C5CFF", papel: "Designer" },
];

const VEICULOS = ["Meta Ads", "Google Ads", "SMS", "Prospecção"];

function gerarTimeline(base, escala) {
  // 30 dias; escala>0 = oferta escalando, <0 = caindo
  const arr = [];
  let v = base;
  for (let i = 0; i < 30; i++) {
    const ruido = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * base * 0.06;
    v = Math.max(base * 0.3, v + escala * base * 0.02 + ruido);
    const dia = new Date(2025, 4, 1 + i);
    arr.push({
      dia: dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      faturamento: Math.round(v),
    });
  }
  return arr.map((d, i) => ({
    ...d,
    delta: i === 0 ? 0 : d.faturamento - arr[i - 1].faturamento,
  }));
}

const PROJETOS_INIT = [
  {
    id: "p1",
    nome: "Método Pele de Vidro",
    nicho: "Skincare",
    ativo: true,
    faturamento: 184200,
    fatSemana: 52400,
    lucro: 71300,
    gastoAds: 86100,
    tempoOnline: 47,
    veiculo: "Meta Ads",
    oferta: "Protocolo de 21 dias para pele luminosa, com 4 upsells.",
    links: [
      { tipo: "Landing page", url: "https://peledevidro.com/vsl" },
      { tipo: "Checkout", url: "https://cakto.com.br/pele-21d" },
    ],
    publico: "Mulheres preocupadas com sinais de idade e textura da pele.",
    idade: "28–45",
    persona: {
      nome: "Renata, 36",
      dor: "Sente que a pele perdeu viço depois dos 35 e já tentou vários cremes sem resultado.",
      desejo: "Pele uniforme e luminosa sem procedimentos caros.",
      objecao: "Já gastei dinheiro em coisa que não funcionou.",
      canal: "Instagram e grupos de skincare.",
    },
    criativos: [
      { nome: "VSL Antes/Depois", vendas: 412 },
      { nome: "Depoimento Renata", vendas: 287 },
      { nome: "Reel 7 dias", vendas: 173 },
    ],
    escala: 1.4,
  },
  {
    id: "p2",
    nome: "Renda com IA",
    nicho: "Educação",
    ativo: true,
    faturamento: 142800,
    fatSemana: 61900,
    lucro: 58400,
    gastoAds: 62200,
    tempoOnline: 23,
    veiculo: "Meta Ads",
    oferta: "Curso de prestação de serviços usando IA, com comunidade.",
    links: [{ tipo: "Landing page", url: "https://rendacomia.com" }],
    publico: "Pessoas querendo renda extra com habilidades digitais.",
    idade: "22–40",
    persona: {
      nome: "Diego, 29",
      dor: "Salário não acompanha as contas e ele sente que está ficando para trás na tecnologia.",
      desejo: "Uma renda paralela previsível trabalhando de casa.",
      objecao: "Não sei se consigo aprender, não sou da área de tech.",
      canal: "Instagram, YouTube e TikTok.",
    },
    criativos: [
      { nome: "Reel Tela Ganhos", vendas: 521 },
      { nome: "VSL História", vendas: 340 },
      { nome: "Carrossel Provas", vendas: 198 },
    ],
    escala: 1.9,
  },
  {
    id: "p3",
    nome: "Inglês em 8 Semanas",
    nicho: "Idiomas",
    ativo: true,
    faturamento: 98400,
    fatSemana: 18700,
    lucro: 29900,
    gastoAds: 51200,
    tempoOnline: 89,
    veiculo: "Google Ads",
    oferta: "Método de conversação acelerada com correção por áudio.",
    links: [{ tipo: "Site", url: "https://ingles8semanas.com" }],
    publico: "Profissionais que precisam de inglês para o trabalho.",
    idade: "25–50",
    persona: {
      nome: "Patrícia, 41",
      dor: "Perdeu uma promoção por não falar inglês em reuniões.",
      desejo: "Conseguir se virar numa call em inglês em poucas semanas.",
      objecao: "Já tentei vários apps e desisti.",
      canal: "Google e LinkedIn.",
    },
    criativos: [
      { nome: "Search Marca", vendas: 142 },
      { nome: "Anúncio Promoção", vendas: 96 },
      { nome: "Display Remarketing", vendas: 61 },
    ],
    escala: -0.8,
  },
];

const ATIVIDADE_INIT = [
  { id: "a1", proj: "p2", user: "u2", acao: "alterou o veículo principal para Meta Ads", quando: "Há 2 horas" },
  { id: "a2", proj: "p1", user: "u3", acao: "editou a persona (objeção principal)", quando: "Há 5 horas" },
  { id: "a3", proj: "p1", user: "u4", acao: "adicionou o criativo 'Reel 7 dias'", quando: "Ontem, 18:42" },
  { id: "a4", proj: "p2", user: "u1", acao: "criou o projeto", quando: "Há 3 dias" },
];

const TAREFAS_INIT = [
  { id: "t1", titulo: "Gravar nova VSL de teste", proj: "p2", resp: "u3", data: "2025-05-14", feito: false },
  { id: "t2", titulo: "Subir 3 criativos de retargeting", proj: "p1", resp: "u4", data: "2025-05-12", feito: false },
  { id: "t3", titulo: "Revisar custo por venda da semana", proj: "p3", resp: "u2", data: "2025-05-13", feito: true },
  { id: "t4", titulo: "Atualizar checkout com novo upsell", proj: "p1", resp: "u1", data: "2025-05-15", feito: false },
];

const REUNIOES_INIT = [
  { id: "r1", titulo: "Review semanal de ofertas", data: "2025-05-13", hora: "10:00", participantes: ["u1", "u2", "u3"] },
  { id: "r2", titulo: "Planejamento criativo — Pele de Vidro", data: "2025-05-15", hora: "14:30", participantes: ["u1", "u4"] },
];

// Anúncios puxados do Meta que ainda não têm projeto no app (criados fora daqui).
// O que o app cria já nasce atribuído; estes precisam ser designados manualmente.
const NAO_ATRIBUIDOS_INIT = [
  { id: "ext-1", nome: "Campanha Black — Conjunto A", status: "ATIVO", objetivo: "Vendas / Conversões",
    gasto: 4200, vendas: 38, origem: "importado", metaCampaignId: "23847109201", metaAdId: "60192384701" },
  { id: "ext-2", nome: "Reels Teste 04", status: "PAUSADO", objetivo: "Tráfego",
    gasto: 980, vendas: 0, origem: "importado", metaCampaignId: "23847109244", metaAdId: "60192399902" },
];

// Estrutura de venda / entregável / suporte por projeto (base; editável no app).
const ESTRUTURAS_INIT = {
  p1: {
    venda: { funil: "VSL → Checkout Cakto → Upsell sérum → Downsell mini-kit", preco: "R$ 197 (em até 12x)",
      garantia: "30 dias incondicional", gateway: "Cakto", upsells: "Sérum premium (R$ 97) · Kit de aplicação (R$ 67)", bumps: "E-book rotina noturna (R$ 19)" },
    entregavel: { oQueRecebe: "Protocolo de 21 dias em vídeo + PDF de apoio", plataforma: "Área de membros (Cakto Members)",
      formato: "Curso em vídeo + materiais", acesso: "Vitalício", bonus: "Lista de ativos + cronograma de uso", cronograma: "Liberação imediata" },
    suporte: { canais: "WhatsApp + e-mail", sla: "Até 24h úteis", responsavel: "Carla Dias",
      reembolso: "Reembolso em até 7 dias (CDC)", faq: "Como acessar, como aplicar, trocas" },
  },
  p2: {
    venda: { funil: "Reel → VSL → Checkout → Upsell comunidade", preco: "R$ 297 (em até 12x)",
      garantia: "7 dias", gateway: "Cakto", upsells: "Comunidade anual (R$ 497)", bumps: "Pack de templates de prompt (R$ 29)" },
    entregavel: { oQueRecebe: "Curso + comunidade + templates de prompt", plataforma: "Área de membros + Discord",
      formato: "Curso em vídeo + comunidade", acesso: "12 meses", bonus: "Banco de prompts prontos", cronograma: "2 módulos por semana" },
    suporte: { canais: "Discord + e-mail", sla: "Até 12h", responsavel: "Bruno Alves",
      reembolso: "7 dias", faq: "Acesso, comunidade, certificado" },
  },
  p3: {
    venda: { funil: "Search → Site → Checkout", preco: "R$ 397",
      garantia: "14 dias", gateway: "Cakto", upsells: "Mentoria de conversação (R$ 197)", bumps: "Guia de pronúncia (R$ 19)" },
    entregavel: { oQueRecebe: "Método de 8 semanas + correção por áudio", plataforma: "App próprio + área de membros",
      formato: "Aulas + prática guiada", acesso: "12 meses", bonus: "Banco de diálogos", cronograma: "1 semana liberada por vez" },
    suporte: { canais: "E-mail + WhatsApp", sla: "Até 24h", responsavel: "Marina Souza",
      reembolso: "14 dias", faq: "Níveis, certificado, suporte de áudio" },
  },
};

/* ------------------------------------------------------------------ */
/*  Pequenos componentes                                               */
/* ------------------------------------------------------------------ */
const fontDisplay = "'Space Grotesk', ui-sans-serif, system-ui";
const fontBody = "'Inter', ui-sans-serif, system-ui";

function Avatar({ user, size = 30 }) {
  return (
    <div
      title={user.nome}
      style={{
        width: size, height: size, borderRadius: 999, background: user.cor,
        color: "#fff", fontSize: size * 0.38, fontWeight: 600, fontFamily: fontDisplay,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {user.inicial}
    </div>
  );
}

function Delta({ value, suffix = "" }) {
  const up = value >= 0;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12.5,
        fontWeight: 600, fontFamily: fontDisplay,
        color: up ? T.pos : T.neg,
        background: up ? T.posBg : T.negBg,
        padding: "2px 7px", borderRadius: 6,
      }}
    >
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {up ? "+" : ""}{value}{suffix}
    </span>
  );
}

function Kpi({ label, value, hint, delta, icon: Icon, accent }) {
  return (
    <div
      style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, color: T.muted, letterSpacing: 0.2, fontWeight: 500 }}>{label}</span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent || T.hair,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={15} color={accent ? "#fff" : T.muted} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: fontDisplay, fontSize: 27, fontWeight: 600, color: T.ink,
        fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {delta !== undefined && <Delta value={delta} suffix="%" />}
        {hint && <span style={{ fontSize: 12, color: T.faint }}>{hint}</span>}
      </div>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase",
      color: T.faint, fontFamily: fontDisplay, marginBottom: 14 }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
export default function App() {
  const [logado, setLogado] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(USERS[0]);
  const [secao, setSecao] = useState("home");
  const [projAtivo, setProjAtivo] = useState(null);
  const [abaProjeto, setAbaProjeto] = useState("resumo");
  const [novoOpen, setNovoOpen] = useState(false);

  const [projetos, setProjetos] = useState(PROJETOS_INIT);
  const [atividade, setAtividade] = useState(ATIVIDADE_INIT);
  const [tarefas, setTarefas] = useState(TAREFAS_INIT);
  const [naoAtribuidos, setNaoAtribuidos] = useState(NAO_ATRIBUIDOS_INIT);
  const autoMobile = useIsMobile();
  const [previewMode, setPreviewMode] = useState("web"); // "auto" | "web" | "mobile" (só para pré-visualizar)
  const isMobile = previewMode === "auto" ? autoMobile : previewMode === "mobile";

  const registrar = (proj, acao) =>
    setAtividade((a) => [
      { id: "a" + Date.now(), proj, user: usuarioAtual.id, acao, quando: "Agora mesmo" },
      ...a,
    ]);

  const userById = (id) => USERS.find((u) => u.id === id);
  const projById = (id) => projetos.find((p) => p.id === id);

  if (!logado) {
    return <Login onEntrar={(u) => { setUsuarioAtual(u); setLogado(true); }} />;
  }

  const projeto = projAtivo ? projById(projAtivo) : null;

  return (
    <MobileCtx.Provider value={isMobile}>
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", background: T.bg, fontFamily: fontBody, color: T.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box} button{cursor:pointer;font-family:inherit}
        ::-webkit-scrollbar{width:9px;height:9px}::-webkit-scrollbar-thumb{background:#dcd9d2;border-radius:9px}`}</style>

      {isMobile ? (
        <MobileTopBar usuario={usuarioAtual} usuarios={USERS} onTrocar={setUsuarioAtual} onSair={() => setLogado(false)} />
      ) : (
        <Sidebar
          secao={secao}
          onNav={(s) => { setSecao(s); setProjAtivo(null); }}
          usuario={usuarioAtual}
          usuarios={USERS}
          onTrocar={setUsuarioAtual}
          onSair={() => setLogado(false)}
        />
      )}

      {/* Conteúdo */}
      <main style={{ flex: 1, minWidth: 0, padding: isMobile ? "16px 16px 92px" : "30px 40px 60px", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
        {projeto ? (
          <ProjetoDetalhe
            projeto={projeto}
            aba={abaProjeto}
            setAba={setAbaProjeto}
            onVoltar={() => setProjAtivo(null)}
            userById={userById}
            atividade={atividade.filter((a) => a.proj === projeto.id)}
            usuarioAtual={usuarioAtual}
            onRegistrar={(acao) => registrar(projeto.id, acao)}
            naoAtribuidos={naoAtribuidos}
            onAtribuir={(ad) => {
              setNaoAtribuidos((prev) => prev.filter((x) => x.id !== ad.id));
              registrar(projeto.id, `atribuiu o anúncio "${ad.nome}" a este projeto`);
            }}
            onEditarPersona={(novaPersona) => {
              setProjetos((ps) => ps.map((p) => p.id === projeto.id ? { ...p, persona: novaPersona } : p));
              registrar(projeto.id, "editou a persona");
            }}
            onEditarOferta={(campos) => {
              setProjetos((ps) => ps.map((p) => p.id === projeto.id ? { ...p, ...campos } : p));
              registrar(projeto.id, "atualizou a estruturação da oferta");
            }}
            onEditarEstrutura={(qual, novo) => {
              setProjetos((ps) => ps.map((p) => p.id === projeto.id
                ? { ...p, estruturas: { ...(p.estruturas || ESTRUTURAS_INIT[p.id] || {}), [qual]: novo } } : p));
              registrar(projeto.id, `editou a estrutura de ${qual}`);
            }}
          />
        ) : (
          <>
            {secao === "home" && <HomeGeral projetos={projetos} onAbrir={(id) => { setProjAtivo(id); setAbaProjeto("resumo"); }} onSetImagem={(id, img) => setProjetos((ps) => ps.map((p) => p.id === id ? { ...p, imagem: img } : p))} />}
            {secao === "projetos" && (
              <Projetos
                projetos={projetos}
                onAbrir={(id) => { setProjAtivo(id); setAbaProjeto("resumo"); }}
                onNovo={() => setNovoOpen(true)}
                onSetImagem={(id, img) => setProjetos((ps) => ps.map((p) => p.id === id ? { ...p, imagem: img } : p))}
              />
            )}
            {secao === "calendario" && <CalendarioGeral tarefas={tarefas} reunioes={REUNIOES_INIT} userById={userById} projById={projById} />}
            {secao === "tarefas" && <TarefasGerais tarefas={tarefas} setTarefas={setTarefas} userById={userById} projById={projById} />}
            {secao === "reunioes" && <Reunioes reunioes={REUNIOES_INIT} userById={userById} />}
          </>
        )}
      </main>

      {novoOpen && (
        <NovoProjeto
          onFechar={() => setNovoOpen(false)}
          onCriar={(p) => {
            setProjetos((ps) => [...ps, p]);
            setAtividade((a) => [{ id: "a" + Date.now(), proj: p.id, user: usuarioAtual.id, acao: "criou o projeto", quando: "Agora mesmo" }, ...a]);
            setNovoOpen(false);
            setProjAtivo(p.id);
            setAbaProjeto("oferta");
          }}
        />
      )}

      {isMobile && <MobileBottomNav secao={secao} onNav={(s) => { setSecao(s); setProjAtivo(null); }} />}

      {/* Seletor de pré-visualização (apenas para revisar — removível em produção) */}
      <div style={{ position: "fixed", bottom: isMobile ? 78 : 18, right: 18, zIndex: 60, display: "flex", gap: 2,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 999, padding: 3, boxShadow: "0 6px 20px rgba(0,0,0,.12)" }}>
        {[{ id: "web", icon: Monitor, l: "Web" }, { id: "mobile", icon: Smartphone, l: "Mobile" }].map((o) => {
          const on = (o.id === "mobile") === isMobile;
          return (
            <button key={o.id} onClick={() => setPreviewMode(o.id)} title={o.l}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 999, border: "none",
                background: on ? T.ink : "transparent", color: on ? "#fff" : T.muted, fontSize: 12, fontWeight: 600 }}>
              <o.icon size={14} /> {o.l}
            </button>
          );
        })}
      </div>
    </div>
    </MobileCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */
function Login({ onEntrar }) {
  const [user, setUser] = useState(USERS[0]);
  const [senha, setSenha] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: fontBody, color: T.ink,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');*{box-sizing:border-box}`}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 13, letterSpacing: 2, color: T.faint, fontWeight: 600, marginBottom: 4 }}>
          ESTÚDIO DE OFERTAS
        </div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 30, fontWeight: 700, margin: "0 0 28px", letterSpacing: -0.5 }}>
          Entrar
        </h1>

        <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>Perfil</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "8px 0 18px" }}>
          {USERS.map((u) => (
            <button key={u.id} onClick={() => setUser(u)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 12,
                border: `1.5px solid ${user.id === u.id ? T.ink : T.border}`, background: T.surface, textAlign: "left" }}>
              <Avatar user={u} size={26} />
              <span style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.1 }}>{u.nome.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••"
          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 12, border: `1px solid ${T.border}`,
            background: T.surface, fontSize: 14, outline: "none", fontFamily: fontBody }} />

        <button onClick={() => onEntrar(user)}
          style={{ width: "100%", marginTop: 22, padding: "13px", borderRadius: 12, border: "none",
            background: T.primary, color: "#fff", fontSize: 14.5, fontWeight: 600 }}>
          Entrar como {user.nome.split(" ")[0]}
        </button>
        <p style={{ fontSize: 12, color: T.faint, textAlign: "center", marginTop: 16 }}>
          Protótipo — qualquer senha entra
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function Sidebar({ secao, onNav, usuario, usuarios, onTrocar, onSair }) {
  const [trocarOpen, setTrocarOpen] = useState(false);
  const itens = [
    { id: "home", label: "Início", icon: Home },
    { id: "projetos", label: "Projetos", icon: FolderKanban },
    { id: "calendario", label: "Calendário geral", icon: CalendarDays },
    { id: "tarefas", label: "Tarefas gerais", icon: ListTodo },
    { id: "reunioes", label: "Reuniões", icon: Users2 },
  ];
  return (
    <aside style={{ width: 236, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
      padding: "24px 16px", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
      <div style={{ padding: "0 8px 22px", display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: T.ink, display: "flex",
          alignItems: "center", justifyContent: "center" }}>
          <Target size={17} color="#fff" />
        </div>
        <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 15.5, letterSpacing: -0.3 }}>Ofertas</span>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {itens.map((it) => {
          const ativo = secao === it.id;
          return (
            <button key={it.id} onClick={() => onNav(it.id)}
              style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 10,
                border: "none", background: ativo ? T.bg : "transparent", color: ativo ? T.ink : T.muted,
                fontSize: 13.5, fontWeight: ativo ? 600 : 500, textAlign: "left", width: "100%" }}>
              <it.icon size={17} />{it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", position: "relative" }}>
        {trocarOpen && (
          <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, background: T.surface,
            border: `1px solid ${T.border}`, borderRadius: 12, padding: 6, boxShadow: "0 8px 28px rgba(0,0,0,.10)" }}>
            {usuarios.map((u) => (
              <button key={u.id} onClick={() => { onTrocar(u); setTrocarOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px",
                  borderRadius: 8, border: "none", background: "transparent", textAlign: "left" }}>
                <Avatar user={u} size={24} />
                <span style={{ fontSize: 12.5 }}>{u.nome.split(" ")[0]}</span>
              </button>
            ))}
            <button onClick={onSair} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", color: T.neg, fontSize: 12.5 }}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
        <button onClick={() => setTrocarOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px",
            borderRadius: 12, border: `1px solid ${T.border}`, background: T.bg }}>
          <Avatar user={usuario} size={30} />
          <div style={{ textAlign: "left", lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.nome}</div>
            <div style={{ fontSize: 11, color: T.faint }}>{usuario.papel}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}

const NAV_ITENS = [
  { id: "home", label: "Início", icon: Home },
  { id: "projetos", label: "Projetos", icon: FolderKanban },
  { id: "calendario", label: "Agenda", icon: CalendarDays },
  { id: "tarefas", label: "Tarefas", icon: ListTodo },
  { id: "reunioes", label: "Reuniões", icon: Users2 },
];

function MobileTopBar({ usuario, usuarios, onTrocar, onSair }) {
  const [aberto, setAberto] = useState(false);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: T.surface, borderBottom: `1px solid ${T.border}`,
      padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Target size={16} color="#fff" />
        </div>
        <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>Ofertas</span>
      </div>
      <div style={{ position: "relative" }}>
        <button onClick={() => setAberto((o) => !o)} style={{ border: "none", background: "transparent", padding: 0 }}>
          <Avatar user={usuario} size={32} />
        </button>
        {aberto && (
          <div style={{ position: "absolute", top: 42, right: 0, background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 6, width: 170, boxShadow: "0 10px 30px rgba(0,0,0,.12)", zIndex: 40 }}>
            {usuarios.map((u) => (
              <button key={u.id} onClick={() => { onTrocar(u); setAberto(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", textAlign: "left" }}>
                <Avatar user={u} size={24} /><span style={{ fontSize: 12.5 }}>{u.nome.split(" ")[0]}</span>
              </button>
            ))}
            <button onClick={onSair} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", color: T.neg, fontSize: 12.5 }}>
              <LogOut size={15} /> Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function MobileBottomNav({ secao, onNav }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, background: T.surface,
      borderTop: `1px solid ${T.border}`, display: "flex", padding: "6px 4px 8px", justifyContent: "space-around" }}>
      {NAV_ITENS.map((it) => {
        const ativo = secao === it.id;
        return (
          <button key={it.id} onClick={() => onNav(it.id)}
            style={{ flex: 1, border: "none", background: "transparent", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, padding: "6px 2px", color: ativo ? T.ink : T.faint }}>
            <it.icon size={20} />
            <span style={{ fontSize: 10, fontWeight: ativo ? 600 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Home geral                                                         */
/* ------------------------------------------------------------------ */
function HomeGeral({ projetos, onAbrir, onSetImagem }) {
  const m = useMobile();
  const ativos = projetos.filter((p) => p.ativo);
  const fatTotal = ativos.reduce((s, p) => s + p.faturamento, 0);
  const destaque = [...ativos].sort((a, b) => b.fatSemana - a.fatSemana)[0];

  return (
    <div>
      <Header titulo="Início" sub="Visão geral de todos os projetos ativos." />

      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        <Kpi label="Faturamento total" value={fmtBRL(fatTotal)} icon={DollarSign} accent={T.ink} delta={12} hint="vs. mês anterior" />
        <Kpi label="Projetos ativos" value={ativos.length} icon={FolderKanban} hint="em operação agora" />
        <div onClick={() => onAbrir(destaque.id)} style={{ cursor: "pointer" }}>
          <div style={{ background: T.ink, color: "#fff", borderRadius: 16, padding: "18px 20px", height: "100%",
            display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: "#C9C7C0", fontWeight: 500 }}>Projeto destaque da semana</span>
              <Trophy size={16} color="#E7C04A" />
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 21, fontWeight: 600, lineHeight: 1.1 }}>{destaque.nome}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: fontDisplay, fontSize: 14, color: "#E7C04A", fontWeight: 600 }}>{fmtBRL(destaque.fatSemana)}</span>
              <span style={{ fontSize: 12, color: "#9C9A94" }}>esta semana</span>
            </div>
          </div>
        </div>
      </div>

      <Eyebrow>Projetos</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {ativos.map((p) => <CardProjeto key={p.id} p={p} onAbrir={onAbrir} onSetImagem={onSetImagem} />)}
      </div>
    </div>
  );
}

function Header({ titulo, sub, acao }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 26 }}>
      <div>
        <h1 style={{ fontFamily: fontDisplay, fontSize: 25, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{titulo}</h1>
        {sub && <p style={{ color: T.muted, fontSize: 13.5, margin: "5px 0 0" }}>{sub}</p>}
      </div>
      {acao}
    </div>
  );
}

function CardProjeto({ p, onAbrir, onSetImagem }) {
  const margem = Math.round((p.lucro / p.faturamento) * 100);
  const fileRef = useRef(null);
  const escolherImagem = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onSetImagem?.(p.id, reader.result);
    reader.readAsDataURL(file); // protótipo: vira data URL em memória. No backend, sobe pro storage.
  };
  return (
    <div onClick={() => onAbrir(p.id)}
      style={{ cursor: "pointer", textAlign: "left", background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Capa */}
      <div style={{ position: "relative", height: 116, background: p.imagem ? "#000" : T.bg,
        borderBottom: `1px solid ${T.hair}` }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={escolherImagem} style={{ display: "none" }} />
        {p.imagem ? (
          <img src={p.imagem} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            style={{ width: "100%", height: "100%", border: "none", background: "transparent", color: T.faint,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
            <ImageIcon size={20} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Adicionar imagem</span>
          </button>
        )}
        {p.imagem && (
          <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} title="Trocar imagem"
            style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 8, border: "none",
              background: "rgba(24,24,27,.55)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={14} />
          </button>
        )}
      </div>

      {/* Corpo */}
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{p.nome}</div>
            <span style={{ fontSize: 11.5, color: T.muted, background: T.hair, padding: "2px 8px", borderRadius: 6 }}>{p.nicho}</span>
          </div>
          <ChevronRight size={18} color={T.faint} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11.5, color: T.faint }}>Faturamento</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(p.faturamento)}</div>
          </div>
          <Delta value={p.escala > 0 ? margem : -margem} suffix="%" />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5, color: T.muted, borderTop: `1px solid ${T.hair}`, paddingTop: 11 }}>
          <Megaphone size={13} /> {p.veiculo} <span style={{ color: T.faint }}>·</span> <Clock size={13} /> {p.tempoOnline}d no ar
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Projetos (lista)                                                   */
/* ------------------------------------------------------------------ */
function Projetos({ projetos, onAbrir, onNovo, onSetImagem }) {
  const [busca, setBusca] = useState("");
  const lista = projetos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div>
      <Header
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
            background: T.surface, fontSize: 13.5, outline: "none", fontFamily: fontBody }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 14 }}>
        {lista.map((p) => <CardProjeto key={p.id} p={p} onAbrir={onAbrir} onSetImagem={onSetImagem} />)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detalhe do projeto                                                 */
/* ------------------------------------------------------------------ */
function ProjetoDetalhe({ projeto, aba, setAba, onVoltar, userById, atividade, onEditarPersona, onEditarOferta, onRegistrar, naoAtribuidos, onAtribuir, onEditarEstrutura }) {
  return (
    <div>
      <button onClick={onVoltar}
        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "transparent",
          color: T.muted, fontSize: 13, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={15} /> Projetos
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: fontDisplay, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{projeto.nome}</h1>
          <p style={{ color: T.muted, fontSize: 13, margin: "4px 0 0" }}>{projeto.nicho} · {projeto.veiculo}</p>
        </div>
      </div>

      {/* sub-menu do projeto */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 26, overflowX: "auto" }}>
        {[{ id: "resumo", l: "Resumo" }, { id: "overview", l: "Visão geral" }, { id: "oferta", l: "Gestão de oferta" }, { id: "estruturas", l: "Estruturas" }, { id: "anuncios", l: "Desempenho" }].map((t) => (
          <button key={t.id} onClick={() => setAba(t.id)}
            style={{ border: "none", background: "transparent", padding: "10px 4px", marginRight: 18, whiteSpace: "nowrap",
              fontSize: 13.5, fontWeight: aba === t.id ? 600 : 500, color: aba === t.id ? T.ink : T.muted,
              borderBottom: `2px solid ${aba === t.id ? T.ink : "transparent"}`, marginBottom: -1 }}>
            {t.l}
          </button>
        ))}
      </div>

      {aba === "resumo" && <ResumoTab projeto={projeto} />}
      {aba === "overview" && <ProjetoOverview projeto={projeto} />}
      {aba === "oferta" && (
        <GestaoOferta projeto={projeto} userById={userById} atividade={atividade}
          onEditarPersona={onEditarPersona} onEditarOferta={onEditarOferta} />
      )}
      {aba === "estruturas" && <EstruturasTab projeto={projeto} onEditarEstrutura={onEditarEstrutura} />}
      {aba === "anuncios" && <AnunciosTab projeto={projeto} onRegistrar={onRegistrar} naoAtribuidos={naoAtribuidos} onAtribuir={onAtribuir} />}
    </div>
  );
}

// Miniatura do criativo. No backend, `c.thumbnailUrl` chega do Meta (thumbnail_url
// do AdCreative). Sem URL, mostra um placeholder. Vídeo ganha um play por cima.
function CreativeThumb({ creative, color, size = 44 }) {
  const url = creative.thumbnailUrl || creative.thumb || null;
  const isVideo = /vsl|reel|v[ií]deo/i.test(creative.nome || "");
  return (
    <div style={{ position: "relative", width: size, height: size, borderRadius: 10, overflow: "hidden",
      flexShrink: 0, border: `1px solid ${T.border}`,
      background: url ? "#000" : `linear-gradient(135deg, ${color}, ${T.ink})` }}>
      {url ? (
        <img src={url} alt={creative.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isVideo ? <Play size={15} color="#fff" fill="#fff" /> : <ImageIcon size={15} color="#fff" />}
        </div>
      )}
      {url && isVideo && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,.22)" }}>
          <Play size={14} color="#fff" fill="#fff" />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Resumo do projeto (aba de entrada) + prévia da oferta              */
/* ------------------------------------------------------------------ */
function LinhaInfo({ label, valor }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{valor || "—"}</div>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MiniEstrutura({ icon: Icon, titulo, linhas }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={15} color={T.ink} />
        <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 13.5 }}>{titulo}</span>
      </div>
      {linhas.map(([l, v], i) => (
        <div key={i} style={{ marginBottom: i < linhas.length - 1 ? 9 : 0 }}>
          <div style={{ fontSize: 11, color: T.faint }}>{l}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.35 }}>{v || "—"}</div>
        </div>
      ))}
    </div>
  );
}

function ResumoTab({ projeto }) {
  const m = useMobile();
  const [previa, setPrevia] = useState(false);
  const est = projeto.estruturas || ESTRUTURAS_INIT[projeto.id] || {};
  const margem = projeto.faturamento ? Math.round((projeto.lucro / projeto.faturamento) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Hero */}
      <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", border: `1px solid ${T.border}`,
        minHeight: 188, display: "flex", alignItems: "flex-end",
        background: projeto.imagem ? "#000" : "linear-gradient(120deg, #1F1E1C 0%, #3A352F 100%)" }}>
        {projeto.imagem && (
          <img src={projeto.imagem} alt={projeto.nome}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,.72) 100%)" }} />
        <div style={{ position: "relative", padding: m ? 18 : 24, width: "100%", display: "flex",
          alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase",
              color: "rgba(255,255,255,.7)", fontFamily: fontDisplay, marginBottom: 8 }}>{projeto.nicho}</div>
            <div style={{ fontFamily: fontDisplay, fontSize: m ? 24 : 30, fontWeight: 700, color: "#fff", letterSpacing: -0.6, lineHeight: 1.05 }}>{projeto.nome}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12.5, color: "rgba(255,255,255,.82)" }}>
              <Megaphone size={14} /> {projeto.veiculo} <span style={{ opacity: .5 }}>·</span> <Clock size={14} /> {projeto.tempoOnline}d no ar
            </div>
          </div>
          <button onClick={() => setPrevia(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11, border: "none",
              background: "rgba(255,255,255,.96)", color: T.ink, fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>
            <Eye size={16} /> Prévia da oferta
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
        <MiniStat label="Faturamento" value={fmtBRL(projeto.faturamento)} />
        <MiniStat label="Lucro líquido" value={fmtBRL(projeto.lucro)} sub={`margem ${margem}%`} />
        <MiniStat label="Gasto com anúncios" value={fmtBRL(projeto.gastoAds)} />
        <MiniStat label="Oferta no ar" value={`${projeto.tempoOnline} dias`} sub={projeto.escala > 0 ? "escalando" : "em queda"} />
      </div>

      {/* Oferta + Persona */}
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1.3fr 1fr", gap: 14 }}>
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <Eyebrow>A oferta</Eyebrow>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 16px" }}>{projeto.oferta}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            <LinhaInfo label="Público" valor={projeto.publico} />
            <LinhaInfo label="Idade" valor={projeto.idade} />
            <LinhaInfo label="Preço" valor={est.venda?.preco} />
            <LinhaInfo label="Garantia" valor={est.venda?.garantia} />
          </div>
        </section>
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <Eyebrow>Persona</Eyebrow>
          <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{projeto.persona.nome}</div>
          <LinhaInfo label="Dor principal" valor={projeto.persona.dor} />
          <div style={{ height: 12 }} />
          <LinhaInfo label="Desejo" valor={projeto.persona.desejo} />
        </section>
      </div>

      {/* Estruturas resumidas */}
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
        <MiniEstrutura icon={DollarSign} titulo="Venda" linhas={[["Preço", est.venda?.preco], ["Garantia", est.venda?.garantia]]} />
        <MiniEstrutura icon={FolderKanban} titulo="Entregável" linhas={[["Plataforma", est.entregavel?.plataforma], ["Acesso", est.entregavel?.acesso]]} />
        <MiniEstrutura icon={MessageSquare} titulo="Suporte" linhas={[["Canais", est.suporte?.canais], ["SLA", est.suporte?.sla]]} />
      </div>

      {previa && <PreviaOferta projeto={projeto} est={est} onFechar={() => setPrevia(false)} />}
    </div>
  );
}

function PreviaOferta({ projeto, est, onFechar }) {
  const Chip = ({ children }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500,
      color: "#fff", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.22)",
      padding: "5px 11px", borderRadius: 999 }}>{children}</span>
  );
  const Sec = ({ titulo, children }) => (
    <div style={{ padding: "18px 26px", borderTop: `1px solid ${T.hair}` }}>
      <Eyebrow>{titulo}</Eyebrow>
      {children}
    </div>
  );
  const Row = ({ label, valor }) =>
    valor ? (
      <div style={{ display: "flex", gap: 14, padding: "6px 0" }}>
        <div style={{ width: 110, flexShrink: 0, fontSize: 12.5, color: T.muted }}>{label}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{valor}</div>
      </div>
    ) : null;

  return (
    <div onClick={onFechar} style={{ position: "fixed", inset: 0, background: "rgba(24,24,27,.4)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflow: "auto", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 20, width: "100%",
        maxWidth: 640, overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.28)" }}>
        {/* Hero */}
        <div style={{ position: "relative", padding: "24px 26px", color: "#fff",
          background: projeto.imagem ? "#000" : "linear-gradient(120deg, #1F1E1C 0%, #3A352F 100%)" }}>
          {projeto.imagem && (
            <img src={projeto.imagem} alt={projeto.nome}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.78) 100%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase",
                color: "rgba(255,255,255,.7)", fontFamily: fontDisplay }}>{projeto.nicho}</div>
              <button onClick={onFechar} style={{ border: "none", background: "transparent", color: "rgba(255,255,255,.8)" }}><X size={20} /></button>
            </div>
            <div style={{ fontFamily: fontDisplay, fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginTop: 6, lineHeight: 1.1 }}>{projeto.nome}</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.86)", margin: "10px 0 0", maxWidth: 520 }}>{projeto.oferta}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              {est.venda?.preco && <Chip><DollarSign size={13} /> {est.venda.preco}</Chip>}
              {est.venda?.garantia && <Chip>Garantia: {est.venda.garantia}</Chip>}
              <Chip><Megaphone size={13} /> {projeto.veiculo}</Chip>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div style={{ maxHeight: "52vh", overflowY: "auto" }}>
          <Sec titulo="Para quem é">
            <Row label="Público" valor={projeto.publico} />
            <Row label="Idade" valor={projeto.idade} />
            <Row label="Persona" valor={projeto.persona.nome} />
            <Row label="Dor" valor={projeto.persona.dor} />
            <Row label="Desejo" valor={projeto.persona.desejo} />
          </Sec>
          <Sec titulo="Como vende">
            <Row label="Funil" valor={est.venda?.funil} />
            <Row label="Preço" valor={est.venda?.preco} />
            <Row label="Garantia" valor={est.venda?.garantia} />
            <Row label="Upsells" valor={est.venda?.upsells} />
            <Row label="Order bumps" valor={est.venda?.bumps} />
          </Sec>
          <Sec titulo="O que entrega">
            <Row label="Entregável" valor={est.entregavel?.oQueRecebe} />
            <Row label="Plataforma" valor={est.entregavel?.plataforma} />
            <Row label="Formato" valor={est.entregavel?.formato} />
            <Row label="Acesso" valor={est.entregavel?.acesso} />
            <Row label="Bônus" valor={est.entregavel?.bonus} />
          </Sec>
          <Sec titulo="Suporte">
            <Row label="Canais" valor={est.suporte?.canais} />
            <Row label="Resposta" valor={est.suporte?.sla} />
            <Row label="Reembolso" valor={est.suporte?.reembolso} />
          </Sec>
          {projeto.links?.length > 0 && (
            <Sec titulo="Links">
              {projeto.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: T.ink, textDecoration: "none", padding: "5px 0" }}>
                  <Link2 size={13} color={T.faint} /> <span style={{ color: T.muted }}>{l.tipo}:</span>
                  <span style={{ textDecoration: "underline" }}>{l.url}</span>
                </a>
              ))}
            </Sec>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjetoOverview({ projeto }) {
  const m = useMobile();
  const margem = Math.round((projeto.lucro / projeto.faturamento) * 100);
  const maxV = Math.max(...projeto.criativos.map((c) => c.vendas));
  const THUMB_CORES = ["#B89C82", "#7FA6A0", "#A6809A"];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
        <Kpi label="Faturamento" value={fmtBRL(projeto.faturamento)} icon={DollarSign} accent={T.ink} delta={projeto.escala > 0 ? 18 : -9} />
        <Kpi label="Lucro líquido" value={fmtBRL(projeto.lucro)} icon={TrendingUp} hint={`margem ${margem}%`} />
        <Kpi label="Gasto com anúncios" value={fmtBRL(projeto.gastoAds)} icon={Megaphone} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1.4fr", gap: 14 }}>
        <Kpi label="Tempo de oferta no ar" value={`${projeto.tempoOnline} dias`} icon={Clock} hint={projeto.escala > 0 ? "escalando" : "em queda"} />
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 500, marginBottom: 14 }}>Top 3 criativos que mais vendem</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projeto.criativos.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontFamily: fontDisplay, fontSize: 13, fontWeight: 600, color: T.faint, width: 10, textAlign: "center" }}>{i + 1}</span>
                <CreativeThumb creative={c} color={THUMB_CORES[i % THUMB_CORES.length]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nome}</div>
                  <div style={{ height: 5, background: T.hair, borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
                    <div style={{ height: "100%", width: `${maxV ? (c.vendas / maxV) * 100 : 0}%`, background: T.ink, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{c.vendas}</div>
                  <div style={{ fontSize: 10.5, color: T.faint }}>vendas</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gestão de oferta                                                   */
/* ------------------------------------------------------------------ */
function GestaoOferta({ projeto, userById, atividade, onEditarPersona, onEditarOferta }) {
  const m = useMobile();
  const timeline = useMemo(() => gerarTimeline(projeto.fatSemana / 7, projeto.escala), [projeto.id]);
  const totalPeriodo = timeline.reduce((s, d) => s + d.delta, 0);
  const [editPersona, setEditPersona] = useState(false);
  const [draft, setDraft] = useState(projeto.persona);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Estruturação */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <Eyebrow>Estruturação da oferta</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: "16px 28px" }}>
          <Campo label="A oferta" valor={projeto.oferta} full />
          <Campo label="Público-alvo" valor={projeto.publico} />
          <Campo label="Idade do público" valor={projeto.idade} icon={Users2} />
          <Campo label="Maior veículo de venda" valor={projeto.veiculo} icon={Megaphone} />
          <div>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 7 }}>Links</div>
            {projeto.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: T.ink, textDecoration: "none",
                  marginBottom: 6 }}>
                <Link2 size={13} color={T.faint} />
                <span style={{ color: T.muted }}>{l.tipo}:</span> <span style={{ textDecoration: "underline" }}>{l.url}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Persona */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Eyebrow>Persona mapeada</Eyebrow>
          {!editPersona ? (
            <button onClick={() => { setDraft(projeto.persona); setEditPersona(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`,
                background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
              <Pencil size={13} /> Editar
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditPersona(false)}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
                <X size={13} /> Cancelar
              </button>
              <button onClick={() => { onEditarPersona(draft); setEditPersona(false); }}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#fff", border: "none", background: T.primary, borderRadius: 9, padding: "6px 12px" }}>
                <Check size={13} /> Salvar
              </button>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: "16px 28px" }}>
          {[
            ["nome", "Quem é"], ["canal", "Onde está"],
            ["dor", "Dor principal"], ["desejo", "Desejo"],
            ["objecao", "Principal objeção"],
          ].map(([k, label]) => (
            <div key={k}>
              <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
              {editPersona ? (
                <textarea value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                  style={{ width: "100%", minHeight: 52, resize: "vertical", padding: "8px 10px", borderRadius: 9,
                    border: `1px solid ${T.border}`, fontSize: 13, fontFamily: fontBody, outline: "none" }} />
              ) : (
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{projeto.persona[k]}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Linha do tempo / gráfico */}
      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <Eyebrow>Linha do tempo da oferta</Eyebrow>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, color: T.faint }}>Resultado no período (30 dias)</div>
            <div style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: totalPeriodo >= 0 ? T.pos : T.neg }}>
              {totalPeriodo >= 0 ? "+" : ""}{fmtBRL(totalPeriodo)}
            </div>
          </div>
        </div>
        <div style={{ height: 200, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ left: -18, right: 6, top: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.ink} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={T.ink} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.hair} vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: T.faint }} interval={5} tickLine={false} axisLine={{ stroke: T.border }} />
              <YAxis tick={{ fontSize: 10, fill: T.faint }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: fontBody }}
                formatter={(v, n, p) => [
                  <span key="t">{fmtBRLc(v)} <b style={{ color: p.payload.delta >= 0 ? T.pos : T.neg }}>
                    ({p.payload.delta >= 0 ? "+" : ""}{fmtBRL(p.payload.delta)})</b></span>, "Faturamento do dia"]}
                labelFormatter={(l) => `Dia ${l}`} />
              <Area type="monotone" dataKey="faturamento" stroke={T.ink} strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Calendário da oferta + Rastreamento */}
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1.2fr 1fr", gap: 22 }}>
        <CalendarioOferta projeto={projeto} userById={userById} />
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <Eyebrow>Rastreamento de mudanças</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {atividade.length === 0 && <span style={{ fontSize: 13, color: T.faint }}>Nenhuma alteração ainda.</span>}
            {atividade.map((a) => {
              const u = userById(a.user);
              return (
                <div key={a.id} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <Avatar user={u} size={28} />
                  <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                    <b style={{ fontWeight: 600 }}>{u.nome.split(" ")[0]}</b> <span style={{ color: T.muted }}>{a.acao}</span>
                    <div style={{ fontSize: 11.5, color: T.faint, marginTop: 1 }}>{a.quando}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Campo({ label, valor, icon: Icon, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && <Icon size={13} color={T.faint} />}{label}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{valor}</div>
    </div>
  );
}

function CalendarioOferta({ projeto, userById }) {
  // ações fictícias ligadas ao projeto
  const acoes = [
    { dia: 4, label: "Subiu novo criativo", resp: "u4" },
    { dia: 9, label: "Trocou headline da VSL", resp: "u3" },
    { dia: 16, label: "Aumentou verba 30%", resp: "u2" },
    { dia: 23, label: "Novo upsell no checkout", resp: "u1" },
  ];
  const dias = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
      <Eyebrow>Calendário da oferta — maio</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, marginBottom: 16 }}>
        {dias.map((d) => {
          const ac = acoes.find((a) => a.dia === d);
          return (
            <div key={d} title={ac?.label}
              style={{ aspectRatio: "1", borderRadius: 8, border: `1px solid ${ac ? T.ink : T.hair}`,
                background: ac ? T.ink : T.surface, color: ac ? "#fff" : T.faint, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 11.5, fontFamily: fontDisplay,
                fontVariantNumeric: "tabular-nums" }}>
              {d}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {acoes.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
            <span style={{ fontFamily: fontDisplay, color: T.faint, width: 22 }}>{String(a.dia).padStart(2, "0")}/05</span>
            <Avatar user={userById(a.resp)} size={20} />
            <span>{a.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendário geral                                                   */
/* ------------------------------------------------------------------ */
/**
 * Conexão com o Google Agenda (STUB).
 * TODO: OAuth com a conta Google da empresa + Google Calendar API.
 *   - Listar eventos: GET calendar/v3/calendars/{calendarId}/events
 *   - Criar/atualizar do app no Google: POST/PATCH .../events
 *   - Sincronização nos dois sentidos via sync tokens / webhooks (watch).
 */
function conectarGoogleAgenda() { return { ok: true }; }

const GOOGLE_EVENTOS = [
  { tipo: "google", data: "2025-05-12", label: "Reunião com fornecedor", resp: null },
  { tipo: "google", data: "2025-05-14", label: "Vencimento — pagamento de mídia", resp: null },
];

function CalendarioGeral({ tarefas, reunioes, userById, projById }) {
  const [filtro, setFiltro] = useState("todos");
  const [googleOn, setGoogleOn] = useState(false);
  const eventos = [
    ...tarefas.map((t) => ({ tipo: "tarefa", data: t.data, label: t.titulo, resp: t.resp, proj: t.proj })),
    ...reunioes.flatMap((r) => r.participantes.map((p) => ({ tipo: "reuniao", data: r.data, label: r.titulo, resp: p }))),
    ...(googleOn ? GOOGLE_EVENTOS : []),
  ].filter((e) => filtro === "todos" || e.resp === filtro)
   .sort((a, b) => a.data.localeCompare(b.data));

  const badge = (tipo) =>
    tipo === "reuniao" ? { l: "Reunião", c: T.pos, bg: T.posBg }
    : tipo === "google" ? { l: "Google Agenda", c: "#1A73E8", bg: "#E8F0FE" }
    : { l: "Tarefa", c: T.muted, bg: T.hair };

  return (
    <div>
      <Header titulo="Calendário geral" sub="Toda ação com data e responsável aparece aqui — e no calendário pessoal de quem foi designado." />

      {/* Conexão Google Agenda */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: googleOn ? "#E8F0FE" : T.surface, border: `1px solid ${googleOn ? "#C6DAFC" : T.border}`,
        borderRadius: 14, padding: "13px 16px", marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: googleOn ? "#1A73E8" : T.hair,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarDays size={17} color={googleOn ? "#fff" : T.muted} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>
              {googleOn ? "Google Agenda conectada" : "Conectar Google Agenda"}
            </div>
            <div style={{ fontSize: 12, color: googleOn ? "#1A56C4" : T.faint }}>
              {googleOn ? "Agenda da empresa · sincronizando nos dois sentidos" : "Sincronize reuniões e prazos com a conta da empresa."}
            </div>
          </div>
        </div>
        {googleOn ? (
          <button onClick={() => setGoogleOn(false)}
            style={{ fontSize: 12.5, color: "#1A56C4", border: "1px solid #C6DAFC", background: "transparent", borderRadius: 9, padding: "7px 12px" }}>
            Desconectar
          </button>
        ) : (
          <button onClick={() => { conectarGoogleAgenda(); setGoogleOn(true); }}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#fff",
              border: "none", background: "#1A73E8", borderRadius: 10, padding: "9px 14px" }}>
            <Globe size={15} /> Conectar
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        <ChipFiltro ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</ChipFiltro>
        {USERS.map((u) => (
          <ChipFiltro key={u.id} ativo={filtro === u.id} onClick={() => setFiltro(u.id)}>{u.nome.split(" ")[0]}</ChipFiltro>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {eventos.map((e, i) => {
          const u = e.resp ? userById(e.resp) : null;
          const p = e.proj ? projById(e.proj) : null;
          const b = badge(e.tipo);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 13, padding: "13px 16px" }}>
              <div style={{ textAlign: "center", width: 46 }}>
                <div style={{ fontFamily: fontDisplay, fontSize: 17, fontWeight: 600 }}>{e.data.slice(8, 10)}</div>
                <div style={{ fontSize: 11, color: T.faint }}>mai</div>
              </div>
              <div style={{ width: 1, height: 30, background: T.hair }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.label}</div>
                <div style={{ fontSize: 12, color: T.faint, display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                  <span style={{ background: b.bg, color: b.c, padding: "1px 7px", borderRadius: 5 }}>{b.l}</span>
                  {p && <span>{p.nome}</span>}
                </div>
              </div>
              {u ? <Avatar user={u} size={28} /> : (
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "#E8F0FE", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Globe size={15} color="#1A73E8" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChipFiltro({ ativo, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 500,
        border: `1px solid ${ativo ? T.ink : T.border}`, background: ativo ? T.ink : T.surface,
        color: ativo ? "#fff" : T.muted }}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Tarefas gerais                                                     */
/* ------------------------------------------------------------------ */
function TarefasGerais({ tarefas, setTarefas, userById, projById }) {
  const toggle = (id) => setTarefas((ts) => ts.map((t) => t.id === id ? { ...t, feito: !t.feito } : t));
  const pend = tarefas.filter((t) => !t.feito);
  const ok = tarefas.filter((t) => t.feito);
  const Linha = (t) => {
    const u = userById(t.resp), p = projById(t.proj);
    return (
      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 13, background: T.surface,
        border: `1px solid ${T.border}`, borderRadius: 13, padding: "12px 16px" }}>
        <button onClick={() => toggle(t.id)}
          style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${t.feito ? T.pos : T.border}`,
            background: t.feito ? T.pos : T.surface, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
          {t.feito && <Check size={13} color="#fff" />}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, textDecoration: t.feito ? "line-through" : "none", color: t.feito ? T.faint : T.ink }}>{t.titulo}</div>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>{p?.nome} · vence {t.data.slice(8, 10)}/05</div>
        </div>
        <Avatar user={u} size={26} />
      </div>
    );
  };
  return (
    <div>
      <Header titulo="Tarefas gerais" sub="Tarefas de todos os projetos, com responsável e prazo." />
      <Eyebrow>Pendentes · {pend.length}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>{pend.map(Linha)}</div>
      <Eyebrow>Concluídas · {ok.length}</Eyebrow>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{ok.map(Linha)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reuniões                                                           */
/* ------------------------------------------------------------------ */
function Reunioes({ reunioes, userById }) {
  return (
    <div>
      <Header titulo="Reuniões" sub="Encontros agendados da equipe." />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reunioes.map((r) => (
          <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center", width: 50 }}>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600 }}>{r.data.slice(8, 10)}</div>
                <div style={{ fontSize: 11.5, color: T.faint }}>mai · {r.hora}</div>
              </div>
              <div style={{ width: 1, height: 34, background: T.hair }} />
              <div style={{ fontSize: 14.5, fontWeight: 600, fontFamily: fontDisplay }}>{r.titulo}</div>
            </div>
            <div style={{ display: "flex" }}>
              {r.participantes.map((p, i) => (
                <div key={p} style={{ marginLeft: i ? -8 : 0, border: "2px solid #fff", borderRadius: 999 }}>
                  <Avatar user={userById(p)} size={28} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desempenho (métricas de anúncios via UTMfy — somente leitura)      */
/* ------------------------------------------------------------------ */

/**
 * Métricas do UTMfy (STUB).
 * TODO: trocar pela chamada real à API do UTMfy. Traz as métricas
 * consolidadas por campanha/criativo (faturamento, gasto, ROAS, vendas),
 * cruzando dados do gerenciador de anúncios e do checkout (Cakto).
 *   GET https://api.utmify.com.br/... (Bearer token) -> normalizar para a lista abaixo.
 */
function buscarDesempenhoUTMfy(projectId) { void projectId; return { ok: true }; }

function StatusBadge({ status }) {
  const map = {
    ATIVO: { l: "Ativo", c: T.pos, bg: T.posBg },
    EM_REVISAO: { l: "Em revisão", c: "#9A7B16", bg: "#FBF3DC" },
    PAUSADO: { l: "Pausado", c: T.muted, bg: T.hair },
  };
  const s = map[status] || map.PAUSADO;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 600, color: s.c, background: s.bg, padding: "2px 9px", borderRadius: 6 }}>{s.l}</span>
  );
}

function RoasTag({ roas }) {
  const bom = roas >= 1;
  return (
    <span style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums",
      color: bom ? T.pos : T.neg }}>{roas.toFixed(1)}x</span>
  );
}

function AnunciosTab({ projeto, onRegistrar, naoAtribuidos = [], onAtribuir }) {
  const m = useMobile();
  const CORES = ["#B89C82", "#7FA6A0", "#A6809A"];
  const [utmfyOn, setUtmfyOn] = useState(true);

  const totalVendas = projeto.criativos.reduce((s, c) => s + (c.vendas || 0), 0);
  const ticket = projeto.faturamento / Math.max(1, totalVendas);
  const roasDe = (vendas, gasto) => (gasto > 0 ? (vendas * ticket) / gasto : 0);

  const ads = useMemo(() =>
    projeto.criativos.filter((c) => c.nome && c.nome !== "—").map((c, i) => {
      const gasto = Math.round((projeto.gastoAds || 0) / Math.max(1, projeto.criativos.length));
      return {
        id: "ad-" + projeto.id + "-" + i, nome: c.nome, status: "ATIVO",
        gasto, vendas: c.vendas, roas: roasDe(c.vendas, gasto), thumbnailUrl: c.thumbnailUrl,
      };
    }), [projeto.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Conexão UTMfy */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        background: utmfyOn ? "#F1ECFB" : T.surface, border: `1px solid ${utmfyOn ? "#DDD0F5" : T.border}`,
        borderRadius: 14, padding: "13px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: utmfyOn ? "#7C5CFF" : T.hair,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Activity size={17} color={utmfyOn ? "#fff" : T.muted} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{utmfyOn ? "UTMfy conectado" : "Conectar UTMfy"}</div>
            <div style={{ fontSize: 12, color: utmfyOn ? "#6A4FD0" : T.faint }}>
              {utmfyOn ? "Métricas sincronizadas do gerenciador e do checkout" : "Traga faturamento, gasto, ROAS e vendas para o app."}
            </div>
          </div>
        </div>
        {utmfyOn ? (
          <button onClick={() => setUtmfyOn(false)}
            style={{ fontSize: 12.5, color: "#6A4FD0", border: "1px solid #DDD0F5", background: "transparent", borderRadius: 9, padding: "7px 12px" }}>
            Desconectar
          </button>
        ) : (
          <button onClick={() => { buscarDesempenhoUTMfy(projeto.id); setUtmfyOn(true); }}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#fff",
              border: "none", background: "#7C5CFF", borderRadius: 10, padding: "9px 14px" }}>
            <Activity size={15} /> Conectar
          </button>
        )}
      </div>

      <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
        <Eyebrow>Desempenho por criativo</Eyebrow>
        {!utmfyOn ? (
          <div style={{ textAlign: "center", padding: "26px 0", color: T.faint, fontSize: 13 }}>
            Conecte o UTMfy para ver o desempenho dos criativos.
          </div>
        ) : ads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "26px 0", color: T.faint, fontSize: 13 }}>
            Sem dados do UTMfy para este projeto ainda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ads.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 13, border: `1px solid ${T.border}`,
                borderRadius: 13, padding: "12px 14px" }}>
                <CreativeThumb creative={a} color={CORES[i % CORES.length]} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 12, color: T.faint }}>via UTMfy</div>
                </div>
                {!m && (
                  <div style={{ textAlign: "right", width: 70 }}>
                    <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(a.gasto)}</div>
                    <div style={{ fontSize: 10.5, color: T.faint }}>gasto</div>
                  </div>
                )}
                <div style={{ textAlign: "right", width: 46 }}>
                  <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{a.vendas}</div>
                  <div style={{ fontSize: 10.5, color: T.faint }}>vendas</div>
                </div>
                <div style={{ textAlign: "right", width: 52 }}>
                  <RoasTag roas={a.roas} />
                  <div style={{ fontSize: 10.5, color: T.faint }}>ROAS</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {utmfyOn && naoAtribuidos.length > 0 && (
        <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
          <Eyebrow>Campanhas não atribuídas</Eyebrow>
          <p style={{ fontSize: 12.5, color: T.faint, margin: "-6px 0 16px" }}>
            O UTMfy trouxe estas campanhas sem projeto. Atribua ao projeto correto.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {naoAtribuidos.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 13, border: `1px dashed ${T.border}`,
                borderRadius: 13, padding: "12px 14px" }}>
                <CreativeThumb creative={a} color={CORES[i % CORES.length]} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 12, color: T.faint }}>via UTMfy · camp. {a.metaCampaignId}</div>
                </div>
                {!m && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: fontDisplay, fontWeight: 600, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{fmtBRL(a.gasto)}</div>
                    <div style={{ fontSize: 10.5, color: T.faint }}>gasto</div>
                  </div>
                )}
                <button onClick={() => onAtribuir?.(a)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "none",
                    background: T.primary, color: "#fff", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
                  <Plus size={14} /> Atribuir
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Estruturas (venda · entregável · suporte)                          */
/* ------------------------------------------------------------------ */
const CAMPOS_VENDA = [
  ["funil", "Funil de vendas", true], ["preco", "Preço / ticket"], ["garantia", "Garantia"],
  ["gateway", "Gateway de pagamento"], ["upsells", "Upsells / Downsells", true], ["bumps", "Order bumps", true],
];
const CAMPOS_ENTREGAVEL = [
  ["oQueRecebe", "O que o cliente recebe", true], ["plataforma", "Plataforma de entrega"], ["formato", "Formato"],
  ["acesso", "Tempo de acesso"], ["bonus", "Bônus", true], ["cronograma", "Liberação / cronograma", true],
];
const CAMPOS_SUPORTE = [
  ["canais", "Canais de atendimento"], ["sla", "Tempo de resposta (SLA)"], ["responsavel", "Responsável pelo suporte"],
  ["reembolso", "Política de reembolso"], ["faq", "FAQ / dúvidas comuns", true],
];

function EstruturaSecao({ titulo, icon: Icon, campos, valores, onSalvar }) {
  const m = useMobile();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(valores);
  const set = (k, v) => setDraft({ ...draft, [k]: v });

  const inputSt = { width: "100%", marginTop: 6, padding: "9px 11px", borderRadius: 9,
    border: `1px solid ${T.border}`, fontSize: 13, fontFamily: fontBody, outline: "none", background: "#fff" };

  return (
    <section style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon size={16} color={T.ink} />
          <Eyebrow>{titulo}</Eyebrow>
        </div>
        {!edit ? (
          <button onClick={() => { setDraft(valores); setEdit(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`,
              background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
            <Pencil size={13} /> Editar
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEdit(false)}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.muted, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 9, padding: "6px 11px" }}>
              <X size={13} /> Cancelar
            </button>
            <button onClick={() => { onSalvar(draft); setEdit(false); }}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#fff", border: "none", background: T.primary, borderRadius: 9, padding: "6px 12px" }}>
              <Check size={13} /> Salvar
            </button>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: "16px 28px" }}>
        {campos.map(([k, label, full]) => (
          <div key={k} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
            <div style={{ fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
            {edit ? (
              full ? (
                <textarea value={draft[k] || ""} onChange={(e) => set(k, e.target.value)}
                  style={{ ...inputSt, minHeight: 50, resize: "vertical" }} />
              ) : (
                <input value={draft[k] || ""} onChange={(e) => set(k, e.target.value)} style={inputSt} />
              )
            ) : (
              <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{valores[k] || "—"}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function EstruturasTab({ projeto, onEditarEstrutura }) {
  const base = projeto.estruturas || ESTRUTURAS_INIT[projeto.id] || {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <EstruturaSecao titulo="Estrutura de venda" icon={DollarSign} campos={CAMPOS_VENDA}
        valores={base.venda || {}} onSalvar={(v) => onEditarEstrutura("venda", v)} />
      <EstruturaSecao titulo="Estrutura de entregável" icon={FolderKanban} campos={CAMPOS_ENTREGAVEL}
        valores={base.entregavel || {}} onSalvar={(v) => onEditarEstrutura("entregavel", v)} />
      <EstruturaSecao titulo="Estrutura de suporte" icon={MessageSquare} campos={CAMPOS_SUPORTE}
        valores={base.suporte || {}} onSalvar={(v) => onEditarEstrutura("suporte", v)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Novo projeto (formulário opcional)                                 */
/* ------------------------------------------------------------------ */
/**
 * API de clonagem de oferta (STUB).
 * TODO: trocar pelo endpoint real, ex.:
 *   const r = await fetch(`/api/v1/clonagem?url=${encodeURIComponent(url)}`);
 *   const d = await r.json();   // já mapeado para os campos do formulário abaixo
 * Aqui, no protótipo, devolve um exemplo fixo simulando o retorno da API.
 */
function buscarOfertaParaClonar(url) {
  return {
    nome: "",                 // fica em branco de propósito — você ajusta depois
    nicho: "Emagrecimento",
    oferta: "Protocolo de 30 dias de jejum guiado com cardápio e acompanhamento diário.",
    publico: "Mulheres que querem emagrecer sem dietas restritivas.",
    idade: "30–50",
    veiculo: "Meta Ads",
    link: url,
    personaNome: "Sandra, 38",
    personaDor: "Já tentou várias dietas e sempre recupera o peso.",
    personaDesejo: "Emagrecer de forma sustentável sem passar fome.",
    // dados extras que a API também traz (vão direto para o projeto clonado):
    personaObjecao: "Acha que não tem tempo para seguir um protocolo.",
    personaCanal: "Instagram e grupos de emagrecimento.",
    criativos: [
      { nome: "VSL Antes/Depois", vendas: 0 },
      { nome: "Reel Depoimento", vendas: 0 },
      { nome: "Carrossel Cardápio", vendas: 0 },
    ],
  };
}

function NovoProjeto({ onFechar, onCriar }) {
  const m = useMobile();
  const [modo, setModo] = useState("zero");                 // "zero" | "clonar"
  const [etapaClone, setEtapaClone] = useState("input");    // "input" | "carregando" | "pronto"
  const [origem, setOrigem] = useState("");                 // url da oferta clonada
  const [extra, setExtra] = useState(null);                 // dados extras da API (objeção, canal, criativos)
  const [f, setF] = useState({
    nome: "", nicho: "", oferta: "", publico: "", idade: "", veiculo: "Meta Ads",
    link: "", personaNome: "", personaDor: "", personaDesejo: "", linkClone: "",
  });
  const set = (k, v) => setF({ ...f, [k]: v });

  const trocarModo = (m) => {
    setModo(m);
    if (m === "clonar") setEtapaClone("input");
  };

  // Chama a API de clonagem e preenche TODO o formulário com a oferta de origem.
  const buscarOferta = () => {
    if (!f.linkClone.trim()) return;
    setEtapaClone("carregando");
    setTimeout(() => {                                        // simula latência da API
      const d = buscarOfertaParaClonar(f.linkClone.trim());
      setOrigem(f.linkClone.trim());
      setExtra({ personaObjecao: d.personaObjecao, personaCanal: d.personaCanal, criativos: d.criativos });
      setF((prev) => ({
        ...prev,
        nome: d.nome, nicho: d.nicho, oferta: d.oferta, publico: d.publico, idade: d.idade,
        veiculo: d.veiculo, link: d.link,
        personaNome: d.personaNome, personaDor: d.personaDor, personaDesejo: d.personaDesejo,
      }));
      setEtapaClone("pronto");
    }, 700);
  };

  const criar = () => {
    if (!f.nome.trim()) return;
    onCriar({
      id: "p" + Date.now(), nome: f.nome, nicho: f.nicho || "—", ativo: true,
      faturamento: 0, fatSemana: 0, lucro: 0, gastoAds: 0, tempoOnline: 0,
      veiculo: f.veiculo, oferta: f.oferta || "—", publico: f.publico || "—", idade: f.idade || "—",
      links: [
        ...(f.link ? [{ tipo: "Landing page", url: f.link }] : []),
        ...(modo === "clonar" && origem ? [{ tipo: "Oferta de origem", url: origem }] : []),
      ],
      persona: {
        nome: f.personaNome || "—", dor: f.personaDor || "—", desejo: f.personaDesejo || "—",
        objecao: extra?.personaObjecao || "—", canal: extra?.personaCanal || "—",
      },
      criativos: extra?.criativos || [{ nome: "—", vendas: 0 }, { nome: "—", vendas: 0 }, { nome: "—", vendas: 0 }],
      escala: 0.5, clone: modo === "clonar",
    });
  };

  const Input = ({ k, label, ph, full, highlight }) => (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>{label}</label>
      <input value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
        style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10,
          border: `1px solid ${highlight ? T.ink : T.border}`,
          fontSize: 13.5, outline: "none", fontFamily: fontBody, background: "#fff" }} />
    </div>
  );

  const noPassoLink = modo === "clonar" && etapaClone !== "pronto";
  const mostrarForm = modo === "zero" || (modo === "clonar" && etapaClone === "pronto");

  return (
    <div onClick={onFechar} style={{ position: "fixed", inset: 0, background: "rgba(24,24,27,.32)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflow: "auto", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 18, width: "100%",
        maxWidth: 560, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: fontDisplay, fontSize: 19, fontWeight: 700, margin: 0 }}>Novo projeto</h2>
          <button onClick={onFechar} style={{ border: "none", background: "transparent", color: T.muted }}><X size={20} /></button>
        </div>

        {/* Escolha do modo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { id: "zero", icon: Plus, titulo: "Do zero", sub: "Preencher a oferta manualmente" },
            { id: "clonar", icon: Copy, titulo: "Clonar oferta", sub: "Puxar de uma oferta existente" },
          ].map((m) => {
            const ativo = modo === m.id;
            return (
              <button key={m.id} onClick={() => trocarModo(m.id)}
                style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12,
                  border: `1.5px solid ${ativo ? T.ink : T.border}`, background: ativo ? T.bg : T.surface,
                  display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: ativo ? T.ink : T.hair,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <m.icon size={16} color={ativo ? "#fff" : T.muted} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.titulo}</div>
                  <div style={{ fontSize: 11.5, color: T.faint, lineHeight: 1.3, marginTop: 1 }}>{m.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Passo do link (modo clonar, antes de importar) */}
        {noPassoLink && (
          <>
            <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 18px" }}>
              Cole o link da oferta a clonar. Ao buscar, todos os campos abaixo são preenchidos
              automaticamente com os dados da oferta de origem — você só ajusta o nome.
            </p>
            <div>
              <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                <Link2 size={13} color={T.faint} /> Link da oferta a clonar *
              </label>
              <input value={f.linkClone} onChange={(e) => set("linkClone", e.target.value)}
                placeholder="https://oferta-de-origem.com"
                disabled={etapaClone === "carregando"}
                style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`,
                  fontSize: 14, outline: "none", fontFamily: fontBody, background: "#fff" }} />
            </div>
            {etapaClone === "carregando" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, color: T.muted }}>
                <Copy size={14} /> Importando dados da oferta…
              </div>
            )}
          </>
        )}

        {/* Formulário completo (do zero, ou clonar já importado) */}
        {mostrarForm && (
          <>
            {modo === "clonar" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                  <Copy size={15} color={T.ink} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>Oferta importada</div>
                    <div style={{ fontSize: 11.5, color: T.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{origem}</div>
                  </div>
                </div>
                <button onClick={() => setEtapaClone("input")}
                  style={{ fontSize: 12, color: T.muted, border: `1px solid ${T.border}`, background: T.surface,
                    borderRadius: 8, padding: "6px 10px", flexShrink: 0 }}>Trocar link</button>
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: T.faint, margin: "0 0 18px" }}>
                Nada é obrigatório além do nome — mas quanto mais você preencher, mais completa fica a oferta.
              </p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "1fr 1fr", gap: 14 }}>
              <Input k="nome" label={modo === "clonar" ? "Nome do projeto * (ajuste aqui)" : "Nome do projeto *"}
                ph="Ex.: Método Pele de Vidro" highlight={modo === "clonar"} />
              <Input k="nicho" label="Nicho" ph="Skincare" />
              <Input k="oferta" label="Qual é a oferta" ph="O que está sendo vendido" full />
              <Input k="publico" label="Público-alvo" ph="Quem é o público" />
              <div>
                <label style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>Maior veículo de venda</label>
                <select value={f.veiculo} onChange={(e) => set("veiculo", e.target.value)}
                  style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.border}`,
                    fontSize: 13.5, outline: "none", fontFamily: fontBody, background: "#fff" }}>
                  {VEICULOS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <Input k="idade" label="Idade do público" ph="28–45" />
              <Input k="link" label="Link da landing page / site" ph="https://" full />
              <Input k="personaNome" label="Persona — quem é" ph="Renata, 36" />
              <Input k="personaDor" label="Persona — dor" ph="Principal dor" />
              <Input k="personaDesejo" label="Persona — desejo" ph="O que ela quer" full />
            </div>
          </>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button onClick={onFechar} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${T.border}`,
            background: "#fff", fontSize: 13.5, color: T.muted }}>Cancelar</button>
          {noPassoLink ? (
            <button onClick={buscarOferta} disabled={!f.linkClone.trim() || etapaClone === "carregando"}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none",
                background: f.linkClone.trim() && etapaClone !== "carregando" ? T.primary : "#C9C7C0",
                color: "#fff", fontSize: 13.5, fontWeight: 600,
                cursor: f.linkClone.trim() && etapaClone !== "carregando" ? "pointer" : "not-allowed" }}>
              {etapaClone === "carregando" ? "Buscando…" : "Buscar oferta"}
            </button>
          ) : (
            <button onClick={criar} disabled={!f.nome.trim()}
              style={{ padding: "10px 18px", borderRadius: 10, border: "none",
                background: f.nome.trim() ? T.primary : "#C9C7C0", color: "#fff", fontSize: 13.5, fontWeight: 600,
                cursor: f.nome.trim() ? "pointer" : "not-allowed" }}>
              {modo === "clonar" ? "Criar projeto clonado" : "Criar projeto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
