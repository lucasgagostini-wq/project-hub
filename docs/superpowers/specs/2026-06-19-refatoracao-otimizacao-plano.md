# Plano de Refatoração e Otimização — Project Hub

Data: 2026-06-19
Status: etapas 1–6 executadas; etapas 7+ recomendadas (backlog priorizado)

## Contexto

Auditoria completa do código (frontend React + Vite, funções serverless em `api/`,
backend Express/Prisma) feita por 4 revisões paralelas, seguida de correção em ondas.
Este documento registra o que foi feito, por quê, e o que fica como follow-up — servindo
de plano para as próximas iterações.

Cada onda foi: build limpo (`npm run build`) + verificação (dev server + transform de
todos os módulos) + commit + push (deploy automático na Vercel).

## Metodologia

1. **Auditar** antes de tocar: separar bugs ativos (afetam produção) de achados
   especulativos/latentes. Verificar cada achado contra o código real antes de corrigir.
2. **Corrigir em ondas pequenas e coerentes**, cada uma com build verde e commit próprio,
   para manter o histórico revisável e o deploy seguro (app é live, auto-deploy).
3. **Explicar cada correção** no commit e em comentários no código (o "porquê").

## Etapas concluídas

### Etapa 1 — Bugs de correção (commit `fix: ... wave 1`)
Foco: bugs que afetam o app em produção (modo Supabase real, `PROTOTYPE_MODE=false`).
- `meetings.js` sem normalizer → reuniões em branco/sumindo do calendário em produção.
- Datas no calendário/reuniões: dia por `slice(8,10)` e mês fixo "mai" → helper `fmtDiaMes`.
- Calendário: `flatMap` duplicava reuniões; keys de índice; filtro por pessoa.
- `Delta` na Home usava sinal de `escala` sobre a margem (KPI enganoso).
- `RoasTag` quebrava com `roas` null (`toFixed`).
- `projects.js`/`ideas.js`: `data.map` sem guarda; typo `oferta ?? oferta`; sort/parse de snapshot.
- App: projeto fantasma ao falhar `createProject`; `ProjetoDetalhe` com `key` por id.
- NovoProjeto: submit travado em erro; `persona_canal` descartado.
- MeuPerfil: botão travado em erro; vazamento de object URL.
- CloneProgress: timers não limpos no caminho de erro.

### Etapa 2 — Tratamento de erros (commit `perf+errors ... waves 2-3`)
- `ErrorBoundary` de topo (tela amigável em vez de página em branco).
- `carregarDados` com `Promise.allSettled` + banner "tentar de novo" (uma fonte com falha
  não derruba o dashboard).
- `clone.js`/`metrics.js`: `fetch` com try/catch → mensagem amigável (não "Failed to fetch").

### Etapa 3 — Performance
- `vite.config` com `manualChunks` (charts/icons/supabase/react-vendor).
- `ProjetoDetalhe` e `NovoProjeto` lazy (React.lazy + Suspense) → recharts sai do inicial.
- **Bundle inicial: 887 KB → ~67 KB** (index) + vendors; chunk de gráficos (383 KB) só
  baixa ao abrir um projeto. Aviso de chunk > 500 KB eliminado.
- `useMemo` na atividade filtrada do projeto.

### Etapa 4 — Acessibilidade e UI (commit `a11y ... wave 4`)
- Hooks `useDismissable`/`useEscape` (fecha popovers por clique-fora/Esc) → conserta menus
  de "trocar perfil" que ficavam abertos.
- ARIA em menus/modais (`role`, `aria-modal`, `aria-haspopup/expanded`, `aria-label`).
- Esc fecha modais; foco visível por teclado (`:focus-visible`, inclusive nos inputs com
  `outline:none` inline); `prefers-reduced-motion`.
- `fmtBRL` resistente a null; `Avatar` cai para iniciais se a imagem falhar.

### Etapa 5 — Reuso / componentização
- `lib/image.js` (`resizeImageToDataURL`) centraliza o redimensionamento; HomeGeral passa a
  redimensionar a capa (antes salvava base64 em tamanho original).

### Etapa 6 — Segurança (commit `refactor+security ... waves 5-6`)
- `api/_lib/url-guard.js` (anti-SSRF): bloqueia non-http(s), credenciais, localhost/loopback,
  ranges privados e o IP de metadados `169.254.169.254`. Aplicado em clone/snapshot/extract.
- Webhook Cakto: `timingSafeEqual` no secret; parou de vazar o erro cru do Postgres.
- `preview.js`: `Content-Security-Policy: sandbox` + `nosniff` + `no-referrer` → neutraliza
  XSS armazenado (HTML de terceiros servido no nosso domínio); guard de método.

## Etapas recomendadas (backlog priorizado)

Prioridade: 🔴 alta · 🟡 média · 🟢 baixa. Esforço: P/M/G.

### Segurança
- 🔴 **SSRF completo (DNS rebinding)** [M]: resolver o hostname e validar os IPs resolvidos;
  buscar com `redirect: "manual"` e revalidar o destino. Hoje o guard é só por hostname literal.
- 🔴 **SSRF nos sub-recursos do snapshot** [M]: `_lib/snapshot.js` busca CSS/imagens com URLs
  da página (controladas por quem hospeda) — aplicar `assertPublicHttpUrl` em cada asset e
  impor teto de bytes por resposta (hoje faz `arrayBuffer()` sem limite → risco de memória).
- 🟡 **HMAC real no webhook** [M]: se o Cakto expõe assinatura, verificar HMAC sobre o corpo
  cru (hoje é um secret no corpo, replayável).
- 🟡 **Auth nas rotas clone/snapshot** [M]: hoje públicas (denial-of-wallet em Tynk/OpenRouter).
- 🟢 **Path de storage do snapshot** [P]: namespacing/sufixo aleatório (hoje o cliente escolhe
  o `projectId` e há `x-upsert` → clobber no bucket público).

### Performance
- 🟡 **Memoizar `ProjetoDetalhe`** [M]: `React.memo` + `useCallback` nos ~10 handlers do App;
  hoje qualquer render do App re-renderiza o detalhe (com o gráfico recharts).
- 🟡 **`useMemo` corretos no detalhe** [P]: alguns memos usam só `[projeto.id]` com
  `eslint-disable` e ficam stale após sync de métricas.
- 🟢 **Paginação** [M] em atividade/ideias (hoje cap fixo de 100).

### Qualidade / correção
- 🟡 **`ticket`/`maxV` NaN** [P] em `ProjetoDetalhe` quando `faturamento` ausente (guardar com `|| 0`).
- 🟡 **Validar `href`** [P] de URLs (clone/links) para `^https?:` antes de renderizar (`javascript:`).
- 🟢 **Barrel `lib/api/index.js`** [P]: exporta só parte dos módulos (ideas/metrics/clone faltam;
  cuidado com colisão do `norm`).
- 🟢 **Tema via Context** [G]: `T` é um singleton mutável; trocar por ThemeProvider faz as cores
  propagarem sem depender de re-render acidental.

### Arquitetura
- 🟢 **Decidir o destino do `backend/` Express/Prisma** [G]: o app usa Supabase direto + `api/`
  serverless; o `backend/` parece paralelo/legado. Documentar ou remover para evitar confusão.
- 🟢 **Extrair primitivos de UI** [M]: `Button`, `Modal`, `Input` repetem estilos inline em
  vários arquivos; uma pequena biblioteca reduz duplicação.

## Métricas

| Métrica | Antes | Depois |
|---|---|---|
| Bundle JS inicial | 887 KB (1 chunk) | ~67 KB (index) + vendors sob demanda |
| Maior chunk no load inicial | 887 KB | 211 KB (supabase); charts 383 KB é lazy |
| Aviso de chunk > 500 KB | sim | não |
