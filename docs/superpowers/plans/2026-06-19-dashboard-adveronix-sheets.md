# Dashboard de marketing via Google Sheets (Adveronix) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada projeto aponta para uma planilha do Adveronix (FB Ads); o app lê a planilha (API Sheets + conta de serviço), grava gasto/impressões/cliques/conversões por dia no Supabase, recalcula gasto_ads/ROAS/Resultado, e mostra tudo numa seção Marketing — atualizando via cron diário + botão manual.

**Architecture:** Adveronix atualiza a planilha sozinho → função serverless na Vercel lê via Sheets API (JWT RS256 assinado na mão, sem libs) → upsert em `metric_snapshots` (source='meta') via Supabase REST com service role → recompute de `projects.gasto_ads` → o dashboard lê do Supabase (fonte de verdade). Receita continua da Cakto.

**Tech Stack:** Vercel Serverless (CommonJS, fetch global, `crypto` nativo p/ JWT), Supabase (Postgres REST + RPC), React+Vite (estilos inline, recharts lazy).

**Nota sobre testes:** o projeto não tem framework de testes. Adoto: scripts `node` standalone (na pasta scratch) para a lógica pura (parse de planilha, montagem do JWT); `node --check` nas funções serverless; `npm run build` + preview para o frontend; e aplicação da migration no Supabase para o schema. Cada task diz exatamente como verificar.

**Pré-requisito de runtime (handoff ao usuário, Task 9):** `GOOGLE_SERVICE_ACCOUNT_JSON` e `CRON_SECRET` nos envs da Vercel + planilha compartilhada com o e-mail da service account. Até lá, o código roda em estado "não configurado" gracioso.

---

## Estrutura de arquivos

- Criar: `supabase/migrations/20260619120000_ad_metrics.sql` — colunas + recompute de gasto_ads.
- Criar: `api/_lib/google-auth.js` — service account JSON → access token (JWT RS256).
- Criar: `api/_lib/sheets.js` — ler aba via Sheets API + parsear linhas por dia (mapa de colunas).
- Criar: `api/v1/sheets-sync.js` — endpoint POST (por projeto + cron de todos); upsert + recompute.
- Modificar: `vercel.json` — bloco `crons` (sync diário).
- Criar: `frontend/src/lib/api/sheets.js` — client `sincronizarSheets({ projectId })`.
- Modificar: `frontend/src/lib/api/projects.js` — `norm()` passa a expor métricas de ads dos snapshots.
- Modificar: `frontend/src/features/projects/ProjetoDetalhe.jsx` — provedor "sheets" em PROVEDORES (ConexoesTab) + botão "Sincronizar agora" + nova aba "Marketing".

---

## Task 1: Migration — colunas de ads + recompute de gasto_ads

**Files:**
- Create: `supabase/migrations/20260619120000_ad_metrics.sql`

- [ ] **Step 1: Escrever a migration**

```sql
-- ============================================================
-- Ad metrics (Adveronix → Sheets → app): estende metric_snapshots
-- e mantém projects.gasto_ads sincronizado com as linhas de gasto.
-- ============================================================

alter table metric_snapshots
  add column if not exists impressions integer not null default 0,
  add column if not exists clicks      integer not null default 0,
  add column if not exists conversions numeric not null default 0;

-- Recalcula projects.gasto_ads = soma do ad_spend de TODAS as linhas de ads do projeto
-- (lifetime, para casar com faturamento, que também é lifetime). Não toca em revenue/lucro
-- (esses continuam vindo do fluxo Cakto). Disparado quando uma linha de ads muda.
create or replace function recompute_ad_spend()
returns trigger language plpgsql as $$
declare v_project uuid := coalesce(new.project_id, old.project_id);
begin
  if v_project is null then return coalesce(new, old); end if;
  update projects set gasto_ads = coalesce(
    (select sum(ad_spend) from metric_snapshots
      where project_id = v_project and ad_spend > 0), 0)
  where id = v_project;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_snapshots_ad_spend on metric_snapshots;
create trigger trg_snapshots_ad_spend
  after insert or update or delete on metric_snapshots
  for each row execute procedure recompute_ad_spend();

notify pgrst, 'reload schema';
```

- [ ] **Step 2: Verificar (aplicar no Supabase)**

Aplicar via Supabase SQL editor (mesmo fluxo das migrations anteriores). Conferir:
```sql
select column_name from information_schema.columns
where table_name='metric_snapshots' and column_name in ('impressions','clicks','conversions');
```
Esperado: 3 linhas. Inserir uma linha de teste com `ad_spend=10` e conferir que `projects.gasto_ads` do projeto sobe; depois deletar a linha de teste.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260619120000_ad_metrics.sql
git commit -m "feat(db): ad metrics em metric_snapshots + recompute de gasto_ads"
```

---

## Task 2: Auth da conta de serviço (JWT RS256 → access token)

**Files:**
- Create: `api/_lib/google-auth.js`
- Test: `scratch/test-google-auth.mjs` (descartável; não commitar)

- [ ] **Step 1: Escrever o módulo**

```js
// api/_lib/google-auth.js
// Troca a service account (JSON em GOOGLE_SERVICE_ACCOUNT_JSON) por um access token OAuth2
// com escopo de leitura do Sheets. JWT RS256 assinado com `crypto` nativo (sem dependência
// pesada como googleapis). Cacheia o token em memória até ~1min antes de expirar.
const crypto = require("crypto");

let cached = { token: null, exp: 0 };

function b64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) { const e = new Error("SHEETS_NOT_CONFIGURED"); e.code = "SHEETS_NOT_CONFIGURED"; throw e; }
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.exp - 60 > now) return cached.token;

  let sa;
  try { sa = JSON.parse(raw); } catch { const e = new Error("BAD_SERVICE_ACCOUNT_JSON"); e.code = "SHEETS_NOT_CONFIGURED"; throw e; }

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key);
  const jwt = `${unsigned}.${b64url(signature)}`;

  let res;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
  } catch { throw new Error("GOOGLE_AUTH_NETWORK"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const e = new Error("GOOGLE_AUTH_FAILED");
    e.detail = JSON.stringify(data).slice(0, 200);
    throw e;
  }
  cached = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return cached.token;
}

module.exports = { getAccessToken, _b64url: b64url };
```

- [ ] **Step 2: Teste da montagem do JWT (lógica pura, sem rede)**

```js
// scratch/test-google-auth.mjs  (rodar com: node scratch/test-google-auth.mjs)
import crypto from "node:crypto";
const { generateKeyPairSync } = crypto;
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  client_email: "robot@test.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs1", format: "pem" }),
});
const { _b64url } = await import("../api/_lib/google-auth.js");
const seg = _b64url(JSON.stringify({ a: 1 }));
console.assert(!/[+/=]/.test(seg), "b64url não deve ter +/=");
console.log("OK: b64url limpo:", seg);
```

- [ ] **Step 3: Rodar o teste**

Run: `node scratch/test-google-auth.mjs`
Esperado: imprime "OK: b64url limpo: ..." sem AssertionError. (`require` de CJS dentro de `.mjs` via import dinâmico funciona no Node 18+.)

- [ ] **Step 4: node --check**

Run: `node --check api/_lib/google-auth.js`
Esperado: sem saída (válido).

- [ ] **Step 5: Commit**

```bash
git add api/_lib/google-auth.js
git commit -m "feat(api): auth da conta de serviço Google (JWT RS256 -> access token)"
```

---

## Task 3: Ler e parsear a planilha

**Files:**
- Create: `api/_lib/sheets.js`
- Test: `scratch/test-sheets-parse.mjs` (descartável)

- [ ] **Step 1: Escrever o módulo**

```js
// api/_lib/sheets.js
// Lê uma aba inteira via Sheets API e parseia as linhas em totais por dia, conforme o mapa
// de colunas (map = { date, spend, impressions, clicks, conversions } -> nomes de cabeçalho).
const { getAccessToken } = require("./google-auth.js");

async function fetchSheetValues(sheetId, tab) {
  const token = await getAccessToken();
  const range = encodeURIComponent(tab);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?majorDimension=ROWS`;
  let res;
  try { res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new Error("SHEETS_NETWORK"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error("SHEETS_READ_FAILED"); e.status = res.status;
    e.detail = (data.error && data.error.message ? data.error.message : "").slice(0, 200);
    throw e;
  }
  return data.values || [];
}

// Converte texto BR/US ("1.234,56" | "1,234.56" | "R$ 10") em número; inválido -> 0.
function num(v) {
  let s = String(v == null ? "" : v).replace(/[^\d.,-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// values: matriz da planilha. map: nomes de coluna. headerRow: linha do cabeçalho (1-based).
// Retorna { rows: [{date, ad_spend, impressions, clicks, conversions}], skipped, error }.
function parseRows(values, map, headerRow = 1) {
  if (!values || values.length < headerRow) return { rows: [], skipped: 0, error: "EMPTY" };
  const header = (values[headerRow - 1] || []).map((h) => String(h).trim());
  const col = {};
  for (const key of ["date", "spend", "impressions", "clicks", "conversions"]) {
    col[key] = map[key] ? header.indexOf(map[key]) : -1;
  }
  if (col.date < 0) return { rows: [], skipped: 0, error: "MISSING_DATE_COLUMN" };
  if (col.spend < 0) return { rows: [], skipped: 0, error: "MISSING_SPEND_COLUMN" };

  const byDay = {};
  let skipped = 0;
  for (let i = headerRow; i < values.length; i++) {
    const r = values[i];
    if (!r || r.length === 0) continue;
    const dRaw = String(r[col.date] == null ? "" : r[col.date]).trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dRaw);
    const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dRaw);
    let date = null;
    if (iso) date = `${iso[1]}-${iso[2]}-${iso[3]}`;
    else if (br) date = `${br[3]}-${br[2]}-${br[1]}`;
    if (!date) { skipped++; continue; }
    const cur = byDay[date] || { date, ad_spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    cur.ad_spend += num(r[col.spend]);
    if (col.impressions >= 0) cur.impressions += Math.round(num(r[col.impressions]));
    if (col.clicks >= 0) cur.clicks += Math.round(num(r[col.clicks]));
    if (col.conversions >= 0) cur.conversions += num(r[col.conversions]);
    byDay[date] = cur;
  }
  return { rows: Object.values(byDay), skipped, error: null };
}

module.exports = { fetchSheetValues, parseRows, _num: num };
```

- [ ] **Step 2: Teste do parse (lógica pura)**

```js
// scratch/test-sheets-parse.mjs  (node scratch/test-sheets-parse.mjs)
const { parseRows, _num } = await import("../api/_lib/sheets.js");
const values = [
  ["Date", "Spend", "Impressions", "Clicks", "Conversions"],
  ["2026-06-01", "R$ 100,50", "1.000", "20", "3"],
  ["2026-06-01", "49,50", "500", "10", "1"],      // mesmo dia -> soma
  ["01/06/2026", "10", "100", "2", "0"],           // formato BR, mesmo dia
  ["lixo", "5", "5", "5", "5"],                    // data inválida -> skipped
];
const map = { date: "Date", spend: "Spend", impressions: "Impressions", clicks: "Clicks", conversions: "Conversions" };
const out = parseRows(values, map, 1);
console.assert(out.error === null, "sem erro");
console.assert(out.rows.length === 1, "1 dia agregado, got " + out.rows.length);
console.assert(out.skipped === 1, "1 linha pulada, got " + out.skipped);
const d = out.rows[0];
console.assert(Math.round(d.ad_spend) === 160, "spend somado ~160, got " + d.ad_spend);
console.assert(d.impressions === 1600, "impr 1600, got " + d.impressions);
console.assert(_num("1.234,56") === 1234.56, "num BR");
console.assert(_num("1,234.56") === 1234.56, "num US");
console.log("OK parse:", JSON.stringify(d));
```

- [ ] **Step 3: Rodar o teste**

Run: `node scratch/test-sheets-parse.mjs`
Esperado: "OK parse: {...}" sem AssertionError.

- [ ] **Step 4: node --check + commit**

```bash
node --check api/_lib/sheets.js
git add api/_lib/sheets.js
git commit -m "feat(api): ler e parsear planilha do Adveronix (totais por dia)"
```

---

## Task 4: Endpoint de sincronização

**Files:**
- Create: `api/v1/sheets-sync.js`

Contrato:
- `POST /api/v1/sheets-sync` com `{ projectId }` → sincroniza 1 projeto (botão manual).
- `POST /api/v1/sheets-sync` com header `x-cron-secret: <CRON_SECRET>` e sem body → sincroniza TODOS os projetos com `conexoes.sheets.enabled` (cron).
- Sem `GOOGLE_SERVICE_ACCOUNT_JSON` → 501 `SHEETS_NOT_CONFIGURED` (gracioso).

- [ ] **Step 1: Escrever o endpoint**

```js
// api/v1/sheets-sync.js
// Sincroniza o gasto de anúncios (planilha do Adveronix) -> metric_snapshots (source='meta').
// Modo projeto: POST { projectId }. Modo cron: header x-cron-secret + sem projectId -> todos.
const { fetchSheetValues, parseRows } = require("../_lib/sheets.js");

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sb(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json", Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) { const e = new Error("SUPABASE_ERROR"); e.detail = JSON.stringify(data).slice(0, 200); throw e; }
  return data;
}

// Extrai o id de uma URL de planilha ou aceita o id puro.
function sheetIdFrom(s) {
  const m = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(String(s || ""));
  return m ? m[1] : String(s || "").trim();
}

async function syncProject(proj) {
  const cfg = (proj.conexoes && proj.conexoes.sheets) || null;
  if (!cfg || !cfg.enabled || !cfg.sheetId) return { projectId: proj.id, skipped: true };

  const status = { lastSyncAt: new Date().toISOString(), lastStatus: "ok", lastError: null, rowsImported: 0 };
  try {
    const values = await fetchSheetValues(sheetIdFrom(cfg.sheetId), cfg.tab || "Sheet1");
    const map = cfg.map || { date: "Date", spend: "Spend", impressions: "Impressions", clicks: "Clicks", conversions: "Conversions" };
    const { rows, skipped, error } = parseRows(values, map, cfg.headerRow || 1);
    if (error) throw Object.assign(new Error(error), { detail: error });

    // upsert por (project_id, date, source) — uma chamada com todas as linhas.
    if (rows.length) {
      const payload = rows.map((r) => ({
        project_id: proj.id, date: r.date, source: "meta",
        ad_spend: r.ad_spend, impressions: r.impressions, clicks: r.clicks, conversions: r.conversions,
        revenue: 0, net_profit: 0,
      }));
      await sb("metric_snapshots?on_conflict=project_id,date,source", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(payload),
      });
    }
    status.rowsImported = rows.length;
    status.skipped = skipped;
  } catch (e) {
    status.lastStatus = "erro";
    status.lastError = (e.code || e.message || "erro") + (e.detail ? `: ${e.detail}` : "");
  }

  // grava o status de volta na conexão do projeto (config não-secreta)
  const novasConexoes = { ...(proj.conexoes || {}), sheets: { ...cfg, ...status } };
  await sb(`projects?id=eq.${proj.id}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ conexoes: novasConexoes }),
  });
  return { projectId: proj.id, ...status };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method_not_allowed" }); }
  if (!SB_URL || !SB_KEY) return res.status(501).json({ error: "STORAGE_NOT_CONFIGURED" });
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return res.status(501).json({ error: "SHEETS_NOT_CONFIGURED", detail: "Falta GOOGLE_SERVICE_ACCOUNT_JSON no servidor." });

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const projectId = body && body.projectId;

  // Modo cron: sincroniza todos os projetos conectados.
  if (!projectId) {
    const secret = req.headers["x-cron-secret"];
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
    const projetos = await sb("projects?select=id,conexoes&active=eq.true");
    const alvo = (projetos || []).filter((p) => p.conexoes && p.conexoes.sheets && p.conexoes.sheets.enabled);
    const results = await Promise.allSettled(alvo.map((p) => syncProject(p)));
    return res.status(200).json({ ok: true, total: alvo.length, results: results.map((r) => r.status === "fulfilled" ? r.value : { error: String(r.reason) }) });
  }

  // Modo projeto (botão manual).
  const rows = await sb(`projects?id=eq.${projectId}&select=id,conexoes`);
  const proj = rows && rows[0];
  if (!proj) return res.status(404).json({ error: "project_not_found" });
  const out = await syncProject(proj);
  if (out.lastStatus === "erro") return res.status(502).json({ error: "SYNC_FAILED", detail: out.lastError, ...out });
  return res.status(200).json({ ok: true, ...out });
};
```

- [ ] **Step 2: node --check**

Run: `node --check api/v1/sheets-sync.js`
Esperado: sem saída.

- [ ] **Step 3: Commit**

```bash
git add api/v1/sheets-sync.js
git commit -m "feat(api): endpoint sheets-sync (projeto + cron) -> metric_snapshots"
```

---

## Task 5: Cron diário no vercel.json

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Adicionar o bloco `crons`**

Conteúdo final do `vercel.json`:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "echo 'deps handled in buildCommand'",
  "functions": {
    "api/**/*.js": { "maxDuration": 60 }
  },
  "crons": [
    { "path": "/api/v1/sheets-sync", "schedule": "0 8 * * *" }
  ]
}
```
Nota: o Vercel Cron faz GET por padrão; nosso handler exige POST. Solução: aceitar também GET com o header de cron. Ajustar o guard de método no `sheets-sync.js` (Step 2).

- [ ] **Step 2: Permitir GET do cron no handler**

Em `api/v1/sheets-sync.js`, trocar o guard inicial:
```js
  // Vercel Cron dispara GET; o app dispara POST. Aceitamos os dois.
  if (req.method !== "POST" && req.method !== "GET") { res.setHeader("Allow", "POST, GET"); return res.status(405).json({ error: "method_not_allowed" }); }
```
E o Vercel injeta o secret do cron no header `Authorization: Bearer <CRON_SECRET>` automaticamente quando há `CRON_SECRET` no env — então, no modo cron, aceitar OU `x-cron-secret` OU `authorization === 'Bearer ' + CRON_SECRET`:
```js
    const secret = req.headers["x-cron-secret"];
    const authOk = req.headers["authorization"] === `Bearer ${process.env.CRON_SECRET}`;
    if (!process.env.CRON_SECRET || (secret !== process.env.CRON_SECRET && !authOk)) return res.status(401).json({ error: "unauthorized" });
```

- [ ] **Step 3: node --check + commit**

```bash
node --check api/v1/sheets-sync.js
git add vercel.json api/v1/sheets-sync.js
git commit -m "feat: cron diário do sheets-sync (vercel.json) + aceitar GET do cron"
```

---

## Task 6: Client de sync no frontend

**Files:**
- Create: `frontend/src/lib/api/sheets.js`

- [ ] **Step 1: Escrever o client (espelha o postJson de clone.js)**

```js
// frontend/src/lib/api/sheets.js
// Dispara a sincronização da planilha do Adveronix para 1 projeto. O servidor lê a planilha,
// grava em metric_snapshots e devolve o status (linhas importadas / erro).
const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:4000" : "");

export async function sincronizarSheets({ projectId }) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/v1/sheets-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor de sincronização.");
  }
  if (!res.ok) {
    let detalhe = "";
    try { detalhe = (await res.json()).detail || ""; } catch { detalhe = ""; }
    throw new Error(detalhe || `Sincronização falhou (${res.status})`);
  }
  return res.json();
}
```

- [ ] **Step 2: Verificar build + commit**

```bash
cd frontend && npm run build && cd ..
git add frontend/src/lib/api/sheets.js
git commit -m "feat(front): client sincronizarSheets"
```
Esperado: build sem erros.

---

## Task 7: `norm()` expõe métricas de ads dos snapshots

**Files:**
- Modify: `frontend/src/lib/api/projects.js` (função `norm`, ~linhas 7-56)

- [ ] **Step 1: Acrescentar o agregado de ads ao objeto do projeto**

No `norm(row)`, logo após a construção de `timeline`, adicionar (e incluir `adTimeline` + `adTotais` no objeto retornado):
```js
  // Série de ads (source='meta') por dia, p/ o dashboard de Marketing.
  const adSnaps = [...(row.metric_snapshots ?? [])]
    .filter((s) => Number(s.ad_spend) > 0 || Number(s.impressions) > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
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
```
E no `return { ... }` do `norm`, adicionar:
```js
    adTimeline,
    adTotais,
```
Também garantir que o `PROJECT_SELECT` traga as novas colunas — trocar a linha de `metric_snapshots(...)` para:
```js
  metric_snapshots(id, date, revenue, net_profit, ad_spend, impressions, clicks, conversions, source)
```

- [ ] **Step 2: Build + commit**

```bash
cd frontend && npm run build && cd ..
git add frontend/src/lib/api/projects.js
git commit -m "feat(front): norm expõe adTimeline/adTotais dos snapshots"
```

---

## Task 8: Provedor "Google Sheets" + botão Sincronizar + aba Marketing

**Files:**
- Modify: `frontend/src/features/projects/ProjetoDetalhe.jsx`

- [ ] **Step 1: Importar o client e o ícone**

No topo, adicionar ao import de `../../lib/icons` os ícones `IconChartBar as ChartBar` (já existe) e `IconRefresh as Refresh` (já existe); adicionar import:
```js
import { sincronizarSheets } from "../../lib/api/sheets";
```

- [ ] **Step 2: Adicionar o provedor "sheets" em PROVEDORES**

No array `PROVEDORES` (após o objeto `utmfy`), acrescentar:
```js
  {
    key: "sheets",
    nome: "Google Sheets (Adveronix)",
    tipo: "Dados de anúncios",
    desc: "Lê uma planilha do Adveronix (FB Ads) e atualiza gasto, ROAS e o dashboard de Marketing.",
    icon: ChartBar,
    cor: "#188038",
    site: "https://www.adveronix.com",
    obrigatorios: [],
    campos: [
      { k: "sheetId", label: "URL (ou ID) da planilha", placeholder: "https://docs.google.com/spreadsheets/d/...",
        hint: "Compartilhe a planilha (como Leitor) com o e-mail da conta de serviço antes de sincronizar." },
      { k: "tab", label: "Aba", placeholder: "ex.: Sheet1 / Página1" },
      { k: "colDate", label: "Coluna de data", placeholder: "ex.: Date" },
      { k: "colSpend", label: "Coluna de gasto", placeholder: "ex.: Spend" },
      { k: "colImpr", label: "Coluna de impressões (opcional)", placeholder: "ex.: Impressions" },
      { k: "colClicks", label: "Coluna de cliques (opcional)", placeholder: "ex.: Clicks" },
      { k: "colConv", label: "Coluna de conversões (opcional)", placeholder: "ex.: Conversions" },
    ],
    notaServidor: "A chave da conta de serviço (GOOGLE_SERVICE_ACCOUNT_JSON) fica só no servidor. A planilha continua privada — só o e-mail do robô tem leitura.",
  },
```
Nota de modelagem: a UI coleta `colDate/colSpend/...`; ao salvar a conexão (no `ConexoesTab`/`onConectar`), montar o objeto `sheets` no formato que o backend espera:
```js
// dentro do onConectar do IntegracaoCard, quando prov.key === "sheets":
const map = { date: draft.colDate || "Date", spend: draft.colSpend || "Spend",
  impressions: draft.colImpr || "Impressions", clicks: draft.colClicks || "Clicks", conversions: draft.colConv || "Conversions" };
const sheetsCfg = { enabled: true, sheetId: draft.sheetId || "", tab: draft.tab || "Sheet1", headerRow: 1, currency: "BRL", map };
onConectar({ ...draft, _sheets: sheetsCfg }); // ConexoesTab grava conexoes.sheets = sheetsCfg
```
No `ConexoesTab` (`onSalvar`/`onEditarConexoes`), ao persistir, gravar `conexoes.sheets = valores._sheets || conexoes.sheets`. (Manter os campos `col*` também é ok; o backend só lê `sheets.map`.)

- [ ] **Step 3: Botão "Sincronizar agora" no card do provedor sheets**

Dentro do `IntegracaoCard`, quando `prov.key === "sheets"` e a conexão está ligada, renderizar um botão que chama o sync e mostra o resultado:
```jsx
{prov.key === "sheets" && valores && valores.enabled && (
  <div style={{ marginTop: 12 }}>
    <button onClick={async () => {
      setSyncing(true); setSyncMsg(null);
      try { const r = await sincronizarSheets({ projectId }); setSyncMsg({ ok: true, txt: `Sincronizado: ${r.rowsImported || 0} dia(s).` }); onSynced && onSynced(); }
      catch (e) { setSyncMsg({ ok: false, txt: e.message }); }
      finally { setSyncing(false); }
    }} disabled={syncing}
      style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12.5, fontWeight: 600, cursor: syncing ? "wait" : "pointer" }}>
      <Refresh size={14} /> {syncing ? "Sincronizando…" : "Sincronizar agora"}
    </button>
    {valores.lastSyncAt && <div style={{ fontSize: 11.5, color: T.faint, marginTop: 6 }}>Última sincronização: {new Date(valores.lastSyncAt).toLocaleString("pt-BR")} · {valores.lastStatus === "erro" ? `erro: ${valores.lastError}` : "ok"}</div>}
    {syncMsg && <div style={{ fontSize: 12, marginTop: 6, color: syncMsg.ok ? T.pos : T.neg }}>{syncMsg.txt}</div>}
  </div>
)}
```
Declarar no topo do `IntegracaoCard`: `const [syncing, setSyncing] = useState(false); const [syncMsg, setSyncMsg] = useState(null);` e receber as props novas `projectId` e `onSynced` (passar `projeto.id` e um callback que recarrega o projeto, vindo do `ConexoesTab`).

- [ ] **Step 4: Nova aba "Marketing" com KPIs + gráfico gasto×receita**

No array de abas (linha ~1115-1130), adicionar `{ id: "marketing", label: "Marketing" }` após "anuncios". No render (linha ~1144), adicionar:
```jsx
{aba === "marketing" && <MarketingTab projeto={projeto} onSynced={onSynced} />}
```
E criar o componente `MarketingTab` (perto de `AnunciosTab`):
```jsx
function MarketingTab({ projeto }) {
  const tot = projeto.adTotais || { gasto: 0, impressoes: 0, cliques: 0, conversoes: 0 };
  const fat = projeto.faturamento || 0;
  const roas = tot.gasto > 0 ? fat / tot.gasto : null;
  const resultado = fat - tot.gasto;
  const ctr = tot.impressoes > 0 ? (tot.cliques / tot.impressoes) * 100 : null;
  const cpc = tot.cliques > 0 ? tot.gasto / tot.cliques : null;
  const temDados = (projeto.adTimeline || []).length > 0;

  // junta gasto (adTimeline) e receita (timeline) por dia p/ o gráfico
  const porDia = {};
  (projeto.timeline || []).forEach((d) => { porDia[d.dia] = { dia: d.dia, receita: d.faturamento || 0, gasto: 0 }; });
  (projeto.adTimeline || []).forEach((d) => { porDia[d.dia] = { ...(porDia[d.dia] || { dia: d.dia, receita: 0 }), gasto: d.gasto }; });
  const serie = Object.values(porDia);

  if (!temDados) {
    return (
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <Eyebrow>Marketing</Eyebrow>
        <div style={{ textAlign: "center", padding: "26px 0", color: T.faint, fontSize: 13 }}>
          Conecte uma planilha do Adveronix na aba <b>Conexões</b> e clique em “Sincronizar agora”.
        </div>
      </section>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <Eyebrow>Resumo de marketing</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <MiniStat label="Gasto" value={fmtBRL(tot.gasto)} />
          <MiniStat label="ROAS" value={roas == null ? "—" : roas.toFixed(2) + "x"} />
          <MiniStat label="Resultado" value={fmtBRL(resultado)} sub="faturamento − gasto" />
          <MiniStat label="CTR" value={ctr == null ? "—" : ctr.toFixed(1) + "%"} />
          <MiniStat label="CPC" value={cpc == null ? "—" : fmtBRLc(cpc)} />
          <MiniStat label="Conversões" value={tot.conversoes} />
        </div>
      </section>
      <section style={{ ...glassStyle(), borderRadius: 16, padding: 22 }}>
        <Eyebrow>Gasto × receita por dia</Eyebrow>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.hair} />
              <XAxis dataKey="dia" tick={{ fontSize: 11, fill: T.faint }} />
              <YAxis tick={{ fontSize: 11, fill: T.faint }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: fontBody, background: T.surface, color: T.ink }} />
              <Area type="monotone" dataKey="receita" stroke={T.pos} fill={T.posBg} strokeWidth={2} />
              <Area type="monotone" dataKey="gasto" stroke={T.neg} fill={T.negBg} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
```
`MiniStat`, `glassStyle`, `Eyebrow`, `fmtBRL`, `fmtBRLc`, e os componentes do recharts já estão importados neste arquivo.

- [ ] **Step 5: Recarregar o projeto após sync (App.jsx)**

`onSynced` deve recarregar os dados (o sync escreveu no Supabase). Encaminhar do `ProjetoDetalhe` (prop nova `onSynced`) até o App, onde `onSynced={() => carregarDados()}` (em modo real). Em mock, no-op. Passar `onSynced` para `ConexoesTab` → `IntegracaoCard` e para `MarketingTab`.

- [ ] **Step 6: Build + verificação no preview**

```bash
cd frontend && npm run build && cd ..
```
Esperado: build sem erros. No preview (mock): abrir um projeto → aba "Marketing" mostra o estado vazio; aba "Conexões" mostra o card "Google Sheets (Adveronix)" com os campos e o botão. (O fluxo real depende dos envs — Task 9.)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/projects/ProjetoDetalhe.jsx
git commit -m "feat(front): conexão Google Sheets + botão sincronizar + aba Marketing"
```

---

## Task 9: Handoff de setup (Google Cloud) + envs

**Files:**
- Modify: `docs/ARQUITETURA.md` (seção nova "Integração Adveronix/Sheets") OU criar `docs/SETUP-ADVERONIX.md`

- [ ] **Step 1: Escrever o checklist de setup**

Criar `docs/SETUP-ADVERONIX.md` com:
```markdown
# Setup — Dashboard de marketing (Adveronix → Sheets)

## No Google Cloud (uma vez)
1. Crie/escolha um projeto em console.cloud.google.com.
2. Ative a **Google Sheets API** (APIs & Services → Library).
3. Crie uma **Service Account** (IAM & Admin → Service Accounts) e gere uma **chave JSON**.
4. Copie o e-mail da service account (algo como `robo@projeto.iam.gserviceaccount.com`).

## Na Vercel (envs do projeto)
- `GOOGLE_SERVICE_ACCOUNT_JSON` = conteúdo inteiro do JSON da chave (uma linha).
- `CRON_SECRET` = uma string aleatória longa.

## Em cada planilha do Adveronix
- No Adveronix, configure o relatório de FB Ads com colunas: Date, Spend, Impressions, Clicks, Conversions (uma linha por dia) e ative o **Schedule** (atualização automática).
- Compartilhe a planilha (botão Compartilhar) com o **e-mail da service account** como **Leitor**.

## No app
- Projeto → aba **Conexões** → card **Google Sheets (Adveronix)**: cole a URL da planilha, a aba e os nomes das colunas → salve → **Sincronizar agora**.
- O cron diário (08:00) sincroniza todos os projetos conectados automaticamente.
```

- [ ] **Step 2: Commit**

```bash
git add docs/SETUP-ADVERONIX.md
git commit -m "docs: checklist de setup do Adveronix/Sheets (Google Cloud + envs)"
```

---

## Self-review (cobertura do spec)

- Leitura via Sheets API + service account → Tasks 2, 3. ✓
- Métricas (gasto/impr/cliques/conv → CTR/CPC/CPM/ROAS) → Tasks 1, 7, 8. ✓
- Cron diário + botão manual → Tasks 4, 5, 8. ✓
- Uma planilha por projeto + mapa de colunas → Tasks 4, 8. ✓
- Resultado = faturamento − gasto; ROAS; comissão Cakto à parte → Task 8 (MarketingTab). ✓
- source='meta'; recompute gasto_ads → Tasks 1, 4. ✓
- Estado "não configurado" gracioso → Task 4 (501 SHEETS_NOT_CONFIGURED). ✓
- Segurança (segredos no servidor; planilha privada) → Tasks 2, 9. ✓
- Tratamento de erros (coluna faltando, planilha não compartilhada, status no card) → Tasks 3, 4, 8. ✓
- Receita continua Cakto (snapshots de ads gravam revenue=0) → Task 4. ✓
- Fase 2 (campanha) — fora do escopo, documentado no spec. ✓

## Notas
- Os scripts em `scratch/` são descartáveis (gitignore já cobre? se não, não commitar).
- O `recompute_ad_spend` soma `ad_spend` de todas as linhas (lifetime) p/ casar com `faturamento` lifetime.
- Em produção, o cron do Vercel dispara GET com `Authorization: Bearer <CRON_SECRET>` — tratado na Task 5.
