// Dados fictícios usados quando VITE_SUPABASE_URL não está configurado (mock mode).
// Quando o Supabase estiver conectado, estes dados não são usados.

export const MOCK_USERS = [
  { id: "u1", nome: "Rafael Lima",   inicial: "RL", cor: "#3B82F6", papel: "Fundador",            email: "rafael@example.com" },
  { id: "u2", nome: "Marina Souza",  inicial: "MS", cor: "#1E8E5A", papel: "Gestora de Tráfego",  email: "marina@example.com" },
  { id: "u3", nome: "Bruno Alves",   inicial: "BA", cor: "#C8412F", papel: "Copywriter",           email: "bruno@example.com" },
  { id: "u4", nome: "Carla Dias",    inicial: "CD", cor: "#7C5CFF", papel: "Designer",             email: "carla@example.com" },
];

export const MOCK_PROJETOS = [];

export const MOCK_ATIVIDADE = [];

export const MOCK_TAREFAS = [];

export const MOCK_REUNIOES = [];

export const MOCK_NAO_ATRIBUIDOS = [
  { id: "ext-1", nome: "Campanha Black — Conjunto A", status: "ATIVO", objetivo: "Vendas / Conversões",
    gasto: 4200, vendas: 38, origem: "importado", metaCampaignId: "23847109201", metaAdId: "60192384701" },
  { id: "ext-2", nome: "Reels Teste 04", status: "PAUSADO", objetivo: "Tráfego",
    gasto: 980, vendas: 0, origem: "importado", metaCampaignId: "23847109244", metaAdId: "60192399902" },
];

export const MOCK_ESTRUTURAS = {};
