# Ponte de integrações (dev)

`cakto-bridge.mjs` é uma **ponte local de desenvolvimento**. Ela existe porque o
frontend não pode chamar as APIs externas direto (CORS + os secrets não podem ir
para o navegador). A ponte guarda as credenciais **em memória** (via env) e expõe,
para o frontend, o **mesmo contrato** que o backend de produção deve implementar.

> Em produção isto **não** roda. O faturamento por projeto vem do **Supabase**:
> o webhook da Cakto (`api/cakto-webhook` → `ingest_cakto_sale`) grava cada venda e o
> trigger `recompute_project_metrics` mantém `projects.faturamento` escopado por projeto
> (via `gateway_products`). O app só **lê** `projeto.faturamento`. Esta ponte serve só
> ao ambiente de dev (sem webhook/Supabase) e replica o mesmo escopo por produto.

## Endpoints

| Método | Rota | O que faz |
|--------|------|-----------|
| GET  | `/api/v1/projects/:id/metrics?produtos=a,b,c` | Faturamento da Cakto **escopado pelos produtos do projeto** (soma de `amount` dos pedidos `paid` cujo produto/oferta está em `produtos`). Sem `produtos`, retorna `faturamento: null` e `escopo: "sem-produtos"` (não soma a conta inteira). `gastoAds` vem `null` (gasto é entrada manual no app). |
| POST | `/api/v1/clone` | Body `{ url, nome }`. Cria projeto no Tynk + importa a página da URL. Retorna metadata (`tynk`) + links. |
| GET  | `/health` | Healthcheck. |

## Como rodar (local)

Precisa de `--use-system-ca` no Windows (proxy/antivírus intercepta TLS).
As credenciais vêm de variáveis de ambiente — **nunca** hardcode:

```bash
CAKTO_CLIENT_ID=... \
CAKTO_CLIENT_SECRET=... \
TYNK_API_KEY=... \
NODE_OPTIONS=--use-system-ca \
node server/cakto-bridge.mjs
```

## Variáveis

- `CAKTO_API_BASE` (default `https://api.cakto.com.br`)
- `CAKTO_CLIENT_ID`, `CAKTO_CLIENT_SECRET` — OAuth2 da Cakto
- `TYNK_API_BASE` (default `https://pages.tynk.ai`)
- `TYNK_API_KEY` — Bearer do Tynk Pages
- `BRIDGE_PORT` (default `4000`)

## Detalhes das APIs (para portar ao backend de produção)

- **Cakto**: `POST /public_api/token/` (form `client_id`+`client_secret`) → `access_token`
  Bearer. `GET /public_api/orders/?limit=100&page=N` paginado; faturamento = soma de
  `amount` onde `status === "paid"`, **filtrando** os pedidos cujo `product.id` /
  `product.short_id` / `offer.id` está na lista de produtos do projeto (mesmos ids que
  `gateway_products` usa no webhook).
- **Tynk Pages** (doc: `https://pages.tynk.ai/api/docs`): `POST /api/v1/projects`
  `{ title }` → cria; `POST /api/v1/projects/:id/import` `{ url, mode:"modern" }` → clona
  a página; `GET /api/v1/projects/:id` → metadata.
