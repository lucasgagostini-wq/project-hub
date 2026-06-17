import { supabase, isMockMode } from "../supabase";
import { MOCK_USERS } from "./mockData";

// ── Ator (perfil selecionado, sem senha) ─────────────────────────────────────
// No modo "time sem login", o perfil escolhido na tela Netflix vira o "ator" das
// ações. Guardamos o perfil inteiro no localStorage (compartilhado entre abas/reload).
const ACTOR_KEY = "ph_actor";

export function getActor() {
  try {
    const raw = localStorage.getItem(ACTOR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setActor(profile) {
  try { localStorage.setItem(ACTOR_KEY, JSON.stringify(profile)); } catch {}
}
export function clearActor() {
  try { localStorage.removeItem(ACTOR_KEY); } catch {}
}

// Sessão = ator selecionado (mock usa sessionStorage legado; time usa localStorage).
export async function getSession() {
  if (isMockMode) {
    const raw = sessionStorage.getItem("ph_mock_user");
    return raw ? JSON.parse(raw) : null;
  }
  return getActor();
}

// Login mock por e-mail (mantido p/ compatibilidade; o fluxo de time usa setActor).
export async function signIn(email) {
  const u = MOCK_USERS.find((x) => x.email === email) || MOCK_USERS[0];
  sessionStorage.setItem("ph_mock_user", JSON.stringify(u));
  return { user: u };
}

export async function signOut() {
  if (isMockMode) {
    sessionStorage.removeItem("ph_mock_user");
    return;
  }
  clearActor();
}

// Normaliza um profile do Supabase (chaves em inglês) p/ incluir também as chaves
// em português que o app usa (nome/inicial/cor/papel) — assim tudo renderiza igual.
function normProfile(row) {
  if (!row) return row;
  return {
    ...row,
    nome: row.name ?? row.nome,
    inicial: row.initial ?? row.inicial,
    cor: row.color ?? row.cor,
    papel: row.role ?? row.papel,
  };
}

// Lista os perfis (no time, são os 3 fixos na tabela profiles).
export async function listUsers() {
  if (isMockMode) return MOCK_USERS;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, initial, color, role, avatar")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(normProfile);
}

export async function getProfile(userId) {
  if (isMockMode) return MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return normProfile(data);
}

// Edita o próprio perfil (apelido, cor, foto). patch usa chaves PT ou EN.
export async function updateProfile(id, patch) {
  const db = {};
  if (patch.nome !== undefined || patch.name !== undefined) db.name = patch.nome ?? patch.name;
  if (patch.inicial !== undefined || patch.initial !== undefined) db.initial = patch.inicial ?? patch.initial;
  if (patch.cor !== undefined || patch.color !== undefined) db.color = patch.cor ?? patch.color;
  if (patch.avatar !== undefined) db.avatar = patch.avatar;
  if (isMockMode) {
    const u = MOCK_USERS.find((x) => x.id === id);
    if (u) Object.assign(u, { nome: db.name ?? u.nome, inicial: db.initial ?? u.inicial, cor: db.color ?? u.cor, avatar: db.avatar ?? u.avatar });
    return u;
  }
  const { data, error } = await supabase.from("profiles").update(db).eq("id", id).select("*").single();
  if (error) throw error;
  return normProfile(data);
}
