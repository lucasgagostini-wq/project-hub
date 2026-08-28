import test from "node:test";
import assert from "node:assert/strict";
import { fecharConta, decisoes, periodoDe } from "../frontend/src/lib/placarCalc.js";

/**
 * O placar é o que decide cortar ou escalar uma oferta. Estes testes existem
 * para que um erro de conta apareça aqui, e não no extrato.
 */

const base = {
  project_id: "p1", nome: "Reencontro", slug: "reencontro", ativo: true,
  vendas: 0, faturamento: 0, liquido: 0, taxas: 0, pendentes: 0, reembolsos: 0,
  gasto: 0, impressoes: 0, cliques: 0, taxa_pct: 0, taxa_fixa: 0, custo_unit: 0,
};

test("lucro desconta taxa do gateway, entrega e gasto de anúncio", () => {
  const c = fecharConta({
    ...base, vendas: 10, faturamento: 270, gasto: 100,
    taxa_pct: 1.22, taxa_fixa: 0.99, custo_unit: 1.3,
  });
  // taxa = 270*1,22% (3,294) + 10*0,99 (9,90) = 13,194 · entrega = 13,00
  assert.ok(Math.abs(c.taxas - 13.194) < 0.001, `taxas=${c.taxas}`);
  assert.equal(c.entrega, 13);
  assert.ok(Math.abs(c.lucro - (270 - 13.194 - 13 - 100)) < 0.001, `lucro=${c.lucro}`);
  assert.equal(c.custoEstimado, true, "sem taxa do gateway, o custo é estimado");
});

test("quando o gateway informa a taxa, ela vence a estimativa", () => {
  const c = fecharConta({ ...base, vendas: 10, faturamento: 270, taxas: 20, taxa_pct: 99, taxa_fixa: 99 });
  assert.equal(c.taxas, 20);
  assert.equal(c.custoEstimado, false);
});

test("ROI sem gasto é null, nunca Infinity nem zero", () => {
  const c = fecharConta({ ...base, vendas: 3, faturamento: 81, gasto: 0 });
  assert.equal(c.roi, null);
  assert.equal(c.cpa, null);
});

test("ROI e CPA saem certos quando há gasto", () => {
  const c = fecharConta({ ...base, vendas: 4, faturamento: 108, gasto: 54 });
  assert.equal(c.roi, 2);
  assert.equal(c.cpa, 13.5);
  assert.equal(c.ticket, 27);
});

test("oferta sem venda nenhuma não gera divisão por zero", () => {
  const c = fecharConta({ ...base, gasto: 200 });
  assert.equal(c.ticket, 0);
  assert.equal(c.margem, 0);
  assert.equal(c.lucro, -200);
});

test("verba rodando sem venda é o alerta mais urgente", () => {
  const fila = decisoes([fecharConta({ ...base, gasto: 300, vendas: 0 })]);
  assert.equal(fila[0].nivel, "urgente");
  assert.match(fila[0].titulo, /nenhuma venda/i);
});

test("ROI abaixo de 1 com gasto relevante manda cortar", () => {
  const fila = decisoes([fecharConta({ ...base, gasto: 300, vendas: 5, faturamento: 135 })]);
  assert.equal(fila[0].nivel, "urgente");
  assert.match(fila[0].motivo, /ROI 0\.45/);
});

test("gasto baixo não vira alerta — ruído estatístico fica de fora", () => {
  assert.equal(decisoes([fecharConta({ ...base, gasto: 12, vendas: 0 })]).length, 0);
});

test("ROI alto com volume vira oportunidade de escalar", () => {
  const fila = decisoes([fecharConta({ ...base, gasto: 100, vendas: 10, faturamento: 270 })]);
  assert.ok(fila.some((d) => d.nivel === "oportunidade"));
});

test("vendeu e o gasto não chegou é avisado — senão o lucro parece maior do que é", () => {
  const fila = decisoes([fecharConta({ ...base, gasto: 0, vendas: 6, faturamento: 162 })]);
  assert.ok(fila.some((d) => /gasto não chegou/i.test(d.titulo)));
});

test("PIX pendente demais vira atenção", () => {
  const fila = decisoes([fecharConta({ ...base, vendas: 2, pendentes: 20, faturamento: 54 })]);
  assert.ok(fila.some((d) => /PIX/i.test(d.titulo)));
});

test("período usa o dia de São Paulo, não o do UTC", () => {
  // 02:00 UTC de 29/08 ainda é 23h de 28/08 em São Paulo — se o placar usasse UTC,
  // "hoje" pularia de dia às 21h e a tela da noite nasceria zerada.
  const antes = Date.now;
  Date.now = () => Date.parse("2026-08-29T02:00:00Z");
  try {
    assert.equal(periodoDe("hoje").desde, "2026-08-28");
    assert.equal(periodoDe("7d").desde, "2026-08-22");
  } finally {
    Date.now = antes;
  }
});
