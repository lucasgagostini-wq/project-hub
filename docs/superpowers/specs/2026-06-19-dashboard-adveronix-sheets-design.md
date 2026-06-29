# Spec — Dashboards de marketing por projeto via Google Sheets (Adveronix)

Data: 2026-06-19
Status: aguardando aprovação do usuário (NÃO implementar antes de aprovar)

## Contexto e problema

Hoje no Project Hub o faturamento de cada projeto vem da Cakto (webhook → tabela `sales` →
trigger `recompute_project_metrics` → `projects.faturamento` + `metric_snapshots` com
`source='cakto'`). Já o **gasto de anúncios é manual** (`projects.gasto_ads`), porque a
UTMfy não tem API de leitura. Sem o gasto, **ROAS e resultado não fecham sozinhos**.

O Adveronix é um add-on do Google Sheets que puxa dados de plataformas de anúncio (no nosso
caso, **Facebook/Meta Ads**) para uma planilha e a **atualiza sozinho numa agenda própria**.
A ideia: cada projeto aponta para uma planilha do Adveronix, o app lê essa planilha
periodicamente e alimenta o dashboard do projeto — fechando o ROAS de forma automática.

Achado importante: o schema **já foi desenhado para isso** — `metric_snapshots` tem
`ad_spend` e `source` ('meta' | 'google' | 'manual') com `unique(project_id, date, source)`,
exatamente para ingerir gasto por dia por plataforma sem colidir com as linhas de receita.

## Objetivos

1. Conectar cada projeto a uma planilha do Adveronix (uma planilha por projeto).
2. Ingerir, por dia, **gasto, impressões, cliques e conversões** (Meta Ads) no Supabase.
3. Recalcular `gasto_ads` e derivar **ROAS** e **Resultado = faturamento − gasto** por projeto.
4. Atualização automática: **cron diário** no servidor + botão **"Sincronizar agora"**.
5. Nova seção **Marketing** no detalhe do projeto com KPIs e gráficos.

## Não-objetivos (v1)

- Multi-plataforma (Google/TikTok/…): o usuário só roda **FB Ads**. O modelo já suporta
  (basta novas linhas com outro `source`), mas a UI v1 assume Meta.
- Breakdown por **campanha** (várias campanhas FB separadas) → **fase 2**.
- Escrever **receita** via planilha: receita continua vindo da Cakto (fonte de verdade).
- Editar a planilha pelo app (leitura apenas).

## Decisões travadas (com o usuário)

| Tema | Decisão |
|---|---|
| Leitura da planilha | **API do Google Sheets + conta de serviço** (planilha privada, compartilhada só com o e-mail robô) |
| Escopo | Dashboard de marketing **completo** (gasto, impressões, cliques, conversões → CTR/CPC/CPM/ROAS) por dia, nível projeto |
| Atualização | **Cron diário** + botão **Sincronizar agora** |
| Mapeamento | **Uma planilha por projeto** |
| Lucro | Mostrar **Resultado = faturamento − gasto**; manter comissão líquida da Cakto à parte |
| Plataforma/campanha | Plataforma única (Meta); campanha = fase 2 |

## Arquitetura e fluxo de dados

```
Plataformas de anúncio (Meta)
      │  (Adveronix puxa, na agenda dele)
      ▼
Google Sheet — 1 por projeto  (atualizada sozinha pelo Adveronix)
      │  (API Sheets + conta de serviço)
      ▼
api/v1/sheets-sync  (Vercel)  ── cron diário + botão "Sincronizar agora"
      │  valida → upsert
      ▼
Supabase: metric_snapshots (source='meta') + recompute (projects.gasto_ads)
      ▼
Dashboard do projeto (lê o Supabase) — KPIs, ROAS, gráficos
```

Princípio que mantém o padrão atual: **Supabase é a fonte de verdade**; o app lê do Supabase
(não da planilha em tempo real). A planilha é só a origem que o sync materializa.

## Modelo de dados

Migration nova (`supabase/migrations/`):

1. **`metric_snapshots`** ganha 3 colunas (nullable, default 0):
   `impressions integer`, `clicks integer`, `conversions numeric`.
   - Linhas do Adveronix: `source='meta'`, preenchem `ad_spend, impressions, clicks, conversions` por dia.
   - Linhas da Cakto seguem iguais: `source='cakto'`, preenchem `revenue, net_profit`.
   - `unique(project_id, date, source)` permite as duas fontes coexistirem por dia → upsert idempotente.

2. **`recompute_ad_metrics(project_id)`** (função) ou trigger em `metric_snapshots`:
   - `projects.gasto_ads = sum(ad_spend)` de todas as linhas de ads do projeto (lifetime,
     para casar com `faturamento` que também é lifetime).
   - Não mexe em `revenue`/`lucro` (esses continuam do fluxo Cakto).

3. **Métricas derivadas** (calculadas na leitura, não persistidas):
   - `ROAS = faturamento / gasto_ads` (guardas p/ divisão por zero → null/"—").
   - `Resultado = faturamento − gasto_ads`.
   - Por dia/linha: `CTR = clicks/impressions`, `CPC = spend/clicks`, `CPM = spend/impressions*1000`.

4. **Config da conexão** (em `projects.conexoes.sheets`, JSONB já existente, **sem segredos**):
   ```json
   {
     "enabled": true,
     "sheetId": "<id da planilha>",
     "tab": "<nome da aba>",
     "headerRow": 1,
     "currency": "BRL",
     "map": { "date": "Date", "spend": "Spend", "impressions": "Impressions", "clicks": "Clicks", "conversions": "Conversions" },
     "lastSyncAt": "<iso>",
     "lastStatus": "ok | erro",
     "lastError": null,
     "rowsImported": 0
   }
   ```

## Modelo de colunas da planilha (o que configurar no Adveronix)

Planilha por projeto, uma aba, cabeçalho na linha 1. Colunas mínimas (nomes flexíveis — o
`map` resolve o cabeçalho real):

| Coluna | Conteúdo | Formato |
|---|---|---|
| Date | dia do dado | `YYYY-MM-DD` |
| Spend | gasto no dia | número (moeda da conexão) |
| Impressions | impressões | inteiro |
| Clicks | cliques | inteiro |
| Conversions | conversões | número |

Uma linha por dia. Se o Adveronix exportar por campanha (várias linhas/dia), o sync **soma
por dia** no v1; o detalhe por campanha fica para a fase 2.

## Sincronização

Função serverless **`api/v1/sheets-sync.js`** (CommonJS, padrão das outras):

- **Por projeto** (`POST { projectId }`): lê `conexoes.sheets`, busca a planilha pela Sheets
  API (`spreadsheets.values.get`), valida cabeçalho/colunas, parseia linhas, faz **upsert**
  em `metric_snapshots` (source='meta'), chama o recompute, e grava `lastSyncAt/lastStatus/
  rowsImported` na conexão.
- **Todos** (cron): itera os projetos com `conexoes.sheets.enabled`, roda cada um com
  `Promise.allSettled` (falha de um não derruba os outros). Protegido por header secreto
  (`CRON_SECRET`) — o Vercel Cron manda esse header.
- **Auth Google**: conta de serviço via `GOOGLE_SERVICE_ACCOUNT_JSON` (env server-side).
  Token OAuth2 (JWT) assinado em runtime; escopo `spreadsheets.readonly`.
- **Cron**: entrada em `vercel.json` (`crons`), 1×/dia (ex.: 08:00). Cadência ajustável.
- **Botão "Sincronizar agora"**: no card de integração do projeto, chama o sync por projeto e
  mostra resultado (linhas importadas / erro).

### Tratamento de erros (explícito no card)
- Planilha não compartilhada com o robô → "compartilhe a planilha com `<email-robô>` (leitor)".
- Aba/coluna inexistente → diz qual.
- Linha com data/numero inválido → ignora a linha e conta quantas; não derruba o sync.
- Falha de rede/quota → mensagem amigável + `lastStatus='erro'`; mantém o último dado bom.

## Dashboard (nova seção "Marketing" no ProjetoDetalhe)

- **KPIs**: Gasto, ROAS, Resultado, CTR, CPC, Conversões (RoasTag já trata null → "—").
- **Gráfico gasto × receita** no tempo (recharts, já lazy) — duas séries por dia.
- **Gráfico cliques/impressões** (ou CTR) no tempo.
- **Status da conexão**: última sincronização + botão Sincronizar agora.
- Vazio/sem conexão → estado "conecte uma planilha do Adveronix" com o passo-a-passo.

## Segurança

- `GOOGLE_SERVICE_ACCOUNT_JSON` e `CRON_SECRET` **só no env da Vercel** (nunca `VITE_`).
- Planilha compartilhada **só com o e-mail do robô** (leitura) → continua privada.
- Config não-secreta (sheetId/tab/map) vive em `conexoes` (já tem `semSegredos` como rede).
- Sem SSRF: chamamos a API do Google, não uma URL arbitrária do cliente.
- Endpoint de cron exige o `CRON_SECRET`.

## Setup único (Google Cloud) — entregue como checklist ao usuário

1. Criar/usar um projeto no Google Cloud Console.
2. Ativar a **Google Sheets API**.
3. Criar uma **Service Account** + gerar **chave JSON**.
4. Colar o JSON em `GOOGLE_SERVICE_ACCOUNT_JSON` no Vercel; definir `CRON_SECRET`.
5. Em **cada** planilha do projeto: Compartilhar → adicionar o e-mail da service account como **Leitor**.
6. No app: colar a URL da planilha + aba na conexão do projeto e "Sincronizar agora".

## Fases

- **v1** (este spec): migration + conexão Sheets por projeto + `sheets-sync` (manual + cron
  diário) + ingestão gasto/impressões/cliques/conversões (Meta) + recompute gasto_ads/ROAS/
  Resultado + seção Marketing (KPIs + gasto×receita).
- **Fase 2**: breakdown por **campanha** (dimensão nova / tabela `ad_insights`) + filtros +
  tendências de CTR/CPC/CPM; pronto para multi-plataforma (Google/TikTok) reusando `source`.

## Verificação (na implementação)

- Build do frontend limpo; `node --check` nas funções novas.
- Sync de uma planilha de teste → conferir linhas em `metric_snapshots` (source='meta') e
  `projects.gasto_ads` recalculado; ROAS/Resultado batendo no dashboard.
- Cron dispara e atualiza; botão manual idempotente (re-sync não duplica — upsert por
  `(project_id,date,source)`).
- Erros simulados (planilha não compartilhada, coluna faltando) aparecem no card.

## Riscos / notas de honestidade

- A frescura do dado depende de **duas agendas**: a do Adveronix (atualiza a planilha) e a do
  nosso cron (lê a planilha). Documentar que "atualiza 1×/dia" é a soma das duas.
- Cota da Sheets API é folgada para esse volume; mesmo assim o sync trata 429/erro.
- Compartilhar cada planilha com o robô é um passo manual por projeto (inevitável com conta
  de serviço; é o custo de manter a planilha privada).
- `projects.lucro` continua sendo a comissão líquida da Cakto; o "Resultado" do dashboard é
  calculado (faturamento − gasto) e exibido à parte para não conflitar.
