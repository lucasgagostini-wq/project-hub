/**
 * Cálculo do placar — sem I/O, sem Supabase, sem React.
 *
 * Fica separado porque é a parte que vira decisão de dinheiro (cortar ou escalar
 * uma oferta) e por isso é a única do Hub coberta por teste automatizado:
 * `npm test` na raiz.
 */

/** YYYY-MM-DD no fuso de São Paulo — "hoje" é o dia dele, não o do UTC. */
export function diaSP(d = new Date(Date.now())) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

export function periodoDe(chave) {
  const hoje = diaSP();
  const menos = (n) => diaSP(new Date(Date.now() - n * 86400000));
  switch (chave) {
    case "ontem":  return { desde: menos(1), ate: menos(1), label: "ontem" };
    case "7d":     return { desde: menos(6), ate: hoje,     label: "últimos 7 dias" };
    case "30d":    return { desde: menos(29), ate: hoje,    label: "últimos 30 dias" };
    case "hoje":
    default:       return { desde: hoje, ate: hoje, label: "hoje" };
  }
}

/**
 * Fecha a conta de uma oferta.
 *
 * O gateway não manda taxa pro Hub (o espelho envia só o valor pago), então a
 * taxa sai da configuração da oferta e o resultado é marcado como ESTIMADO.
 * Chutar taxa zero seria inflar o lucro — e foi exatamente esse tipo de erro
 * que criou "lucro inexistente" no Paradise em 09/08/2026.
 */
export function fecharConta(linha) {
  const faturamento = Number(linha.faturamento) || 0;
  const vendas = Number(linha.vendas) || 0;
  const gasto = Number(linha.gasto) || 0;
  const taxasReais = Number(linha.taxas) || 0;

  const taxasEstimadas =
    (faturamento * (Number(linha.taxa_pct) || 0)) / 100 + vendas * (Number(linha.taxa_fixa) || 0);
  const taxas = taxasReais > 0 ? taxasReais : taxasEstimadas;
  const entrega = vendas * (Number(linha.custo_unit) || 0);

  const lucro = faturamento - taxas - entrega - gasto;
  const roi = gasto > 0 ? faturamento / gasto : null;
  const ticket = vendas > 0 ? faturamento / vendas : 0;
  const cpa = vendas > 0 && gasto > 0 ? gasto / vendas : null;
  const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

  return {
    ...linha,
    faturamento, vendas, gasto,
    taxas, entrega, lucro, roi, ticket, cpa, margem,
    // Só é "medido" quando o próprio gateway informou a taxa.
    custoEstimado: taxasReais === 0 && (taxas > 0 || entrega > 0),
  };
}

/** Piso de gasto pra um alerta valer a pena — abaixo disso é ruído estatístico. */
const PISO_GASTO = 50;

/**
 * A fila "o que fazer agora": só entra o que tem número que justifique.
 * Cada item diz o motivo com o dado ao lado — nada de recomendação sem prova.
 */
export function decisoes(contas) {
  const itens = [];
  for (const c of contas) {
    if (c.gasto >= PISO_GASTO && c.vendas === 0) {
      itens.push({
        projectId: c.project_id, oferta: c.nome, nivel: "urgente",
        titulo: "Verba rodando e nenhuma venda",
        motivo: `${fmt(c.gasto)} gastos, 0 vendas no período.`,
        acao: "Conferir se o funil está no ar e se o marcador de venda está chegando.",
      });
    } else if (c.roi != null && c.roi < 1 && c.gasto >= PISO_GASTO) {
      itens.push({
        projectId: c.project_id, oferta: c.nome, nivel: "urgente",
        titulo: "Está perdendo dinheiro",
        motivo: `ROI ${c.roi.toFixed(2)} · ${fmt(c.faturamento)} de venda contra ${fmt(c.gasto)} de gasto.`,
        acao: "Cortar as campanhas de pior CPA ou baixar verba.",
      });
    } else if (c.roi != null && c.roi >= 2 && c.vendas >= 3) {
      itens.push({
        projectId: c.project_id, oferta: c.nome, nivel: "oportunidade",
        titulo: "Aguenta mais verba",
        motivo: `ROI ${c.roi.toFixed(2)} com ${c.vendas} vendas · lucro ${fmt(c.lucro)}.`,
        acao: "Subir orçamento nas campanhas que sustentam o ROI.",
      });
    }

    if (c.vendas > 0 && c.gasto === 0) {
      itens.push({
        projectId: c.project_id, oferta: c.nome, nivel: "atencao",
        titulo: "Vendeu, mas o gasto não chegou",
        motivo: `${c.vendas} vendas e R$ 0 de gasto registrado — o número do Meta não entrou.`,
        acao: "Conferir o mapeamento da conta/prefixo da oferta e rodar o meta-sync.",
      });
    }
    if (c.pendentes >= 5 && c.pendentes > c.vendas) {
      itens.push({
        projectId: c.project_id, oferta: c.nome, nivel: "atencao",
        titulo: "PIX gerado que não vira pagamento",
        motivo: `${c.pendentes} pendentes contra ${c.vendas} pagas.`,
        acao: "Olhar o checkout e a recuperação de PIX.",
      });
    }
  }
  const ordem = { urgente: 0, oportunidade: 1, atencao: 2 };
  return itens.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

function fmt(v) {
  return (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
