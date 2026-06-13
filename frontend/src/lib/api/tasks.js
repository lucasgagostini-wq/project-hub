import { supabase, isMockMode } from "../supabase";
import { MOCK_TAREFAS } from "./mockData";

let mockTarefas = [...MOCK_TAREFAS];

export async function listTasks(filters = {}) {
  if (isMockMode) {
    let t = [...mockTarefas];
    if (filters.projectId) t = t.filter((x) => x.proj === filters.projectId);
    if (filters.userId) t = t.filter((x) => x.resp === filters.userId);
    return t;
  }
  let q = supabase.from("tasks").select("*, assignee:profiles!assignee_id(*), project:projects(id,name)");
  if (filters.projectId) q = q.eq("project_id", filters.projectId);
  if (filters.userId) q = q.eq("assignee_id", filters.userId);
  q = q.order("due_date", { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createTask(payload) {
  if (isMockMode) {
    const t = { id: "t" + Date.now(), feito: false, ...payload };
    mockTarefas = [t, ...mockTarefas];
    return t;
  }
  const { data, error } = await supabase.from("tasks").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id, patch) {
  if (isMockMode) {
    mockTarefas = mockTarefas.map((t) => (t.id === id ? { ...t, ...patch } : t));
    return mockTarefas.find((t) => t.id === id);
  }
  const { data, error } = await supabase.from("tasks").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  if (isMockMode) {
    mockTarefas = mockTarefas.filter((t) => t.id !== id);
    return;
  }
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
