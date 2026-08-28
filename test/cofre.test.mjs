import test from "node:test";
import assert from "node:assert/strict";
import {
  cifrar, decifrar, criarCanario, conferirCanario, FRASE_CANARIO,
  guardarSenhaNaSessao, senhaDaSessao, esquecerSenha,
} from "../frontend/src/lib/cofre.js";

/**
 * O cofre guarda senha de gateway, conta de anúncio e domínio num banco cujo
 * RLS é liberado pra chave anônima. Se a cifra falhar, o estrago é a operação
 * inteira. Por isso cada propriedade é testada, não só o "ida e volta".
 */

const SENHA = "senha-de-teste-que-nao-e-a-do-lucas";

test("ida e volta devolve exatamente o que entrou", async () => {
  const claro = "Gw!x8#Zq2%aLmP";
  const guardado = await cifrar(claro, SENHA);
  assert.equal(await decifrar(guardado, SENHA), claro);
});

test("o que vai pro banco NÃO contém o texto original", async () => {
  const claro = "minha-senha-secreta";
  const g = await cifrar(claro, SENHA);
  const tudo = `${g.cifrado}${g.salt}${g.iv}`;
  assert.ok(!tudo.includes(claro), "o texto claro vazou pro que é gravado");
  assert.ok(g.cifrado.length > 0 && g.salt.length > 0 && g.iv.length > 0);
});

test("senha errada não devolve lixo — devolve erro", async () => {
  const g = await cifrar("segredo", SENHA);
  await assert.rejects(() => decifrar(g, "senha-errada"), /Senha-mestra incorreta/);
});

test("uma letra a mais na senha já não abre", async () => {
  const g = await cifrar("segredo", SENHA);
  await assert.rejects(() => decifrar(g, SENHA + "x"), /Senha-mestra incorreta/);
});

test("dois itens com a MESMA senha geram cifras diferentes", async () => {
  // salt e iv sorteados por item: senão dava pra deduzir que dois acessos têm
  // a mesma senha só olhando o banco.
  const a = await cifrar("igual", SENHA);
  const b = await cifrar("igual", SENHA);
  assert.notEqual(a.cifrado, b.cifrado);
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.equal(await decifrar(a, SENHA), "igual");
  assert.equal(await decifrar(b, SENHA), "igual");
});

test("cifra adulterada no banco é rejeitada, não decifrada torto", async () => {
  const g = await cifrar("segredo", SENHA);
  const mexido = { ...g, cifrado: g.cifrado.slice(0, -4) + (g.cifrado.endsWith("AAAA") ? "BBBB" : "AAAA") };
  await assert.rejects(() => decifrar(mexido, SENHA), /Senha-mestra incorreta/);
});

test("acento, emoji e texto longo sobrevivem", async () => {
  const claro = "Ação — çãõ 🔐 " + "x".repeat(5000);
  const g = await cifrar(claro, SENHA);
  assert.equal(await decifrar(g, SENHA), claro);
});

test("canário aprova a senha certa e reprova a errada", async () => {
  const c = await criarCanario(SENHA);
  const guardado = { cifrado: c.cifrado, salt: c.salt, iv: c.iv };
  assert.equal(await conferirCanario(guardado, SENHA), true);
  assert.equal(await conferirCanario(guardado, "outra"), false);
  assert.equal(await decifrar(guardado, SENHA), FRASE_CANARIO);
});

test("sem senha-mestra não guarda nem abre", async () => {
  await assert.rejects(() => cifrar("x", ""), /senha-mestra/i);
  await assert.rejects(() => decifrar({ cifrado: "a", salt: "b", iv: "c" }, ""), /senha-mestra/i);
});

test("a senha vive só em memória e sai quando mandam sair", () => {
  esquecerSenha();
  assert.equal(senhaDaSessao(), null);
  guardarSenhaNaSessao("temporaria");
  assert.equal(senhaDaSessao(), "temporaria");
  esquecerSenha();
  assert.equal(senhaDaSessao(), null);
});
