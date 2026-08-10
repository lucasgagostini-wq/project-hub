# Project Hub — Evolução para Plataforma Completa

**Data:** 2026-06-12
**Status:** Design para aprovação
**Autor:** Lucas + Claude

---

## 1. Visão e objetivo

Transformar o Project Hub de um **protótipo navegável** (frontend single-file com dados fictícios, backend stub `501`) em uma **plataforma real, funcional e profissional** para gestão de uma operação de ofertas digitais (marketing de resposta direta).

A inspiração vem de três plataformas, trazendo a melhor parte de cada uma:

| Plataforma | "Alma" que trazemos | Onde aparece no Project Hub |
|---|---|---|
| **ClickUp / Monday** | Hub operacional: projetos, tarefas, persona, oferta, auditoria | Fase 1 |
| **Triple Whale** | Dashboard financeiro: lucro real, ROAS, top criativos | Fase 2 |
| **Hyros** | Tracking/atribuição: anúncio → venda via integrações | Fase 3 |

**Princípio do produto (do schema atual):** equipe pequena e de alta confiança — todo usuário autenticado vê e edita tudo. Não há permissões por recurso; a identidade existe sobretudo para **rastreamento** (AuditLog). Mantemos essa filosofia.

---

## 2. Decisões de arquitetura (aprovadas)

| Decisão | Escolha | Implicação |
|---|---|---|
| **Backend / dados** | **Supabase** (Postgres + Auth + Realtime + Edge Functions) | Aposenta o esqueleto Express; o schema Prisma vira a base das tabelas Supabase |
| **Integrações** | **Estrutura agora, API real depois** | UI, modelos e "plugs" prontos rodando com mock realista; conectores reais quando houver credenciais |
| **Usuários** | **Equipe pequena com login + auditoria** | Auth real multiusuário; AuditLog automático em toda mutação |
| **Sequência** | Fundação → Hub Operacional → Financeiro → Tracking | Espinha dorsal e features sem dependência de API primeiro |

### Por que Supabase em vez do Express já existente
O esqueleto Express/Prisma é bem desenhado, mas exigiria hospedar API + banco + implementar cada endpoint na mão. O Supabase entrega Postgres gerenciado, **Auth pronto**, cliente JS direto do frontend com **Row Level Security (RLS)**, Realtime e **Edge Functions** (Deno) para a lógica server-side das integrações (chamadas com segredos, webhooks de Cakto/UTMfy). O schema Prisma e a lógica de domínio do Express **informam** o design Supabase, mas o servidor Express é descontinuado.

---

## 3. Stack e estrutura

**Frontend** (mantém): React 18 + Vite, PWA instalável. Hoje é um `App.jsx` único (~1940 linhas). Como parte da Fase 0, **quebramos em módulos** (`/features`, `/lib`, `/components`) — pré-requisito de qualidade para crescer sem virar um monólito impossível de manter.

**Dados/Backend**: Supabase
- **Auth**: e-mail + senha (espelha a tela de login atual com perfis)
- **Postgres**: tabelas migradas do schema Prisma
- **RLS**: toda tabela exige usuário autenticado; leitura/escrita liberadas a qualquer membro autenticado (filosofia do produto), exceto `audit_log` que é somente-inserção/leitura
- **Realtime**: sincronização ao vivo entre membros (opcional, ligado por tabela)
- **Edge Functions**: sincronização de integrações e webhooks (Fase 3)

**Camada de acesso no frontend**: um módulo `lib/api` com funções tipadas por domínio (projects, offers, tasks, metrics…), encapsulando o cliente Supabase. Os componentes nunca falam direto com o Supabase — falam com `lib/api`. Isso isola a fonte de dados e facilita testar/trocar.

---

## 4. Modelo de dados (Supabase)

Baseado integralmente no `backend/prisma/schema.prisma` já existente. Tabelas:

`users` (perfil; espelha `auth.users`), `projects`, `offers`, `offer_links`, `personas`, `creatives`, `metric_snapshots`, `offer_actions`, `tasks`, `meetings`, `meeting_participants`, `integration_configs`, `audit_log`.

**Enums**: `role` (FOUNDER, TRAFEGO, COPY, DESIGN, MEMBER), `sales_channel`, `integration_provider` (UTMFY, CAKTO, META_ADS, GOOGLE_ADS, GOOGLE_CALENDAR), `integration_status`, `metric_source`.

**AuditLog automático**: trigger no Postgres (`AFTER INSERT/UPDATE/DELETE`) escreve em `audit_log` com `user_id`, `action`, `entity_type`, `entity_id`, `project_id`, `before`, `after`. Garante rastreamento sem depender do frontend lembrar de registrar.

---

## 5. Fase 0 — Fundação Supabase

**Objetivo:** dados reais, login real, auditoria automática. Sem isso nenhuma "alma" é real.

**Entregas:**
1. Projeto Supabase criado; variáveis em `.env` (frontend usa `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
2. Migrations SQL com todas as tabelas, enums, índices e RLS
3. Trigger de AuditLog
4. Seed com os usuários da equipe e 2-3 projetos de exemplo (para a tela não nascer vazia)
5. **Refatoração do frontend**: quebrar `App.jsx` em módulos por feature
6. Camada `lib/api` + `lib/supabase`
7. Tela de login real (e-mail/senha) substituindo o mock de perfis
8. Trocar todos os dados fictícios por leitura/escrita reais
9. Estados de **loading**, **erro** e **vazio** em cada tela (hoje inexistentes)

**Critério de pronto:** logar como membro real, criar/editar um projeto, recarregar e os dados persistem; a edição aparece no feed de auditoria.

---

## 6. Fase 1 — Hub Operacional (alma ClickUp)

**Objetivo:** a espinha dorsal de uso diário do time. Tudo funciona sem nenhuma API externa.

**Entregas:**
- **Projetos**: CRUD completo, ativar/arquivar, criação por "do zero" ou "clonar oferta" (o fluxo de clonagem já existe na UI — passa a persistir)
- **Estruturação de Oferta**: o que é, preço, garantia, canal principal, links (landing/checkout) — formulários hoje mock viram reais
- **Persona**: quem é, dor, desejo, objeção, canal
- **Tarefas**: CRUD, atribuição a membros, prazo, concluir; visão "minhas tarefas" e "tarefas do projeto"
- **Reuniões**: CRUD com participantes
- **Calendário**: agrega tarefas com prazo + ações de oferta + reuniões num calendário geral e por projeto
- **Feed de atividade/auditoria**: por projeto e global, lendo `audit_log` ("Rafael atualizou a persona", etc.)
- **Realtime** (opcional): se dois membros editam, a tela atualiza ao vivo

**Critério de pronto:** o time consegue tocar a operação inteira (projetos, tarefas, reuniões, oferta, persona) só nesta plataforma, com histórico de quem fez o quê.

---

## 7. Fase 2 — Dashboard Financeiro (alma Triple Whale)

**Objetivo:** "o número que importa" por oferta, em tempo real.

**Entregas:**
- **Home consolidada**: faturamento, lucro líquido, gasto com ads, margem, nº de projetos ativos — somando todos os projetos no período
- **Por projeto**: os mesmos KPIs + **ROAS**, tempo de oferta no ar, status (escalando/em queda)
- **Top criativos** que mais vendem (tabela `creatives`: vendas, gasto, receita)
- **Linha do tempo de métricas**: gráfico de faturamento/lucro/gasto por dia (recharts já está no projeto), com as **ações de oferta** plotadas como marcos ("subiu criativo", "aumentou verba")
- **Entrada de métricas**: lançamento manual de `metric_snapshot` (diário) — funciona já; na Fase 3 passa a ser alimentado pelas integrações
- **Filtros de período** (7/30/90 dias, custom)

**Critério de pronto:** abrir a Home e ver o lucro real consolidado e por oferta; o gráfico mostra a evolução com os marcos de mudança da oferta.

---

## 8. Fase 3 — Tracking & Integrações (alma Hyros)

**Objetivo:** ligar anúncio → venda e automatizar a entrada de métricas. Estrutura agora; vira real quando houver credenciais.

**Entregas:**
- **Tela de Integrações por projeto**: conectar/desconectar UTMfy, Cakto, Meta Ads, Google Ads, Google Agenda; status (desconectado/conectado/erro), último sync
- **Camada de conectores** (Edge Functions) com interface comum: `sync()` puxa métricas e grava em `metric_snapshots` com `source` correto; `webhook()` recebe eventos de venda (Cakto/UTMfy)
- **Cofre de segredos**: tokens/keys nunca no banco cru — guardados em Supabase Vault/Secrets, referenciados por `credential_ref` (já previsto no schema)
- **Atribuição**: ligar venda recebida via webhook ao criativo/anúncio de origem (UTM), alimentando "top criativos" e ROAS reais
- **Mock realista até conectar**: cada conector tem um modo `mock` que gera dados plausíveis, então a Fase 2 já funciona "como se" estivesse conectada
- **Google Agenda**: sincronizar reuniões (2 vias) — opcional dentro da fase

**Critério de pronto (estrutura):** conectar um provider em modo mock preenche métricas/vendas automaticamente; trocar para modo real exige só credenciais válidas, sem refazer código.

---

## 9. Design — elevação contínua

Não é uma fase isolada; cada entrega já nasce polida. Base atual (dark mode Deep Slate, Tabler Icons, grid animado) é mantida e estendida:

- **Design tokens**: extrair o objeto `T` de tema para um módulo único, garantindo consistência (já evitando os bugs de contraste que corrigimos)
- **Estados**: loading (skeletons), vazio (ilustração + CTA), erro (retry) em toda tela
- **Componentes reutilizáveis**: Card, KPI, Badge, Modal, Input, Tabela, Avatar — hoje repetidos inline, viram componentes
- **Micro-interações**: transições suaves, feedback de salvamento, toasts
- **Responsivo/PWA**: preservar e refinar o layout mobile já existente

---

## 10. Decisões assumidas (confirme na revisão)

Defaults que adotei para não travar o spec — me corrija se preferir diferente:

1. **Auth**: e-mail + senha (sem OAuth/Google login por ora)
2. **Integrações a escafoldar**: UTMfy, Cakto, Meta Ads, Google Ads, Google Agenda
3. **Realtime**: ligado nas tabelas de uso colaborativo (tarefas, projetos), mas não bloqueia a Fase 1 se der trabalho
4. **Refatorar o `App.jsx`** em módulos faz parte da Fase 0 (não é opcional — é o que sustenta o crescimento)
5. **Express skeleton**: descontinuado; serve só como referência de domínio
6. **Idioma**: interface em PT-BR (mantido)

---

## 11. Fora de escopo (YAGNI por enquanto)

- Permissões granulares por recurso / clientes externos read-only (a filosofia é "todos veem tudo")
- App nativo (o PWA cobre mobile)
- Multi-tenancy / vários workspaces
- Billing/cobrança da própria plataforma (é uso interno)

---

## 12. Riscos

- **Refatoração do single-file**: maior risco técnico da Fase 0; mitigado quebrando incrementalmente, tela por tela, com o preview validando a cada passo
- **Integrações reais (Fase 3)**: dependem de credenciais e da estabilidade das APIs externas; o modo mock isola esse risco do resto do produto
- **RLS mal configurada**: poderia vazar/bloquear dados; mitigado com políticas simples (autenticado = acesso) e testes de leitura/escrita por membro
