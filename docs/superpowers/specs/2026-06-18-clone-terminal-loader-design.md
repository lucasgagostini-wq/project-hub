# Spec — Carregamento estilo terminal + notificação na clonagem de oferta

Data: 2026-06-18
Status: aprovado para implementação (executar com Sonnet)

## Contexto e problema

No `NovoProjeto`, ao "Clonar oferta", o app faz uma chamada longa a `POST /api/v1/clone`
(~42s — o gargalo é a importação no Tynk) e, logo após, gera a preview automaticamente
via `POST /api/v1/snapshot` (~10s). Hoje, enquanto isso, a UI só mostra o botão em
"Clonando…" e depois "Capturando a página…" — parece travado. O usuário pediu um indicador
de carregamento que **não seja feio nem genérico**, e que deixe claro que, ao terminar, o
botão de preview aparece sozinho. Também quer um sistema de **notificação** opcional pra ser
avisado quando o processo terminar.

Decisão de design (aprovada): **console/terminal** que loga as etapas reais, com mensagens
rotativas por etapa, barra de blocos em pixels `[██░░]` e cursor piscando; e **notificação**
do navegador na v1.

## Restrição técnica central (ler antes de implementar)

O clone é **uma requisição que bloqueia** (`/api/v1/clone`) seguida de outra (`/api/v1/snapshot`).
O servidor **NÃO transmite progresso** no meio (não é SSE/stream). Portanto **não há % real**.

Abordagem honesta (NÃO fazer barra de % falsa enchendo):
- As etapas avançam num **timer calibrado pelos tempos reais medidos** e "pulam" pro estado
  verdadeiro quando cada `fetch` resolve.
- As mensagens descrevem o que **de fato** acontece no servidor (criar → importar → IA →
  snapshot). Só o avanço entre etapas é estimado.
- A barra de blocos é **baseada em etapa concluída** (4 etapas → enche 1 bloco por etapa),
  não em tempo — isso é honesto.

Tempos medidos em produção (referência para calibrar os timers):
- criar projeto no Tynk: ~1s
- importar a página: ~35–40s (caixa-preta; pode estourar e virar `import.timedOut`)
- extração IA (OpenRouter): ~15s, roda **em paralelo** com a importação no servidor
- snapshot (Jina + inline + upload): ~10s

## Objetivos

1. Console de carregamento estiloso (mockup já validado) no lugar do botão "Clonando…".
2. Mensagens rotativas por etapa (estilo splash do Minecraft) pra nunca parecer parado.
3. Barra de blocos `[██░░] n/4` por etapa concluída + cursor piscando.
4. Estado final: "✓ preview pronta" e destaque (pulse) no botão "Ver preview" que já existe.
5. Notificação do navegador opcional: pedir permissão ao iniciar; avisar ao terminar **somente
   se a aba estiver em segundo plano**.

## Não-objetivos (YAGNI)

- Sem SSE/streaming de progresso real do servidor (overkill; a chamada continua sendo uma só).
- Sem reestruturar `/api/v1/clone` em endpoints separados.
- Sem som; sem barra de % por tempo.

## Arquitetura

### Componente novo: `frontend/src/features/projects/CloneProgress.jsx`

Auto-contido. Recebe o macro-estado e cuida da animação interna (avanço de etapa + rotação de
mensagens). Props sugeridas:

```jsx
<CloneProgress
  cloning={boolean}     // requisição /clone em andamento
  snapping={boolean}    // requisição /snapshot em andamento
  done={boolean}        // snapshot concluído (snap setado)
  error={string|null}   // mensagem de erro (clone ou snapshot)
  sourceUrl={string}    // mostrada no "$ clonar <url>"
/>
```

Máquina de estados derivada (ordem de prioridade):
- `error` → linha de erro vermelha (`✗ <mensagem>`), barra para no ponto em que estava.
- `done` → todas as etapas com ✓, barra cheia `[████] 4/4`, linha final
  "✓ preview pronta — clique em Ver preview".
- `snapping` → etapas 0–2 concluídas (✓), etapa 3 "capturando a preview" ativa.
- `cloning` → anima etapas 0 → 1 → 2 por timer (ver abaixo); etapa 3 ainda não.

Etapas (4):
```
0  criando projeto no Tynk          subs: ["reservando o domínio…"]
1  importando a página              subs: ["lendo o HTML…","seguindo redirecionamentos…",
                                            "esperando o Tynk processar…","isso pode levar um tempinho…"]
2  extraindo a oferta com IA         subs: ["lendo a copy…","achando público e preço…","montando a persona…"]
3  capturando a preview              subs: ["embutindo o CSS…","baixando as imagens…","empacotando o .html…"]
```

Lógica de avanço interno enquanto `cloning === true` (timer com `setTimeout`/`setInterval`,
limpos no cleanup do `useEffect`):
- etapa 0 fixa por ~1500ms → marca ✓, vai pra etapa 1.
- etapa 1 ativa; após ~22000ms (se o clone ainda não resolveu) → marca ✓, vai pra etapa 2
  ("extraindo a oferta com IA / quase lá").
- etapa 2 fica ativa **até** o `cloning` virar false (não avança sozinha além disso).
- a sub-mensagem da etapa ativa troca a cada ~900ms (round-robin no array `subs`).
- Quando `cloning` vira false e `snapping` vira true → etapas 0–2 ✓, etapa 3 ativa.
- Quando `done` → etapa 3 ✓, estado final.

Barra de blocos: `"[" + "█".repeat(concluidas) + "░".repeat(4-concluidas) + "] " + concluidas + "/4"`.

Visual (referência: mockup aprovado, replicar a aparência):
- Painel escuro fixo (terminal é escuro de propósito em light/dark): fundo `#0D1117`, borda
  `#2A2F37`, cabeçalho `#161B22` com 3 "bolinhas" (#FF5F56 / #FFBD2E / #27C93F) e título
  "project-hub — clonar oferta".
- Fonte monoespaçada. Texto base `#C9D1D9`; URL `#58A6FF`; ✓ verde `#3FB950`; spinner âmbar
  `#D29922`; mensagens secundárias `#8B949E`.
- Cursor piscando: bloco verde 8×15px, `@keyframes blink`.
- Spinner: ícone girando (`@keyframes spin`) na etapa ativa.
- O painel substitui a área do botão "Clonar/Clonando" enquanto `cloning || snapping || done`
  com erro ainda não fechado. (Manter o botão normal quando ocioso.)

Acessibilidade: incluir um `aria-live="polite"` na linha da etapa ativa para leitores de tela.

### Helper novo: `frontend/src/lib/notify.js`

```js
export function notifySuportado() { return typeof window !== "undefined" && "Notification" in window; }
export function notifyStatus() { return notifySuportado() ? Notification.permission : "unsupported"; } // "default" | "granted" | "denied" | "unsupported"
export async function pedirPermissaoNotify() {
  if (!notifySuportado()) return "unsupported";
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}
export function avisarConcluido(titulo, corpo) {
  // Só dispara se permitido E a aba estiver em segundo plano (não incomoda quem já está olhando).
  if (!notifySuportado() || Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    const n = new Notification(titulo, { body: corpo, icon: "/favicon.ico" });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (_) {}
}
```

### Edição: `frontend/src/features/projects/NovoProjeto.jsx`

Estado e fluxo já existentes: `cloning`, `clonar()`, `snapping`, `snap`, `snapErr`, `gerarPreview()`,
`cloneTynk`, `cloneMsg`. A clonagem já dispara `gerarPreview()` automático ao final (commit 9346072).

Mudanças:
1. Renderizar `<CloneProgress .../>` enquanto `cloning || snapping` (e no estado `done` por uns
   instantes, ou manter junto da mensagem). Passar `cloning`, `snapping`, `done={!!snap}`,
   `error={snapErr || (cloneMsg?.tipo === "erro" ? cloneMsg.texto : null)}`, `sourceUrl={cloneUrl}`.
   - Pode-se manter a `<section>` de preview existente (botões "Ver preview"/"Baixar .html"):
     quando `snap` existe, esses botões já aparecem. O CloneProgress é o indicador durante a espera.
2. Notificação:
   - Adicionar estado `const [notifQ, setNotifQ] = useState(false)` e mostrar um micro-prompt inline
     no início do clone **somente se** `notifyStatus() === "default"`: um aviso pequeno
     "🔔 Avisar quando a preview ficar pronta?" com botão "Ativar" → chama `pedirPermissaoNotify()`
     e some.
   - No `clonar()`, logo após `setCloning(true)`, setar `setNotifQ(notifyStatus() === "default")`.
   - Ao concluir a preview (quando `snap` é setado em `gerarPreview`), chamar
     `avisarConcluido("Project Hub", "Sua preview está pronta — clique em Ver preview.")`.
     Implementar via `useEffect(() => { if (snap) avisarConcluido(...); }, [snap])`.
3. Destaque no botão "Ver preview": quando `snap` acabou de ser setado, aplicar uma animação
   `pulse` (CSS keyframes, 2–3 iterações) no link "Ver preview" pra chamar atenção.

## Casos de borda

- **Erro no clone** (`cloneMsg.tipo === "erro"`): CloneProgress mostra linha `✗` vermelha e para;
  o botão normal de "Clonar oferta" volta a aparecer para nova tentativa.
- **Snapshot falha** (`snapErr`): CloneProgress mostra ✗ na etapa 3; etapas anteriores ficam ✓
  (o projeto Tynk foi criado mesmo assim). Mensagem orienta tentar "Gerar preview" de novo.
- **Importação do Tynk estoura** (`import.timedOut`): não é erro — o clone resolve normalmente,
  então o terminal segue para a etapa 3 (snapshot) e conclui. A mensagem amarela de timedOut
  já existe e continua aparecendo.
- **Usuário clica "Criar projeto" antes do snapshot terminar**: `snap` ainda é null → o projeto
  é criado sem `tynk.snapshot` (o arquivo existe no Storage, mas a URL não fica persistida).
  Aceitável; ele pode "Gerar preview" depois no detalhe. Opcional: desabilitar "Criar projeto"
  enquanto `snapping` com um aviso "aguarde a preview…".
- **Permissão de notificação negada**: nunca mais perguntar (browser persiste `denied`); só o
  estado na tela.
- **Aba em foco ao concluir**: NÃO notificar (o usuário já está vendo). Só notifica se `document.hidden`.

## Arquivos

- Novo: `frontend/src/features/projects/CloneProgress.jsx`
- Novo: `frontend/src/lib/notify.js`
- Editar: `frontend/src/features/projects/NovoProjeto.jsx`

Sem mudanças de backend. Sem migration. Reusar tokens de tema (`T`) onde fizer sentido; o painel
do terminal usa cores próprias (escuras) de propósito.

## Verificação

1. `cd frontend && npm run build` compila sem erros.
2. Teste manual (após deploy + hard-refresh):
   - Clonar uma página pesada (ex.: `castelointerior.com`): o terminal aparece, loga as etapas,
     as sub-mensagens trocam, a barra enche por etapa, e ao final surge "Ver preview" com pulse.
   - Trocar de aba durante o processo e confirmar que chega a notificação ao terminar (se permissão
     concedida); voltar pra aba e confirmar que o botão está pronto.
   - Recusar a permissão e confirmar que o fluxo segue normal sem notificação.
3. Confirmar no console do navegador que não há vazamento de timers (cleanup do `useEffect`).

## Notas de honestidade (registrar no PR)

O avanço de etapas é **estimado por tempo**, não medido do servidor (a API é uma chamada única
e bloqueante). As mensagens refletem operações reais; a barra é por etapa concluída. Se um dia
quisermos progresso real, seria preciso SSE/streaming — fora do escopo desta versão.
