import { supabase } from "../supabase";
import { cifrar, decifrar, criarCanario, conferirCanario } from "../cofre";

/**
 * Acessos, links e copy de cada oferta.
 *
 * O segredo é cifrado ANTES de sair daqui e decifrado só quando alguém pede
 * pra ver, com a senha-mestra em memória (ver lib/cofre.js).
 */

// ── Cofre ───────────────────────────────────────────────────────────────────

export async function listarAcessos(projectId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("offer_secrets")
    .select("id, titulo, tipo, identificador, segredo, salt, iv, obs, updated_at")
    .eq("project_id", projectId)
    .order("tipo", { ascending: true })
    .order("titulo", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Canário da oferta: null quando o cofre ainda não foi aberto nenhuma vez. */
export async function lerCanario(projectId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("offer_vault_check")
    .select("segredo, salt, iv")
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Abre o cofre da oferta.
 * - Primeira vez: grava o canário com a senha escolhida.
 * - Depois: confere a senha contra o canário.
 * @returns {boolean} true se a senha vale
 */
export async function abrirCofre(projectId, senhaMestra) {
  if (!senhaMestra) return false;
  const canario = await lerCanario(projectId);
  if (!canario) {
    const novo = await criarCanario(senhaMestra);
    const { error } = await supabase.from("offer_vault_check").insert({
      project_id: projectId, segredo: novo.cifrado, salt: novo.salt, iv: novo.iv,
    });
    if (error) throw error;
    return true;
  }
  return conferirCanario({ cifrado: canario.segredo, salt: canario.salt, iv: canario.iv }, senhaMestra);
}

export async function guardarAcesso(projectId, { titulo, tipo = "outro", identificador, segredo, obs }, senhaMestra) {
  if (!supabase) return null;
  if (!String(titulo || "").trim()) throw new Error("O acesso precisa de um nome.");
  const c = await cifrar(segredo ?? "", senhaMestra);
  const { data, error } = await supabase
    .from("offer_secrets")
    .insert({
      project_id: projectId,
      titulo: String(titulo).trim().slice(0, 200),
      tipo,
      identificador: identificador ? String(identificador).slice(0, 300) : null,
      obs: obs ? String(obs).slice(0, 2000) : null,
      segredo: c.cifrado, salt: c.salt, iv: c.iv,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Decifra um item — só com a senha-mestra correta. */
export async function revelarAcesso(linha, senhaMestra) {
  return decifrar({ cifrado: linha.segredo, salt: linha.salt, iv: linha.iv }, senhaMestra);
}

export async function apagarAcesso(id) {
  const { error } = await supabase.from("offer_secrets").delete().eq("id", id);
  if (error) throw error;
}

// ── Links ───────────────────────────────────────────────────────────────────

export async function listarLinks(projectId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("offer_links")
    .select("id, tipo, titulo, url, ordem")
    .eq("project_id", projectId)
    .order("ordem", { ascending: true })
    .order("tipo", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function guardarLink(projectId, { tipo = "outro", titulo, url }) {
  if (!supabase) return null;
  const limpa = String(url || "").trim();
  if (!limpa) throw new Error("O link precisa de uma URL.");
  const { data, error } = await supabase
    .from("offer_links")
    .insert({ project_id: projectId, tipo, titulo: titulo ? String(titulo).slice(0, 200) : null, url: limpa.slice(0, 1000) })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function apagarLink(id) {
  const { error } = await supabase.from("offer_links").delete().eq("id", id);
  if (error) throw error;
}

// ── Copy e prompts ──────────────────────────────────────────────────────────

export async function listarNotas(projectId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("offer_notes")
    .select("id, tipo, titulo, conteudo, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function salvarNota(projectId, { id, tipo = "copy", titulo, conteudo }) {
  if (!supabase) return null;
  if (!String(titulo || "").trim()) throw new Error("A nota precisa de um título.");
  const linha = {
    project_id: projectId,
    tipo,
    titulo: String(titulo).trim().slice(0, 200),
    conteudo: conteudo ? String(conteudo).slice(0, 20000) : null,
  };
  const q = id
    ? supabase.from("offer_notes").update(linha).eq("id", id)
    : supabase.from("offer_notes").insert(linha);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data;
}

export async function apagarNota(id) {
  const { error } = await supabase.from("offer_notes").delete().eq("id", id);
  if (error) throw error;
}
