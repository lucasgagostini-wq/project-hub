import { supabase, isMockMode } from "../supabase";

// Ideias gerais (banco de ideias para novos projetos). Tabela `ideas` no Supabase.
// Em modo mock, o App gerencia o array em memória + localStorage; estas funções
// só fazem trabalho real quando o Supabase está ligado.

function norm(r) {
  return {
    id: r.id,
    titulo: r.title,
    nicho: r.niche || "",
    descricao: r.description || "",
    status: r.status || "ideia",
    criadoEm: r.created_at,
  };
}

export async function listIdeas() {
  if (isMockMode) return [];
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(norm);
}

export async function createIdea(idea) {
  if (isMockMode) {
    return { id: "ig-" + Date.now(), criadoEm: new Date().toISOString(), status: "ideia", ...idea };
  }
  const { data, error } = await supabase
    .from("ideas")
    .insert({
      title: idea.titulo,
      niche: idea.nicho || null,
      description: idea.descricao || null,
      status: idea.status || "ideia",
    })
    .select()
    .single();
  if (error) throw error;
  return norm(data);
}

export async function updateIdea(id, patch) {
  if (isMockMode) return;
  const dbPatch = {};
  if (patch.titulo !== undefined) dbPatch.title = patch.titulo;
  if (patch.nicho !== undefined) dbPatch.niche = patch.nicho;
  if (patch.descricao !== undefined) dbPatch.description = patch.descricao;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  const { error } = await supabase.from("ideas").update(dbPatch).eq("id", id);
  if (error) throw error;
}

export async function deleteIdea(id) {
  if (isMockMode) return;
  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) throw error;
}
