// Troca a service account (JSON em GOOGLE_SERVICE_ACCOUNT_JSON) por um access token OAuth2
// com escopo de leitura do Sheets. JWT RS256 assinado com `crypto` nativo (sem dependência
// pesada como googleapis). Cacheia o token em memória até ~1min antes de expirar.
const crypto = require("crypto");

let cached = { token: null, exp: 0 };

function b64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) { const e = new Error("SHEETS_NOT_CONFIGURED"); e.code = "SHEETS_NOT_CONFIGURED"; throw e; }
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && cached.exp - 60 > now) return cached.token;

  let sa;
  try { sa = JSON.parse(raw); } catch { const e = new Error("BAD_SERVICE_ACCOUNT_JSON"); e.code = "SHEETS_NOT_CONFIGURED"; throw e; }

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key);
  const jwt = `${unsigned}.${b64url(signature)}`;

  let res;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
  } catch { throw new Error("GOOGLE_AUTH_NETWORK"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const e = new Error("GOOGLE_AUTH_FAILED");
    e.detail = JSON.stringify(data).slice(0, 200);
    throw e;
  }
  cached = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return cached.token;
}

module.exports = { getAccessToken, _b64url: b64url };
