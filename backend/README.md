# Gestão de Ofertas — API (esqueleto)

Backend do app de gestão de projetos/ofertas. **Toda a estrutura está pronta**: modelo de
dados, rotas, middlewares de autenticação e de rastreamento, e os pontos de integração.
**Os endpoints estão como stub** (`501 NOT_IMPLEMENTED`) com o contrato documentado em cada
handler — é só abrir o controller, ler o `TODO` e implementar.

## Stack
- Node + TypeScript
- Express (rotas)
- Prisma + PostgreSQL (banco)
- JWT (auth) · Zod (validação) · bcrypt (senha)

## Subir o ambiente
```bash
cp .env.example .env        # preencher DATABASE_URL e JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate      # cria as tabelas
npm run dev                 # http://localhost:4000
```
Healthcheck: `GET /health`. Tudo da API fica sob `/api/v1`.

## Como o código está organizado
```
src/
  app.ts / server.ts        bootstrap do Express
  routes.ts                 monta todos os módulos sob /api/v1
  config/env.ts             variáveis de ambiente (inclui tokens de integração)
  lib/                      prisma client, helpers http, notImplemented
  middleware/
    auth.ts                 requireAuth -> popula req.user (TODO: validar JWT)
    audit.ts                writeAudit  -> grava o RASTREAMENTO (chamar nas mutações)
    error.ts                tratamento de erro
  modules/
    auth/ users/ projects/ offers/ metrics/
    tasks/ meetings/ calendar/ audit/ integrations/
prisma/schema.prisma        modelo de dados completo (fonte da verdade)
docs/API.md                 referência de todos os endpoints
```

## Três regras do produto que já estão refletidas
1. **Acesso total para todos.** Qualquer usuário autenticado lê e edita tudo — não há
   permissão por recurso. A identidade existe sobretudo para o rastreamento.
2. **Rastreamento de tudo.** Toda criação/edição/exclusão deve chamar `writeAudit(...)`
   (em `middleware/audit.ts`). O feed sai em `GET /audit`.
3. **Datas + responsável viram calendário pessoal.** `Task` (assignee) e `OfferAction`
   (responsible) com data devem aparecer no calendário da pessoa — ver
   `GET /users/:id/calendar` e `GET /calendar?userId=`.

## Onde ligar as métricas (gráfico da oferta e desempenho por criativo)
Fonte principal: **UTMfy**, que já consolida o gerenciador de anúncios + o checkout (Cakto).
O app **não cria nem dispara anúncios** — só lê métricas. A linha do tempo e o desempenho
leem de `MetricSnapshot`. Para alimentá-lo:
- **Pull:** implemente os clients em `modules/integrations/providers/*` (UTMfy e Cakto)
  e o handler `integrations.sync`, que normaliza e faz upsert dos snapshots.
- **Push:** receba eventos em `POST /webhooks/utmfy` e `POST /webhooks/cakto`.
Os tokens ficam em `.env` (`UTMFY_*`, `CAKTO_*`).

> Não há integração de criação de anúncio / pixel — essa direção foi descartada.
> Segredos: não guarde tokens crus no banco. `IntegrationConfig.credentialRef` deve apontar
> para um cofre (AWS Secrets Manager / KMS / Vault).

## Checklist sugerido de implementação
- [ ] `auth.login` + `requireAuth` (JWT) e `auth.me`
- [ ] `writeAudit` gravando de verdade + chamadas nas mutações
- [ ] CRUD de `projects` + `projects.dashboard` e `projects.overview`
- [ ] Gestão de oferta: `offer`, `persona`, `links`, `creatives`, `actions`
- [ ] `metrics.timeline` (com cálculo de delta) e `metrics.upsertSnapshot`
- [ ] `tasks`, `meetings`, `calendar.feed`, `users.calendar`
- [ ] Integrações: providers + `sync` + webhooks
- [ ] Validação com Zod em cada body
