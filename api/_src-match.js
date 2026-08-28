/**
 * A qual oferta pertence uma venda, a partir da marca que o funil gravou.
 *
 * O funil não grava a oferta em `src` — grava a CENA do vídeo. Medido no banco
 * em 28/08/2026: `petescadaria`, `petcasa`, `petpraia`, `petquintal` e
 * `petencontrosaudade` são todas do Reencontro Pet, e `reencontronuvens`,
 * `reencontronoite`, `reencontro1` são do Reencontro. Casar por igualdade
 * deixava o Pet com 2 vendas em vez de 147.
 *
 * Por isso cada oferta declara PREFIXOS em `projects.src_match`, no mesmo
 * formato do `meta_campaign_prefix`: lista por vírgula, item com `-` na frente
 * é exclusão.
 *
 *   reencontro  → "reencontro, -reencontropraia"
 *   petencontro → "pet"
 *   anjopraia   → "anjopraia, reencontropraia"
 *
 * 🪤 O prefixo MAIS LONGO vence. `reencontropraia` casa tanto `reencontro`
 * (10 letras) quanto `reencontropraia` (15) — e é do Anjo, não do Reencontro.
 * É a mesma precedência do `ofertaDoPedido()` no funil
 * (eterniza-app/api/_ofertas.js), onde "mais específico primeiro" já é a regra.
 */

/**
 * Força do casamento entre uma marca e uma lista de prefixos.
 * @returns {number|null} tamanho do prefixo que casou (maior = mais específico),
 *                        ou null se não casa / está excluído.
 */
function forcaDoCasamento(src, srcMatch) {
  const marca = String(src || "").trim().toLowerCase();
  if (!marca) return null;

  const partes = String(srcMatch || "").split(",").map((p) => p.trim()).filter(Boolean);
  if (!partes.length) return null;

  for (const p of partes) {
    if (p.startsWith("-") && marca.startsWith(p.slice(1).toLowerCase())) return null;
  }

  let melhor = null;
  for (const p of partes) {
    if (p.startsWith("-")) continue;
    const pref = p.toLowerCase();
    if (marca.startsWith(pref) && (melhor === null || pref.length > melhor)) melhor = pref.length;
  }
  return melhor;
}

/**
 * Escolhe a oferta dona da venda entre os projetos cadastrados.
 * @param {string} src marca gravada pelo funil
 * @param {Array<{id: string, src_match: string}>} projetos
 * @returns {string|null} id do projeto, ou null quando nenhum reivindica
 */
function projetoDoSrc(src, projetos = []) {
  let vencedor = null;
  let forca = -1;
  for (const p of projetos) {
    const f = forcaDoCasamento(src, p.src_match);
    if (f !== null && f > forca) {
      forca = f;
      vencedor = p.id;
    }
  }
  return vencedor;
}

module.exports = { forcaDoCasamento, projetoDoSrc };
