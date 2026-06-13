import { supabase, isMockMode } from "../supabase";
import { MOCK_USERS } from "./mockData";

// Retorna o usuário logado no Supabase ou, em mock mode, o user salvo em sessionStorage.
export async function getSession() {
  if (isMockMode) {
    const raw = sessionStorage.getItem("ph_mock_user");
    return raw ? JSON.parse(raw) : null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signIn(email, password) {
  if (isMockMode) {
    const u = MOCK_USERS.find((u) => u.email === email);
    if (!u) throw new Error("Usuário não encontrado");
    // Em mock mode qualquer senha funciona
    sessionStorage.setItem("ph_mock_user", JSON.stringify(u));
    return { user: u };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (isMockMode) {
    sessionStorage.removeItem("ph_mock_user");
    return;
  }
  await supabase.auth.signOut();
}

// Retorna o perfil enriquecido (nome, cor, papel) do usuário autenticado.
// Em modo real, busca na tabela `profiles`; em mock, retorna o MOCK_USER.
export async function getProfile(userId) {
  if (isMockMode) {
    return MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function listUsers() {
  if (isMockMode) return MOCK_USERS;
  const { data, error } = await supabase.from("profiles").select("*").order("name");
  if (error) throw error;
  return data;
}
