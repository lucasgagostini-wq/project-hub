import { supabase, isMockMode } from "../supabase";
import { MOCK_PROJETOS } from "./mockData";

let mockProjetos = [...MOCK_PROJETOS];

// ── Shape normalizer (Supabase row → UI shape) ───────────────
function norm(row) {
  const offer    = Array.isArray(row.offers)    ? row.offers[0]    : (row.offers    ?? {});
  const persona  = Array.isArray(row.personas)  ? row.personas[0]  : (row.personas  ?? null);
  const links    = row.offer_links    ?? [];
  const criativos = row.creatives     ?? [];
  // Copia antes de ordenar (não muta o array devolvido pelo Supabase) e ordena de forma
  // estável por data. slice(0,10) abaixo tolera tanto "YYYY-MM-DD" quanto timestamp completo.
  const snaps    = [...(row.metric_snapshots ?? [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  // Build timeline with delta
  const timeline = snaps.map((s, i) => ({
    dia: new Date(String(s.date).slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    faturamento: s.revenue,
    delta: i === 0 ? 0 : s.revenue - snaps[i - 1].revenue,
  }));

  // Série de ads (gasto/impressões/cliques/conversões) por dia — para a aba Marketing.
  const adSnaps = snaps.filter((s) => Number(s.ad_spend) > 0 || Number(s.impressions) > 0);
  const adTimeline = adSnaps.map((s) => ({
    dia: new Date(String(s.date).slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    date: String(s.date).slice(0, 10),
    gasto: Number(s.ad_spend) || 0,
    impressoes: Number(s.impressions) || 0,
    cliques: Number(s.clicks) || 0,
    conversoes: Number(s.conversions) || 0,
  }));
  const adTotais = adTimeline.reduce((t, d) => ({
    gasto: t.gasto + d.gasto, impressoes: t.impressoes + d.impressoes,
    cliques: t.cliques + d.cliques, conversoes: t.conversoes + d.conversoes,
  }), { gasto: 0, impressoes: 0, cliques: 0, conversoes: 0 });

  return {
    id:           row.id,
    nome:         row.name,
    nicho:        row.niche,
    veiculo:      row.vehicle,
    ativo:        row.active,
    escala:       row.escala       ?? 0,
    faturamento:  row.faturamento  ?? 0,
    lucro:        row.lucro        ?? 0,
    gastoAds:     row.gasto_ads    ?? 0,
    tempoOnline:  row.tempo_online ?? 0,
    estruturas:   row.estruturas   ?? {},
    conexoes:     row.conexoes     ?? {},
    tynk:         row.tynk         ?? null,
    ideias:       row.ideias       ?? [],
    // Offer fields
    oferta:       offer?.description ?? "",
    publico:      offer?.publico      ?? "",
    idade:        offer?.idade_range  ?? "",
    preco:        offer?.preco        ?? "",
    garantia:     offer?.garantia     ?? "",
    gateway:      offer?.gateway      ?? "",
    // Persona
    persona: persona ? {
      nome:     persona.name,
      dor:      persona.pain,
      desejo:   persona.desire,
      objecao:  persona.objection,
      canal:    persona.channel,
    } : null,
    links:      links.map((l) => ({ tipo: l.tipo, url: l.url })),
    criativos:  criativos.map((c) => ({ nome: c.nome, vendas: c.vendas, gasto: c.gasto, roas: c.roas })),
    timeline,
    adTimeline,
    adTotais,
    created_at: row.created_at,
  };
}

// Campos de oferta que vivem na tabela offers (não em projects)
const OFFER_FIELDS = new Set(["oferta", "publico", "idade", "preco", "garantia", "gateway"]);

const PROJECT_SELECT = `
  *,
  offers(*),
  personas(*),
  offer_links(*),
  creatives(*),
  metric_snapshots(id, date, revenue, net_profit, ad_spend, source)
`.trim();

// ── Queries ──────────────────────────────────────────────────

export async function listProjects() {
  if (isMockMode) return mockProjetos;
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(norm);
}

export async function getProject(id) {
  if (isMockMode) return mockProjetos.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return norm(data);
}

export async function createProject(payload) {
  if (isMockMode) {
    const p = { ativo: true, escala: 0, criativos: [], links: [], timeline: [], estruturas: {}, ...payload };
    mockProjetos = [p, ...mockProjetos];
    return p;
  }

  // 1. Insert project row
  const { data: proj, error: pe } = await supabase
    .from("projects")
    .insert({
      name:         payload.nome,
      niche:        payload.nicho,
      vehicle:      payload.veiculo,
      escala:       payload.escala        ?? 0,
      faturamento:  payload.faturamento   ?? 0,
      lucro:        payload.lucro         ?? 0,
      gasto_ads:    payload.gastoAds      ?? 0,
      tempo_online: payload.tempoOnline   ?? 0,
      estruturas:   payload.estruturas    ?? {},
      conexoes:     payload.conexoes      ?? {},
      tynk:         payload.tynk          ?? null,
      ideias:       payload.ideias        ?? [],
    })
    .select("id")
    .single();
  if (pe) throw pe;

  const projectId = proj.id;

  // 2. Insert offer row
  const { error: oe } = await supabase.from("offers").insert({
    project_id:  projectId,
    description: payload.oferta    ?? payload.description ?? "",
    publico:     payload.publico   ?? "",
    idade_range: payload.idade     ?? "",
    preco:       payload.preco     ?? "",
    garantia:    payload.garantia  ?? "",
    gateway:     payload.gateway   ?? "",
  });
  if (oe) throw oe;

  // 3. Insert persona (optional)
  if (payload.persona) {
    await supabase.from("personas").insert({
      project_id: projectId,
      name:       payload.persona.nome,
      pain:       payload.persona.dor,
      desire:     payload.persona.desejo,
      objection:  payload.persona.objecao,
      channel:    payload.persona.canal ?? "",
    });
  }

  // 4. Insert offer links
  const links = (payload.links ?? []).filter((l) => l.url?.trim());
  if (links.length) {
    await supabase.from("offer_links").insert(
      links.map((l) => ({ project_id: projectId, tipo: l.tipo, url: l.url }))
    );
  }

  return getProject(projectId);
}

export async function updateProject(id, patch) {
  if (isMockMode) {
    mockProjetos = mockProjetos.map((p) => (p.id === id ? { ...p, ...patch } : p));
    return mockProjetos.find((p) => p.id === id);
  }

  // Separate project fields from offer fields
  const projectPatch = {};
  const offerPatch   = {};

  for (const [k, v] of Object.entries(patch)) {
    if (OFFER_FIELDS.has(k)) {
      const offerKey = k === "oferta" ? "description" : k === "idade" ? "idade_range" : k;
      offerPatch[offerKey] = v;
    } else {
      // map camelCase → snake_case
      const dbKey = k === "gastoAds" ? "gasto_ads"
                  : k === "tempoOnline" ? "tempo_online"
                  : k === "nome" ? "name"
                  : k === "nicho" ? "niche"
                  : k === "veiculo" ? "vehicle"
                  : k === "ativo" ? "active"
                  : k;
      projectPatch[dbKey] = v;
    }
  }

  if (Object.keys(projectPatch).length) {
    const { error } = await supabase.from("projects").update(projectPatch).eq("id", id);
    if (error) throw error;
  }

  if (Object.keys(offerPatch).length) {
    const { error } = await supabase
      .from("offers")
      .upsert({ project_id: id, ...offerPatch }, { onConflict: "project_id" });
    if (error) throw error;
  }

  return getProject(id);
}

export async function archiveProject(id) {
  if (isMockMode) {
    mockProjetos = mockProjetos.map((p) => (p.id === id ? { ...p, ativo: false } : p));
    return;
  }
  const { error } = await supabase.from("projects").update({ active: false }).eq("id", id);
  if (error) throw error;
}

// ── Oferta ───────────────────────────────────────────────────

export async function upsertOffer(projectId, patch) {
  if (isMockMode) {
    mockProjetos = mockProjetos.map((p) => (p.id === projectId ? { ...p, ...patch } : p));
    return mockProjetos.find((p) => p.id === projectId);
  }
  const mapped = {
    project_id:  projectId,
    description: patch.oferta    ?? patch.description,
    publico:     patch.publico,
    idade_range: patch.idade     ?? patch.idade_range,
    preco:       patch.preco,
    garantia:    patch.garantia,
    gateway:     patch.gateway,
  };
  // Remove undefined keys
  Object.keys(mapped).forEach((k) => mapped[k] === undefined && delete mapped[k]);

  const { data, error } = await supabase
    .from("offers")
    .upsert(mapped, { onConflict: "project_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Conexões / integrações (Cakto, UTMFy) ───────────────────
// Guardado no campo jsonb `conexoes` do projeto. Em produção, requer uma
// coluna `conexoes jsonb` na tabela projects (segue o mesmo molde de `estruturas`).
//
// SEGURANÇA: segredos (client_secret, webhook secret, tokens, api keys) NUNCA vão
// para o banco nem para o navegador — eles vivem só em variáveis de ambiente no
// servidor. `semSegredos` remove qualquer chave sensível antes de gravar, como
// salvaguarda mesmo que a UI volte a coletar um segredo por engano.
const RE_CHAVE_SECRETA = /(secret|token|password|senha|api[_-]?key|access[_-]?key|private[_-]?key|credential)/i;

function semSegredos(valor) {
  if (Array.isArray(valor)) return valor.map(semSegredos);
  if (valor && typeof valor === "object") {
    const limpo = {};
    for (const [k, v] of Object.entries(valor)) {
      if (RE_CHAVE_SECRETA.test(k)) continue; // descarta a chave sensível
      limpo[k] = semSegredos(v);
    }
    return limpo;
  }
  return valor;
}

export async function upsertConexoes(projectId, conexoes) {
  const limpo = semSegredos(conexoes);
  if (isMockMode) {
    mockProjetos = mockProjetos.map((p) =>
      p.id === projectId ? { ...p, conexoes: limpo } : p
    );
    return mockProjetos.find((p) => p.id === projectId)?.conexoes;
  }
  const { error } = await supabase
    .from("projects")
    .update({ conexoes: limpo })
    .eq("id", projectId);
  if (error) throw error;
  return limpo;
}

// ── Persona ──────────────────────────────────────────────────

export async function upsertPersona(projectId, patch) {
  if (isMockMode) {
    mockProjetos = mockProjetos.map((p) =>
      p.id === projectId ? { ...p, persona: { ...(p.persona ?? {}), ...patch } } : p
    );
    return mockProjetos.find((p) => p.id === projectId)?.persona;
  }
  const mapped = {
    project_id: projectId,
    name:       patch.nome      ?? patch.name,
    pain:       patch.dor       ?? patch.pain,
    desire:     patch.desejo    ?? patch.desire,
    objection:  patch.objecao   ?? patch.objection,
    channel:    patch.canal     ?? patch.channel,
  };
  Object.keys(mapped).forEach((k) => mapped[k] === undefined && delete mapped[k]);

  const { data, error } = await supabase
    .from("personas")
    .upsert(mapped, { onConflict: "project_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Criativos ────────────────────────────────────────────────

export async function listCreatives(projectId) {
  if (isMockMode) return mockProjetos.find((p) => p.id === projectId)?.criativos ?? [];
  const { data, error } = await supabase
    .from("creatives")
    .select("*")
    .eq("project_id", projectId)
    .order("vendas", { ascending: false });
  if (error) throw error;
  return data;
}
