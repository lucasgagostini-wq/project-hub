const test = require("node:test");
const assert = require("node:assert/strict");
const { casa } = require("../api/v1/meta-sync.js");

/**
 * Casar campanha com oferta é onde o gasto pode ir parar na linha errada — e
 * gasto na linha errada inverte a decisão de cortar ou escalar. Os nomes usados
 * aqui são reais, lidos na API do Meta em 28/08/2026.
 */

const REENCONTRO = "[REE, -[REEPET], -[ANJ], -[JES]";
const PET = "[REEPET]";

test("campanha do Reencontro casa com o prefixo aberto", () => {
  assert.equal(casa("bm2 — [REEAMOR] 2208-SOBETUDO — CBO", REENCONTRO), "prefixo");
  assert.equal(casa("[REEAMOR] 1708-BITFOLHA -- ABO", REENCONTRO), "prefixo");
});

test("o Pet NÃO é engolido pelo Reencontro — é o furo que a exclusão fecha", () => {
  const nome = "[REEPET] PIXEL {1265} — DOGS - G2 — CP1NÉ";
  assert.equal(casa(nome, REENCONTRO), null, "o Reencontro não pode levar gasto do Pet");
  assert.equal(casa(nome, PET), "prefixo");
});

test("campanha sem prefixo nenhum não é somada no escuro", () => {
  // R$5.036 em 7 dias numa campanha assim: tem que aparecer como não casada,
  // não ser distribuída por chute.
  assert.equal(casa("bitcapREAL. — 24", REENCONTRO), null);
  assert.equal(casa("CAMPEAO - cinema", PET), null);
});

test("curinga só pega o que não tem dono", () => {
  assert.equal(casa("bitcapREAL. — 24", "*"), "curinga");
  // Mesmo com curinga, o prefixo específico continua sendo prefixo (prioridade
  // é resolvida por quem chama, mas o tipo precisa sair certo daqui).
  assert.equal(casa("[REEPET] DOGS", "[REEPET], *"), "prefixo");
});

test("exclusão vence o curinga", () => {
  assert.equal(casa("[REEPET] DOGS", "*, -[REEPET]"), null);
});

test("prefixo vazio nunca casa — oferta não configurada não rouba gasto", () => {
  assert.equal(casa("[REEAMOR] qualquer", ""), null);
  assert.equal(casa("[REEAMOR] qualquer", null), null);
});

test("casamento não depende de caixa alta/baixa", () => {
  assert.equal(casa("bm2 — [reeamor] teste", REENCONTRO), "prefixo");
});
