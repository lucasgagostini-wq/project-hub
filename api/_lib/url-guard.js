// Validação anti-SSRF leve para URLs fornecidas pelo cliente que o servidor vai buscar
// (clone/snapshot/extract). Bloqueia o óbvio: protocolos não-http(s), credenciais na URL,
// localhost/loopback, ranges privados e o IP de metadados de cloud (169.254.169.254).
//
// LIMITAÇÃO conhecida (follow-up no plano de refatoração): NÃO resolve DNS, então não
// protege contra DNS rebinding (um host público que resolve para um IP interno). A proteção
// completa exige resolver o hostname e validar TODOS os IPs resolvidos, além de seguir
// redirects com `redirect: "manual"` e revalidar o destino.

function isPrivateHost(host) {
  const h = String(host || "").toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  // IPv6 loopback / link-local / unique-local
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const o = m.slice(1).map(Number);
    if (o.some((n) => n > 255)) return true;
    const [a, b] = o;
    if (a === 0 || a === 127 || a === 10) return true;          // this-host / loopback / privado
    if (a === 169 && b === 254) return true;                     // link-local (inclui metadados 169.254.169.254)
    if (a === 192 && b === 168) return true;                     // privado
    if (a === 172 && b >= 16 && b <= 31) return true;            // privado
    if (a >= 224) return true;                                    // multicast / reservado
  }
  return false;
}

function assertPublicHttpUrl(raw) {
  let u;
  try { u = new URL(String(raw)); }
  catch { const e = new Error("URL inválida."); e.status = 400; throw e; }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    const e = new Error("Apenas URLs http(s) são permitidas."); e.status = 400; throw e;
  }
  if (u.username || u.password) {
    const e = new Error("URL com credenciais embutidas não é permitida."); e.status = 400; throw e;
  }
  if (isPrivateHost(u.hostname)) {
    const e = new Error("A URL aponta para um host interno/privado."); e.status = 400; throw e;
  }
  return u;
}

module.exports = { assertPublicHttpUrl, isPrivateHost };
