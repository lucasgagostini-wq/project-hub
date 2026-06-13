export function gerarTimeline(base, escala) {
  const arr = [];
  let v = base;
  for (let i = 0; i < 30; i++) {
    const ruido = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * base * 0.06;
    v = Math.max(base * 0.3, v + escala * base * 0.02 + ruido);
    const dia = new Date(2025, 4, 1 + i);
    arr.push({
      dia: dia.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      faturamento: Math.round(v),
    });
  }
  return arr.map((d, i) => ({
    ...d,
    delta: i === 0 ? 0 : d.faturamento - arr[i - 1].faturamento,
  }));
}
