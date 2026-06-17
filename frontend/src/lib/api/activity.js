import { supabase, isMockMode } from "../supabase";
import { MOCK_ATIVIDADE } from "./mockData";

let mockAtividade = [...MOCK_ATIVIDADE];

function tempoAtras(iso) {
  if (!iso) return "Agora mesmo";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Agora mesmo";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "dia" : "dias"} atrás`;
}

// audit_log (Supabase) -> shape que o app usa (proj/user/acao/quando).
function normAtividade(row) {
  const u = row.user || null;
  return {
    id: row.id,
    proj: row.project_id,
    user: row.user_id,
    userObj: u ? { id: u.id, nome: u.name, name: u.name, inicial: u.initial, initial: u.initial, cor: u.color, color: u.color, papel: u.role } : null,
    acao: row.action,
    quando: tempoAtras(row.created_at),
    created_at: row.created_at,
  };
}

export async function listActivity(projectId) {
  if (isMockMode) {
    return projectId ? mockAtividade.filter((a) => a.proj === projectId) : mockAtividade;
  }
  let q = supabase
    .from("audit_log")
    .select("*, user:profiles(id, name, initial, color, role)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normAtividade);
}

// Grava a ação no audit_log com o ator atual (não há trigger de auth no modo time).
export async function logActivity(projectId, userId, action) {
  if (isMockMode) {
    const entry = { id: "a" + Date.now(), proj: projectId, user: userId, acao: action, quando: "Agora mesmo" };
    mockAtividade = [entry, ...mockAtividade];
    return entry;
  }
  const { error } = await supabase.from("audit_log").insert({
    project_id: projectId || null,
    user_id: userId || null,
    action,
  });
  if (error) throw error;
}
