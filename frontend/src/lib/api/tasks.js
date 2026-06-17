import { supabase, isMockMode } from "../supabase";
import { MOCK_TAREFAS } from "./mockData";

let mockTarefas = [...MOCK_TAREFAS];

// Supabase row -> shape do app. UI usa titulo/resp/feito/proj/data; DB usa title/assignee_id/done/...
function normTask(row) {
  return {
    id: row.id,
    titulo: row.title,
    resp: row.assignee_id,        // quem RECEBE a tarefa
    delegadoPor: row.created_by,  // quem DELEGOU
    proj: row.project_id,
    data: row.due_date,
    feito: row.done,
    assignee: row.assignee || null,
    project: row.project || null,
  };
}

// shape do app -> colunas do DB (só os campos presentes no patch).
function toDb(p) {
  const d = {};
  if (p.titulo !== undefined) d.title = p.titulo;
  if (p.resp !== undefined) d.assignee_id = p.resp || null;
  if (p.created_by !== undefined) d.created_by = p.created_by || null;
  if (p.proj !== undefined) d.project_id = p.proj || null;
  if (p.data !== undefined) d.due_date = p.data || null;
  if (p.feito !== undefined) d.done = p.feito;
  return d;
}

export async function listTasks(filters = {}) {
  if (isMockMode) {
    let t = [...mockTarefas];
    if (filters.projectId) t = t.filter((x) => x.proj === filters.projectId);
    if (filters.userId) t = t.filter((x) => x.resp === filters.userId);
    return t;
  }
  let q = supabase
    .from("tasks")
    .select("*, assignee:profiles!assignee_id(id, name, initial, color, role), project:projects(id, name)");
  if (filters.projectId) q = q.eq("project_id", filters.projectId);
  if (filters.userId) q = q.eq("assignee_id", filters.userId);
  q = q.order("due_date", { ascending: true });
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normTask);
}

export async function createTask(payload) {
  if (isMockMode) {
    const t = { id: "t" + Date.now(), feito: false, delegadoPor: payload.created_by, ...payload };
    mockTarefas = [t, ...mockTarefas];
    return t;
  }
  const { data, error } = await supabase
    .from("tasks")
    .insert({ ...toDb(payload), done: false })
    .select("*, assignee:profiles!assignee_id(id, name, initial, color, role), project:projects(id, name)")
    .single();
  if (error) throw error;
  return normTask(data);
}

export async function updateTask(id, patch) {
  if (isMockMode) {
    mockTarefas = mockTarefas.map((t) => (t.id === id ? { ...t, ...patch } : t));
    return mockTarefas.find((t) => t.id === id);
  }
  const { data, error } = await supabase
    .from("tasks").update(toDb(patch)).eq("id", id)
    .select("*, assignee:profiles!assignee_id(id, name, initial, color, role), project:projects(id, name)")
    .single();
  if (error) throw error;
  return normTask(data);
}

export async function deleteTask(id) {
  if (isMockMode) {
    mockTarefas = mockTarefas.filter((t) => t.id !== id);
    return;
  }
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
