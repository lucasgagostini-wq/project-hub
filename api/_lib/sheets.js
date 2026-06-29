// Lê uma aba inteira via Sheets API e parseia as linhas em totais por dia, conforme o mapa
// de colunas (map = { date, spend, impressions, clicks, conversions } -> nomes de cabeçalho).
const { getAccessToken } = require("./google-auth.js");

async function fetchSheetValues(sheetId, tab) {
  const token = await getAccessToken();
  const range = encodeURIComponent(tab);
  // UNFORMATTED_VALUE: números vêm crus (sem separador de milhar do locale, que tornaria
  // "1.000" ambíguo). FORMATTED_STRING nas datas: datas vêm como texto legível (não serial).
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
  let res;
  try { res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); }
  catch { throw new Error("SHEETS_NETWORK"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error("SHEETS_READ_FAILED"); e.status = res.status;
    e.detail = (data.error && data.error.message ? data.error.message : "").slice(0, 200);
    throw e;
  }
  return data.values || [];
}

// Converte número cru ou texto BR/US ("1.234,56" | "1,234.56" | "R$ 10") em número; inválido -> 0.
// Com UNFORMATTED_VALUE quase sempre chega número cru; este parse cobre células de texto.
function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  let s = String(v == null ? "" : v).replace(/[^\d.,-]/g, "");
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // ambos presentes: o ÚLTIMO separador é o decimal; o outro é separador de milhar.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");  // BR: 1.234,56
    else s = s.replace(/,/g, "");                                          // US: 1,234.56
  } else if (lastComma > -1) {
    s = s.replace(",", ".");  // só vírgula -> decimal
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// values: matriz da planilha. map: nomes de coluna. headerRow: linha do cabeçalho (1-based).
// Retorna { rows: [{date, ad_spend, impressions, clicks, conversions}], skipped, error }.
function parseRows(values, map, headerRow = 1) {
  if (!values || values.length < headerRow) return { rows: [], skipped: 0, error: "EMPTY" };
  const header = (values[headerRow - 1] || []).map((h) => String(h).trim());
  const col = {};
  for (const key of ["date", "spend", "impressions", "clicks", "conversions"]) {
    col[key] = map[key] ? header.indexOf(map[key]) : -1;
  }
  if (col.date < 0) return { rows: [], skipped: 0, error: "MISSING_DATE_COLUMN" };
  if (col.spend < 0) return { rows: [], skipped: 0, error: "MISSING_SPEND_COLUMN" };

  const byDay = {};
  let skipped = 0;
  for (let i = headerRow; i < values.length; i++) {
    const r = values[i];
    if (!r || r.length === 0) continue;
    const dRaw = String(r[col.date] == null ? "" : r[col.date]).trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dRaw);
    const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dRaw);
    let date = null;
    if (iso) date = `${iso[1]}-${iso[2]}-${iso[3]}`;
    else if (br) date = `${br[3]}-${br[2]}-${br[1]}`;
    if (!date) { skipped++; continue; }
    const cur = byDay[date] || { date, ad_spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    cur.ad_spend += num(r[col.spend]);
    if (col.impressions >= 0) cur.impressions += Math.round(num(r[col.impressions]));
    if (col.clicks >= 0) cur.clicks += Math.round(num(r[col.clicks]));
    if (col.conversions >= 0) cur.conversions += num(r[col.conversions]);
    byDay[date] = cur;
  }
  return { rows: Object.values(byDay), skipped, error: null };
}

module.exports = { fetchSheetValues, parseRows, _num: num };
