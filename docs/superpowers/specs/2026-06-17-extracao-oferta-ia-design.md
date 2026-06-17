# Extração automática de oferta via IA (OpenRouter)

**Data:** 2026-06-17
**Status:** aprovado (Abordagem A)

## Objetivo

Ao clonar uma oferta pela URL no Project Hub, além de clonar a página no Tynk,
extrair automaticamente os campos do projeto (oferta, público, preço, garantia,
nicho, persona) usando um LLM via OpenRouter. Hoje o `NovoProjeto.jsx` já espera
esses campos na resposta de `/api/v1/clone`, mas eles nunca vêm preenchidos.

## Arquitetura

Estende o endpoint existente `api/v1/clone.js` (Vercel serverless, CommonJS).
Roda **duas tarefas independentes em paralelo** (`Promise.allSettled`):

1. **Clone no Tynk** — lógica atual, intacta (cria projeto → importa URL → detalha).
2. **Extração** — busca o conteúdo da página → manda pro OpenRouter → recebe os campos.

No fim, faz merge e devolve `{ nome, nicho, oferta, publico, idade, preco, garantia,
persona{nome,dor,desejo,objecao,canal}, tynk, links }`. O frontend já consome isso.

A lógica de extração vive num helper compartilhado **`api/_lib/extract.js`** (CJS, não
vira rota por causa do prefixo `_`), reaproveitado pela ponte de dev via `createRequire`.

## Fonte do conteúdo (página completa)

- **Principal:** `https://r.jina.ai/<url>` (Jina Reader — grátis, sem key) renderiza o JS
  e devolve markdown limpo. Trunca em ~15k chars pra limitar tokens.
- **Fallback:** se o Jina falhar/timeout, `fetch` direto do HTML + remoção de
  `<script>/<style>/<tags>`. Garante que nunca trava por causa da fonte.

## Extração (OpenRouter)

- `POST https://openrouter.ai/api/v1/chat/completions`
- Headers: `Authorization: Bearer $OPENROUTER_API_KEY`, `HTTP-Referer`, `X-Title`.
- Body: `model = $OPENROUTER_MODEL`, system prompt em PT instruindo o JSON exato + lista
  de nichos do app pra mapear, `response_format: { type: "json_object" }`, `temperature: 0.2`.
- **Parsing robusto:** tenta `JSON.parse`; se falhar, extrai o primeiro bloco `{...}`
  (tolera cercas ``` e texto ao redor).
- **Orçamento de tempo (crítico p/ UX):** timeout por chamada ~12s; no máximo **1 retry**
  em 429 (espera curta, teto ~3s); orçamento total da extração ~20s. Nunca 100s.

## Variáveis de ambiente (server-side)

- `OPENROUTER_API_KEY` — obrigatória p/ extração (Vercel Production + `server/.env` dev).
- `OPENROUTER_MODEL` — modelo configurável. Default: um modelo grátis (`:free`). Trocar p/
  pago barato (ex: `google/gemini-2.0-flash-001`) quando houver crédito — sem mudar código.
- `TYNK_API_KEY` — já existe (clone).

## Degradação graciosa

Extração é **best-effort**. Se faltar `OPENROUTER_API_KEY`, ou Jina+fallback falharem, ou
o OpenRouter der erro/429/timeout → devolve o clone normal com os campos de oferta vazios
(comportamento de hoje). **Nunca bloqueia nem atrasa demais a clonagem.** O frontend já faz
merge com `|| f.campo`, então campos vazios são inofensivos.

## Paridade dev

A ponte `server/cakto-bridge.mjs` (rota `/api/v1/clone`) importa o mesmo helper via
`createRequire`, pra testar a extração localmente antes do deploy.

## Teste

- **Local:** rodar a ponte com `--env-file=server/.env`, `POST /api/v1/clone` com uma URL de
  oferta real; verificar campos preenchidos (ou vazios + clone OK se o grátis estiver em 429).
- **Prod:** após deploy + env vars na Vercel, testar pelo botão "Clonar oferta" no site.

## Fora de escopo

- Persistência no Supabase (app está em `PROTOTYPE_MODE`, mock/localStorage).
- Extração de imagens/criativos da página.
