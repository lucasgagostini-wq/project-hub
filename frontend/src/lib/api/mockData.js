// Dados fictícios usados quando VITE_SUPABASE_URL não está configurado (mock mode).
// Quando o Supabase estiver conectado, estes dados não são usados.

export const MOCK_USERS = [
  { id: "u1", nome: "Rafael Lima",   inicial: "RL", cor: "#3B82F6", papel: "Fundador",            email: "rafael@example.com" },
  { id: "u2", nome: "Marina Souza",  inicial: "MS", cor: "#1E8E5A", papel: "Gestora de Tráfego",  email: "marina@example.com" },
  { id: "u3", nome: "Bruno Alves",   inicial: "BA", cor: "#C8412F", papel: "Copywriter",           email: "bruno@example.com" },
  { id: "u4", nome: "Carla Dias",    inicial: "CD", cor: "#7C5CFF", papel: "Designer",             email: "carla@example.com" },
];

function gerarTimeline(base, escala) {
  const arr = [];
  let v = base;
  for (let i = 0; i < 30; i++) {
    const ruido = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * base * 0.06;
    v = Math.max(base * 0.3, v + escala * base * 0.02 + ruido);
    const dia = new Date(2025, 4, 1 + i);
    arr.push({ dia: dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), faturamento: Math.round(v) });
  }
  return arr.map((d, i) => ({ ...d, delta: i === 0 ? 0 : d.faturamento - arr[i - 1].faturamento }));
}

export const MOCK_PROJETOS = [
  {
    id: "p1", nome: "Método Pele de Vidro", nicho: "Skincare", ativo: true,
    faturamento: 184200, fatSemana: 52400, lucro: 71300, gastoAds: 86100,
    tempoOnline: 47, veiculo: "Meta Ads",
    oferta: "Protocolo de 21 dias para pele luminosa, com 4 upsells.",
    links: [
      { tipo: "Landing page", url: "https://peledevidro.com/vsl" },
      { tipo: "Checkout", url: "https://cakto.com.br/pele-21d" },
    ],
    publico: "Mulheres preocupadas com sinais de idade e textura da pele.",
    idade: "28–45",
    preco: "R$ 197 (em até 12x)", garantia: "30 dias incondicional", gateway: "Cakto",
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
    timeline: gerarTimeline(6000, 1.4),
  },
  {
    id: "p2", nome: "Renda com IA", nicho: "Educação", ativo: true,
    faturamento: 142800, fatSemana: 61900, lucro: 58400, gastoAds: 62200,
    tempoOnline: 23, veiculo: "Meta Ads",
    oferta: "Curso de prestação de serviços usando IA, com comunidade.",
    links: [{ tipo: "Landing page", url: "https://rendacomia.com" }],
    publico: "Pessoas querendo renda extra com habilidades digitais.",
    idade: "22–40",
    preco: "R$ 297 (em até 12x)", garantia: "7 dias", gateway: "Cakto",
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
    timeline: gerarTimeline(5000, 1.9),
  },
  {
    id: "p3", nome: "Inglês em 8 Semanas", nicho: "Idiomas", ativo: true,
    faturamento: 98400, fatSemana: 18700, lucro: 29900, gastoAds: 51200,
    tempoOnline: 89, veiculo: "Google Ads",
    oferta: "Método de conversação acelerada com correção por áudio.",
    links: [{ tipo: "Site", url: "https://ingles8semanas.com" }],
    publico: "Profissionais que precisam de inglês para o trabalho.",
    idade: "25–50",
    preco: "R$ 397", garantia: "14 dias", gateway: "Cakto",
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
    timeline: gerarTimeline(3500, -0.8),
  },
];

export const MOCK_ATIVIDADE = [
  { id: "a1", proj: "p2", user: "u2", acao: "alterou o veículo principal para Meta Ads", quando: "Há 2 horas" },
  { id: "a2", proj: "p1", user: "u3", acao: "editou a persona (objeção principal)", quando: "Há 5 horas" },
  { id: "a3", proj: "p1", user: "u4", acao: "adicionou o criativo 'Reel 7 dias'", quando: "Ontem, 18:42" },
  { id: "a4", proj: "p2", user: "u1", acao: "criou o projeto", quando: "Há 3 dias" },
];

export const MOCK_TAREFAS = [
  { id: "t1", titulo: "Gravar nova VSL de teste", proj: "p2", resp: "u3", data: "2025-05-14", feito: false },
  { id: "t2", titulo: "Subir 3 criativos de retargeting", proj: "p1", resp: "u4", data: "2025-05-12", feito: false },
  { id: "t3", titulo: "Revisar custo por venda da semana", proj: "p3", resp: "u2", data: "2025-05-13", feito: true },
  { id: "t4", titulo: "Atualizar checkout com novo upsell", proj: "p1", resp: "u1", data: "2025-05-15", feito: false },
];

export const MOCK_REUNIOES = [
  { id: "r1", titulo: "Review semanal de ofertas", data: "2025-05-13", hora: "10:00", participantes: ["u1", "u2", "u3"] },
  { id: "r2", titulo: "Planejamento criativo — Pele de Vidro", data: "2025-05-15", hora: "14:30", participantes: ["u1", "u4"] },
];

export const MOCK_NAO_ATRIBUIDOS = [
  { id: "ext-1", nome: "Campanha Black — Conjunto A", status: "ATIVO", objetivo: "Vendas / Conversões",
    gasto: 4200, vendas: 38, origem: "importado", metaCampaignId: "23847109201", metaAdId: "60192384701" },
  { id: "ext-2", nome: "Reels Teste 04", status: "PAUSADO", objetivo: "Tráfego",
    gasto: 980, vendas: 0, origem: "importado", metaCampaignId: "23847109244", metaAdId: "60192399902" },
];

export const MOCK_ESTRUTURAS = {
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
