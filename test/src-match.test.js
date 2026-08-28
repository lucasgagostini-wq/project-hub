const test = require("node:test");
const assert = require("node:assert/strict");
const { forcaDoCasamento, projetoDoSrc } = require("../api/_src-match.js");

/**
 * As marcas usadas aqui são as 13 reais do banco do Hub, lidas em 28/08/2026.
 * Este teste existe porque casar por igualdade deixou o Reencontro Pet com
 * 2 vendas em vez de 147 — o placar mandaria cortar uma oferta que vende.
 */

const OFERTAS = [
  { id: "reencontro",  src_match: "reencontro, -reencontropraia" },
  { id: "petencontro", src_match: "pet" },
  { id: "anjopraia",   src_match: "anjopraia, reencontropraia" },
  { id: "abracojesus", src_match: "abracojesus" },
];

test("as cenas do Pet vão todas pro Pet", () => {
  for (const cena of ["petescadaria", "petencontrosaudade", "petcasa", "petpraia", "petquintal", "petencontro"]) {
    assert.equal(projetoDoSrc(cena, OFERTAS), "petencontro", `${cena} deveria ser do Pet`);
  }
});

test("as cenas do Reencontro vão todas pro Reencontro", () => {
  for (const cena of ["reencontro", "reencontronuvens", "reencontro1", "reencontronoite"]) {
    assert.equal(projetoDoSrc(cena, OFERTAS), "reencontro", `${cena} deveria ser do Reencontro`);
  }
});

test("reencontropraia é do Anjo, não do Reencontro — o prefixo mais longo vence", () => {
  assert.equal(projetoDoSrc("reencontropraia", OFERTAS), "anjopraia");
  assert.equal(projetoDoSrc("anjopraia", OFERTAS), "anjopraia");
});

test("`pet` não engole `reencontro` nem o contrário", () => {
  assert.equal(projetoDoSrc("reencontro", OFERTAS), "reencontro");
  assert.equal(projetoDoSrc("petescadaria", OFERTAS), "petencontro");
});

test("marca desconhecida não é adotada por ninguém", () => {
  assert.equal(projetoDoSrc("ofertanova2027", OFERTAS), null);
});

test("venda sem marca não vai pra oferta nenhuma", () => {
  assert.equal(projetoDoSrc(null, OFERTAS), null);
  assert.equal(projetoDoSrc("", OFERTAS), null);
  assert.equal(projetoDoSrc("   ", OFERTAS), null);
});

test("a força do casamento é o tamanho do prefixo — é o que decide o empate", () => {
  assert.equal(forcaDoCasamento("reencontropraia", "reencontro"), 10);
  assert.equal(forcaDoCasamento("reencontropraia", "reencontropraia"), 15);
  assert.equal(forcaDoCasamento("reencontropraia", "reencontro, -reencontropraia"), null);
});

test("maiúscula e espaço em volta não atrapalham", () => {
  assert.equal(projetoDoSrc("  PetEscadaria ", OFERTAS), "petencontro");
});

test("oferta sem src_match nunca reivindica venda", () => {
  assert.equal(projetoDoSrc("reencontro", [{ id: "x", src_match: null }]), null);
  assert.equal(projetoDoSrc("reencontro", [{ id: "x", src_match: "" }]), null);
});
