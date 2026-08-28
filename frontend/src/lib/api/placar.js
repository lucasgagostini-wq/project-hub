import { supabase } from "../supabase";
import { fecharConta, diaSP } from "../placarCalc";

/**
 * Placar de ofertas — uma linha por oferta que roda, com o número que decide.
 *
 * A agregação é feita PELO BANCO (função `placar_ofertas`): o browser nunca
 * baixa linha de venda. Foi varredura no cliente que derrubou o banco da
 * Eterniza em 09/08/2026. O cálculo puro mora em `lib/placarCalc.js`.
 */
export { diaSP, periodoDe, fecharConta, decisoes } from "../placarCalc";

export async function carregarPlacar({ desde, ate }) {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("placar_ofertas", { p_desde: desde, p_ate: ate });
  if (error) throw error;
  return (data || []).map(fecharConta);
}

// ── Diário da oferta ────────────────────────────────────────────────────────
export async function listarDiario(projectId, { limite = 40 } = {}) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("offer_actions")
    .select("id, ocorreu_em, tipo, titulo, detalhe, autor_id, created_at")
    .eq("project_id", projectId)
    .order("ocorreu_em", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data || [];
}

export async function registrarNoDiario(projectId, { titulo, tipo = "outro", detalhe = null, ocorreu_em, autor_id = null }) {
  if (!supabase) return null;
  const linha = {
    project_id: projectId,
    titulo: String(titulo || "").trim().slice(0, 200),
    tipo,
    detalhe: detalhe ? String(detalhe).slice(0, 2000) : null,
    ocorreu_em: ocorreu_em || diaSP(),
    autor_id,
  };
  if (!linha.titulo) throw new Error("O diário precisa de um título.");
  const { data, error } = await supabase.from("offer_actions").insert(linha).select().single();
  if (error) throw error;
  return data;
}

export async function apagarDoDiario(id) {
  if (!supabase) return;
  const { error } = await supabase.from("offer_actions").delete().eq("id", id);
  if (error) throw error;
}
