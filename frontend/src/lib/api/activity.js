import { supabase, isMockMode } from "../supabase";
import { MOCK_ATIVIDADE } from "./mockData";

let mockAtividade = [...MOCK_ATIVIDADE];

export async function listActivity(projectId) {
  if (isMockMode) {
    return projectId ? mockAtividade.filter((a) => a.proj === projectId) : mockAtividade;
  }
  let q = supabase
    .from("audit_log")
    .select("*, user:profiles(id, name, initial, color, role)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function logActivity(projectId, userId, action) {
  if (isMockMode) {
    const entry = {
      id: "a" + Date.now(), proj: projectId, user: userId,
      acao: action, quando: "Agora mesmo",
    };
    mockAtividade = [entry, ...mockAtividade];
    return entry;
  }
  // Em modo real o AuditLog é escrito automaticamente pelo trigger no Postgres.
  // Esta função é um no-op no modo Supabase.
}
