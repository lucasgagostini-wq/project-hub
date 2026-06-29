# Setup — Dashboard de marketing (Adveronix → Google Sheets)

Liga o gasto de anúncios (FB Ads) do Adveronix nos dashboards de cada projeto.
Faça os passos **nesta ordem** (a ordem importa — ver a nota sobre a migration).

## 1. Banco (Supabase) — aplicar a migration PRIMEIRO

Aplique `supabase/migrations/20260619120000_ad_metrics.sql` no Supabase
(SQL editor ou CLI). Ela adiciona as colunas `impressions/clicks/conversions` em
`metric_snapshots` e o recompute de `projects.gasto_ads`.

> **Por que primeiro:** o sync grava essas colunas; sem elas, a sincronização falha.
> O app foi feito para não quebrar enquanto a migration não roda (a lista de projetos
> continua normal), mas o sync só funciona depois dela aplicada.

## 2. Google Cloud (uma vez)

1. Crie/escolha um projeto em `console.cloud.google.com`.
2. APIs & Services → Library → ative a **Google Sheets API**.
3. IAM & Admin → Service Accounts → crie uma **Service Account** e gere uma **chave JSON**.
4. Anote o e-mail da service account (ex.: `robo@seu-projeto.iam.gserviceaccount.com`).

## 3. Vercel (variáveis de ambiente do projeto)

- `GOOGLE_SERVICE_ACCOUNT_JSON` = o conteúdo inteiro do JSON da chave (em uma linha).
- `CRON_SECRET` = uma string aleatória longa (protege o cron).

(O `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no projeto.)

## 4. Em cada planilha do Adveronix

1. No Adveronix, configure o relatório de **FB Ads** com colunas por dia:
   `Date`, `Spend`, `Impressions`, `Clicks`, `Conversions` (uma linha por dia) e ative o
   **Schedule** (atualização automática da planilha).
2. Botão **Compartilhar** da planilha → adicione o **e-mail da service account** como **Leitor**.
   (A planilha continua privada; só o robô lê.)

## 5. No app

1. Abra o projeto → aba **Conexões** → card **Google Sheets (Adveronix)**.
2. Cole a **URL da planilha**, a **aba** e os nomes das **colunas** → **Salvar e conectar**.
3. Clique em **Sincronizar agora**. Veja gasto/ROAS/Resultado na aba **Marketing**.
4. O **cron diário (08:00)** passa a sincronizar todos os projetos conectados sozinho.

## Fase B (opcional, depois da migration aplicada) — ligar CTR/CPC/impressões

Por segurança de deploy, o app **ainda não lê** as colunas `impressions/clicks/conversions`
na lista de projetos (assim a lista nunca quebra antes da migration). Depois que a migration
estiver aplicada em produção, ligue as métricas completas re-adicionando as 3 colunas ao
`PROJECT_SELECT` em `frontend/src/lib/api/projects.js`:

```
metric_snapshots(id, date, revenue, net_profit, ad_spend, impressions, clicks, conversions, source)
```

A partir daí o dashboard de Marketing mostra também **CTR**, **CPC** e **conversões**
(hoje aparecem como "—" porque o gasto/ROAS/Resultado já bastam e não dependem dessas colunas).

## Como funciona (resumo)

`Adveronix → Google Sheet (1 por projeto) → /api/v1/sheets-sync (cron diário + botão) →
metric_snapshots (source='meta') → recompute gasto_ads → dashboard`. Receita continua
vindo da Cakto (fonte de verdade); a planilha entra só com gasto e métricas de anúncio.
Detalhes no spec: `docs/superpowers/specs/2026-06-19-dashboard-adveronix-sheets-design.md`.
