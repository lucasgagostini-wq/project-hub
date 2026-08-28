/**
 * meta-sync — traz o GASTO real do Meta pra dentro do placar de ofertas.
 *
 * Por que existe: o Hub sabia faturamento (espelho de vendas) mas não sabia
 * quanto custou. Sem gasto, "lucro" e "ROI" no Hub eram chute. O caminho
 * anterior (Adveronix → planilha → Sheets API) nunca foi ligado e depende de
 * uma planilha atualizada por terceiro; aqui o gasto vem da fonte.
 *
 * Como casa campanha → oferta: pelo NOME da campanha. A operação já nomeia
 * assim — `[REEPET] PIXEL {1265} — DOGS` , `bm2 — [REEAMOR] 2208-SOBETUDO`.
 * Cada projeto guarda o seu `meta_campaign_prefix` (ex.: `[REEPET]`) e o
 * `meta_account_id` (uma conta, ou várias separadas por vírgula). Campanha que
 * não casa com prefixo nenhum é reportada em `nao_casadas` — nunca somada no
 * escuro, senão o placar mente pra baixo sem ninguém perceber.
 *
 * Grava em metric_snapshots (source='meta'), que tem unique(project_id,date,source):
 * rodar de novo no mesmo dia corrige o número em vez de duplicar.
 *
 * Auth: header `x-sync-secret` (mesmo segredo do orders-sync) ou o
 * `Authorization: Bearer <CRON_SECRET>` que a Vercel manda no cron.
 *
 * Uso:
 *   POST /api/v1/meta-sync            → últimos 3 dias (janela de correção do Meta)
 *   POST /api/v1/meta-sync?dias=30    → últimos 30 dias
 *   POST /api/v1/meta-sync?since=2026-08-01&until=2026-08-28
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const META_TOKEN = process.env.META_ACCESS_TOKEN;
const META_VERSION = process.env.META_API_VERSION || "v23.0";
const SYNC_SECRET = process.env.ORDERS_SYNC_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

const MAX_DIAS = 92; // o Meta recusa janelas muito longas por chamada

function autorizado(req) {
  const h = req.headers || {};
  const secret = h["x-sync-secret"];
  const bearer = String(h.authorization || "").replace(/^Bearer\s+/i, "");
  if (SYNC_SECRET && secret && secret === SYNC_SECRET) return true;
  if (CRON_SECRET && bearer && bearer === CRON_SECRET) return true;
  return false;
}

/** YYYY-MM-DD no fuso de São Paulo — o dia do Meta e o do Lucas têm que ser o mesmo. */
function diaSP(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

function janela(query) {
  const since = /^\d{4}-\d{2}-\d{2}$/.test(query.since || "") ? query.since : null;
  const until = /^\d{4}-\d{2}-\d{2}$/.test(query.until || "") ? query.until : null;
  if (since && until) return { since, until };
  const dias = Math.min(Math.max(parseInt(query.dias, 10) || 3, 1), MAX_DIAS);
  const hoje = new Date();
  const ini = new Date(hoje.getTime() - (dias - 1) * 86400000);
  return { since: diaSP(ini), until: diaSP(hoje) };
}

/**
 * A campanha é desta oferta?
 *
 * A regra é a mesma que o funil já usa e tem teste próprio lá
 * (eterniza-app/api/_ofertas.js + test/gasto-por-oferta.test.js): prefixo no
 * nome da campanha, com exclusão explícita das ofertas vizinhas.
 *
 * O `meta_campaign_prefix` aceita uma lista separada por vírgula:
 *   "[REE, -[REEPET]"  → tudo que começa com [REE, MENOS o que é do Pet
 *   "[REEPET]"          → só o Pet
 *   "*"                 → o que sobrou desta conta (curinga, último recurso)
 *
 * A exclusão existe porque `[REE` casa `[REEAMOR]` E `[REEPET]` — sem ela o
 * Reencontro engole o gasto do Pet e as duas linhas do placar ficam erradas.
 */
function casa(nomeCampanha, prefixos) {
  const nome = String(nomeCampanha || "").toLowerCase();
  const partes = String(prefixos || "").split(",").map((p) => p.trim()).filter(Boolean);
  if (!partes.length) return null;

  for (const p of partes) {
    if (p.startsWith("-") && nome.includes(p.slice(1).toLowerCase())) return null; // excluída
  }
  for (const p of partes) {
    if (p === "*") continue;
    if (!p.startsWith("-") && nome.includes(p.toLowerCase())) return "prefixo";
  }
  return partes.includes("*") ? "curinga" : null;
}

const sb = (path, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

/** Insights por campanha e por dia. Pagina até o fim — conta com muitas campanhas trunca. */
async function insightsDaConta(accountId, { since, until }) {
  const base = `https://graph.facebook.com/${META_VERSION}/act_${accountId}/insights`;
  const params = new URLSearchParams({
    level: "campaign",
    fields: "campaign_name,campaign_id,spend,impressions,clicks",
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
    access_token: META_TOKEN,
  });
  let url = `${base}?${params}`;
  const linhas = [];
  for (let pagina = 0; pagina < 20 && url; pagina++) {
    const r = await fetch(url);
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.error) {
      const msg = j?.error?.message || `HTTP ${r.status}`;
      throw new Error(`meta_insights_falhou[act_${accountId}]: ${msg}`);
    }
    linhas.push(...(j.data || []));
    url = j.paging?.next || null;
  }
  return linhas;
}

module.exports = async (req, res) => {
  if (req.method !== "POST" && req.method !== "GET") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!autorizado(req)) return res.status(401).json({ error: "unauthorized" });
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "server_misconfigured" });
  if (!META_TOKEN) {
    return res.status(503).json({
      error: "meta_token_ausente",
      detail: "Setar META_ACCESS_TOKEN na Vercel (token de System User com ads_read).",
    });
  }

  const query = req.query || {};
  const { since, until } = janela(query);

  try {
    const pr = await sb(
      "projects?meta_account_id=not.is.null&select=id,name,slug,meta_account_id,meta_campaign_prefix"
    );
    if (!pr.ok) return res.status(502).json({ error: "supabase_projects_falhou" });
    const projetos = await pr.json();
    if (!projetos.length) {
      return res.status(200).json({ ok: true, aviso: "nenhum projeto com meta_account_id", since, until });
    }

    // Uma chamada por conta, não por projeto: várias ofertas dividem a mesma conta.
    const contas = new Set();
    for (const p of projetos) {
      for (const c of String(p.meta_account_id).split(",")) {
        const id = c.trim().replace(/^act_/, "");
        if (/^\d+$/.test(id)) contas.add(id);
      }
    }

    const porConta = new Map();
    const errosDeConta = [];
    for (const conta of contas) {
      try {
        porConta.set(conta, await insightsDaConta(conta, { since, until }));
      } catch (e) {
        errosDeConta.push(String(e.message || e));
      }
    }

    // Casa cada linha (campanha × dia) com a oferta dona do prefixo.
    const acc = new Map(); // `${project_id}|${date}` → agregado
    const naoCasadas = new Map(); // nome da campanha → gasto ignorado
    for (const [conta, linhas] of porConta) {
      const donos = projetos.filter((p) =>
        String(p.meta_account_id).split(",").some((c) => c.trim().replace(/^act_/, "") === conta)
      );
      for (const l of linhas) {
        const nome = String(l.campaign_name || "");
        // Casa primeiro por prefixo declarado; `*` (catch-all) só entra depois que
        // ninguém mais quis a campanha, senão a oferta curinga engoliria as outras.
        const alvo = donos.find((p) => casa(nome, p.meta_campaign_prefix) === "prefixo")
                  || donos.find((p) => casa(nome, p.meta_campaign_prefix) === "curinga");
        if (!alvo) {
          const g = Number(l.spend || 0);
          if (g > 0) naoCasadas.set(nome, (naoCasadas.get(nome) || 0) + g);
          continue;
        }
        const chave = `${alvo.id}|${l.date_start}`;
        const a = acc.get(chave) || { project_id: alvo.id, date: l.date_start, ad_spend: 0, impressions: 0, clicks: 0 };
        a.ad_spend += Number(l.spend || 0);
        a.impressions += Number(l.impressions || 0);
        a.clicks += Number(l.clicks || 0);
        acc.set(chave, a);
      }
    }

    const rows = [...acc.values()].map((a) => ({
      ...a,
      ad_spend: Math.round(a.ad_spend * 100) / 100,
      source: "meta",
    }));

    if (rows.length) {
      const up = await sb("metric_snapshots?on_conflict=project_id,date,source", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(rows),
      });
      if (!up.ok) {
        const detail = await up.text().catch(() => "");
        console.error("[meta-sync] upsert falhou:", up.status, detail.slice(0, 400));
        return res.status(502).json({ error: "supabase_upsert_falhou" });
      }
    }

    return res.status(200).json({
      ok: true,
      since,
      until,
      contas: [...contas],
      linhas_gravadas: rows.length,
      gasto_total: Math.round(rows.reduce((s, r) => s + r.ad_spend, 0) * 100) / 100,
      // Campanha sem dono é dinheiro que saiu e não aparece em oferta nenhuma.
      nao_casadas: [...naoCasadas.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([nome, gasto]) => ({ nome, gasto: Math.round(gasto * 100) / 100 })),
      erros: errosDeConta.length ? errosDeConta : undefined,
    });
  } catch (err) {
    console.error("[meta-sync] erro:", err);
    return res.status(500).json({ error: "internal_error", detail: String(err.message || err).slice(0, 300) });
  }
};

// Exportado para teste: a regra de casamento campanha → oferta é a parte que,
// se errar, manda o gasto pra oferta errada e inverte a decisão de cortar/escalar.
module.exports.casa = casa;
