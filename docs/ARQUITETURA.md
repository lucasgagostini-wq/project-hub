# Arquitetura — Project Hub

Visão de como o app realmente funciona hoje. Complementa o `README.md` (que cobre setup
e deploy). Útil para humanos e para IAs que forem mexer no código.

> Nota: o `backend/` (Express + Prisma) é um esqueleto paralelo/legado com endpoints stub.
> **O app em produção NÃO depende dele** — usa Supabase direto + funções serverless em `api/`.
> Ver "Backend Express" no fim e o follow-up no plano de refatoração.

## Visão geral

```
Navegador (React + Vite, PWA)
   │
   ├── lê/escreve dados ───────────────► Supabase (Postgres + Storage + RLS aberto p/ anon)
   │
   └── ações que exigem segredos ──────► Funções serverless (api/*, Vercel)
                                            ├─ /api/v1/clone     (Tynk + extração IA)
                                            ├─ /api/v1/snapshot  (captura HTML + Storage)
                                            ├─ /api/v1/preview   (serve o snapshot como HTML)
                                            └─ /api/cakto-webhook (ingest de vendas)
```

Regra de ouro: **segredos (service role, Tynk key, OpenRouter, webhook secret) vivem só no
servidor** (env vars sem prefixo `VITE_`). O frontend só usa a `anon key` pública.

## Frontend (`frontend/src`)

- `main.jsx` — monta o app dentro de `<ErrorBoundary>`; registra o service worker (PWA).
- `App.jsx` — estado global (auth/ator, navegação, dados), orquestra tudo. `ProjetoDetalhe`
  e `NovoProjeto` são **lazy** (code-splitting; tiram o recharts do bundle inicial).
- `features/` — uma pasta por área: `home`, `projects`, `calendar`, `meetings`, `tasks`,
  `ideas`, `profile`, `auth`, `layout`.
- `components/index.jsx` — primitivos compartilhados (Avatar, Kpi, Delta, PageHeader, …) +
  `ErrorBoundary.jsx`.
- `lib/`
  - `api/` — **camada de dados** (ver abaixo). Um módulo por recurso.
  - `supabase.js` — client + `isMockMode`.
  - `theme.js` — paleta clara/escura (`T` mutável) + `buildGlobalStyle()`.
  - `image.js` — `resizeImageToDataURL` (avatar/capa).
  - `hooks/` — `useIsMobile`, `useDismissable`/`useEscape`.
  - `utils.js` — `gerarTimeline`, `fmtDiaMes`.

### Dois modos: mock vs. real

`isMockMode = PROTOTYPE_MODE || !supabase` (em `lib/supabase.js`). Com as env vars do
Supabase configuradas e `PROTOTYPE_MODE=false`, roda em **modo real (compartilhado)**.
Sem elas, cai em **mock** (dados de exemplo + localStorage). Cada função de `lib/api/*`
tem os dois caminhos (`if (isMockMode) { ... }`).

### Modo "time sem login"

Perfis estilo Netflix (Lucas/Davi/Folha), sem senha. O perfil escolhido é o "ator" das
ações (`ph_actor` no localStorage). Os dados são **compartilhados** via anon key + RLS
aberto para anon — não há authZ por usuário (ver "Segurança").

### Camada de dados (`lib/api/`)

Cada módulo expõe funções que (a) em mock mexem em arrays locais, (b) em real falam com o
Supabase e **normalizam** as linhas (colunas em inglês → shape PT que a UI usa). Exemplos do
contrato: projeto tem `nome/nicho/faturamento/persona/timeline/...`; reunião tem
`titulo/data/hora/participantes`. Sempre normalize no `lib/api` — a UI não deve ver colunas cruas.

`carregarDados()` (em `App.jsx`) usa `Promise.allSettled`: uma fonte com falha não derruba
o resto; um banner oferece "tentar de novo".

## Funções serverless (`api/`)

CommonJS (a raiz não tem `package.json` de módulo), `maxDuration` 60s na Vercel. `api/_lib/`
não vira rota (prefixo `_`).

- `v1/clone.js` — cria projeto no Tynk + importa a página + extrai a oferta com IA
  (`Promise.allSettled`, best-effort). Orçamento de tempo (`DEADLINE` ~50s) para não estourar
  os 60s; importação lenta vira `import.timedOut` (não derruba o clone).
- `_lib/extract.js` — Jina Reader + OpenRouter (modelos `:free`). Nunca lança; devolve `{}`.
- `_lib/snapshot.js` / `v1/snapshot.js` — captura HTML renderizado, embute CSS/imagens, sobe
  no bucket público `snapshots`.
- `v1/preview.js` — proxy que serve o snapshot como `text/html` (o Storage serviria `text/plain`).
  Envia `Content-Security-Policy: sandbox` para neutralizar XSS (HTML de terceiros no nosso domínio).
- `cakto-webhook.js` — valida o secret (tempo constante) e chama a RPC `ingest_cakto_sale`
  com a service role. **Fonte de verdade do faturamento** em produção.
- `_lib/url-guard.js` — `assertPublicHttpUrl` (anti-SSRF) usado antes de buscar URLs do cliente.

## Faturamento (resumo)

- **Produção:** webhook da Cakto → `ingest_cakto_sale` → trigger recalcula
  `projects.faturamento` (escopado por produto). O app só **lê** `projeto.faturamento`.
- **Dev:** ponte local (`server/cakto-bridge.mjs` em :4000) puxa a Cakto direto.
- Gasto de anúncios (UTMfy) não tem API de leitura → entrada manual; por isso `lucro`/`roas`
  podem vir nulos (a UI mostra "—").

## Tema

`T` é um objeto **mutável** lido pelos inline styles. Trocar tema = `applyTheme()` sobrescreve
`T` e o App força um re-render. Simples, mas significa que componentes que não re-renderizam
por outro motivo podem ficar com cor stale (follow-up: ThemeProvider via Context).

## Segurança (modelo atual e limites)

- ✅ Segredos só no servidor; frontend usa anon key. `semSegredos()` remove chaves sensíveis
  antes de gravar `conexoes`.
- ✅ Anti-SSRF (hostname literal), secret do webhook em tempo constante, CSP sandbox no preview.
- ⚠️ **Sem authZ por usuário**: a anon key (no bundle) dá acesso de leitura/escrita às tabelas
  do time (RLS aberto p/ anon). Aceitável para o protótipo "time sem login"; trocar por auth
  real + RLS por linha se o modelo de ameaça mudar.
- ⚠️ Rotas `clone`/`snapshot` são públicas (risco de abuso de quota). Follow-ups (DNS rebinding,
  SSRF em sub-recursos, HMAC no webhook, auth nas rotas) estão em
  `docs/superpowers/specs/2026-06-19-refatoracao-otimizacao-plano.md`.

## Convenções

- Normalizar dados na camada `lib/api` (a UI fala PT).
- Segredos nunca no frontend nem no banco/`conexoes`.
- Erros de chamada de rede viram mensagens amigáveis (não "Failed to fetch").
- Build limpo antes de commit; deploy é automático na Vercel ao dar push no `main`.

## Backend Express (`backend/`)

Esqueleto Node + TS + Express + Prisma com endpoints stub (`501`). Não está no caminho de
produção. Decidir destino (documentar como futuro, ou remover) é um follow-up.
