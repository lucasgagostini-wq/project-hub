import { supabase, isMockMode } from "../supabase";

// Vendas individuais do projeto (tabela `sales`, alimentada pelo webhook Cakto
// e pelo espelho de pedidos /api/v1/orders-sync). Base da aba Vendas · UTM.
const SALES_SELECT =
  "id,gateway,transaction_id,status,amount,net_amount,payment_method," +
  "product_name,utm_source,utm_medium,utm_campaign,utm_content,utm_term,src," +
  "paid_at,ordered_at,created_at";

export async function listSales(projectId, { limit = 5000 } = {}) {
  if (isMockMode) return [];
  const { data, error } = await supabase
    .from("sales")
    .select(SALES_SELECT)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
