import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Modo protótipo ───────────────────────────────────────────────────────────
// Protótipo SEM login/senha: clicou no perfil, entra (estilo Netflix). Os dados
// ficam locais (no navegador, via localStorage). Quando for religar o login real
// do Supabase (com usuários e RLS), troque PROTOTYPE_MODE para false.
export const PROTOTYPE_MODE = true;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[Supabase] Variáveis de ambiente não configuradas. Rodando em modo mock.");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// No protótipo o app roda em modo local (mock) mesmo com as env vars setadas —
// assim não depende de login/sessão autenticada do Supabase.
export const isMockMode = PROTOTYPE_MODE || !supabase;
