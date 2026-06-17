import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Modo "time sem login" ────────────────────────────────────────────────────
// Perfis estilo Netflix, SEM senha (Lucas/Davi/Folha): clicou no perfil, entra.
// Mas os dados são COMPARTILHADOS via Supabase (anon key + RLS liberado p/ anon),
// não autenticação por usuário. O perfil selecionado é só o "ator" das ações.
//
// PROTOTYPE_MODE=true força o modo local (mock/localStorage), sem Supabase — útil
// se as env vars não estiverem setadas. Com Supabase configurado, roda compartilhado.
export const PROTOTYPE_MODE = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Variáveis de ambiente não configuradas. Rodando em modo mock (local).");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
    : null;

// Mock (dados locais) só quando forçado OU sem Supabase. Caso contrário: time compartilhado.
export const isMockMode = PROTOTYPE_MODE || !supabase;
