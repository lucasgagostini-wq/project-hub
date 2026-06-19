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

// Abreviações de mês em pt-BR (índice 0 = janeiro).
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Formata uma data ("YYYY-MM-DD", ISO completa ou Date) em { dia, mes } abreviado.
// Por que existe: o calendário e a lista de reuniões extraíam o dia com `.slice(8,10)`
// e fixavam o mês em "mai" — então qualquer data fora de maio mostrava o mês errado.
// O parse manual de "YYYY-MM-DD" evita o deslocamento de fuso (new Date("2025-06-01")
// vira meia-noite UTC e, em UTC-3, exibiria 31/mai).
export function fmtDiaMes(data) {
  if (!data) return { dia: "--", mes: "" };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data));
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(data);
  if (isNaN(d.getTime())) return { dia: "--", mes: "" };
  return { dia: String(d.getDate()).padStart(2, "0"), mes: MESES_ABREV[d.getMonth()] };
}
