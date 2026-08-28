/**
 * Cofre — cifra e decifra no NAVEGADOR, com senha-mestra que nunca sai daqui.
 *
 * Por que assim: o banco do Hub tem RLS liberado pra chave anônima
 * (lib/supabase.js) e essa chave vai no bundle. Quem obtiver a chave lê todas
 * as tabelas. Guardar senha de conta de anúncio, gateway e domínio em texto
 * puro nesse banco seria entregar a operação inteira junto com a chave — o
 * mesmo estrago do infostealer de 22/08/2026, só que servido de bandeja.
 *
 * O que o banco guarda: `salt`, `iv` e o texto cifrado. Sem a senha-mestra,
 * isso é ruído. Nem o Supabase, nem a Vercel, nem eu conseguimos ler.
 *
 * AES-GCM 256 (autenticado: senha errada não devolve lixo, devolve erro) com
 * chave derivada por PBKDF2-SHA256, 310.000 iterações — o piso recomendado
 * pelo OWASP para PBKDF2-HMAC-SHA256.
 *
 * ⚠️ Perdeu a senha-mestra, perdeu o conteúdo. É o preço de o servidor não
 * poder ler: não existe "esqueci minha senha" aqui.
 */

const ITERACOES = 310000;
const ALGO = "AES-GCM";

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s);
}

function deB64(texto) {
  const bin = atob(texto);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function subtle() {
  const c = globalThis.crypto;
  // Sem HTTPS (ou em navegador antigo) não existe WebCrypto — melhor falhar
  // alto do que cair num "cifrado" de mentira.
  if (!c || !c.subtle) throw new Error("Este navegador não expõe criptografia segura (WebCrypto).");
  return c.subtle;
}

async function derivarChave(senhaMestra, salt) {
  const base = await subtle().importKey("raw", enc.encode(senhaMestra), "PBKDF2", false, ["deriveKey"]);
  return subtle().deriveKey(
    { name: "PBKDF2", salt, iterations: ITERACOES, hash: "SHA-256" },
    base,
    { name: ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * @returns {{cifrado: string, salt: string, iv: string}} tudo em base64,
 *          pronto pra ir pro banco.
 */
export async function cifrar(texto, senhaMestra) {
  if (!senhaMestra) throw new Error("Sem senha-mestra não dá pra guardar.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const chave = await derivarChave(senhaMestra, salt);
  const bruto = await subtle().encrypt({ name: ALGO, iv }, chave, enc.encode(String(texto)));
  return { cifrado: b64(bruto), salt: b64(salt), iv: b64(iv) };
}

/**
 * Devolve o texto claro. Senha errada estoura — o AES-GCM autentica, então
 * não existe "decifrou errado e ninguém percebeu".
 */
export async function decifrar({ cifrado, salt, iv }, senhaMestra) {
  if (!senhaMestra) throw new Error("Sem senha-mestra não dá pra abrir.");
  const chave = await derivarChave(senhaMestra, deB64(salt));
  try {
    const bruto = await subtle().decrypt({ name: ALGO, iv: deB64(iv) }, chave, deB64(cifrado));
    return dec.decode(bruto);
  } catch {
    throw new Error("Senha-mestra incorreta.");
  }
}

/**
 * Prova de que a senha-mestra é a mesma usada antes, sem guardar a senha.
 * Cifra uma frase conhecida; quem souber a senha decifra e confere.
 */
export const FRASE_CANARIO = "cofre-project-hub";

export async function criarCanario(senhaMestra) {
  return cifrar(FRASE_CANARIO, senhaMestra);
}

export async function conferirCanario(canario, senhaMestra) {
  try {
    return (await decifrar(canario, senhaMestra)) === FRASE_CANARIO;
  } catch {
    return false;
  }
}

/**
 * A senha-mestra vive só em memória, nesta aba, enquanto ela estiver aberta.
 * Nada de localStorage: o que fica gravado no navegador é exatamente o que um
 * infostealer leva.
 */
let senhaEmMemoria = null;
export const guardarSenhaNaSessao = (s) => { senhaEmMemoria = s || null; };
export const senhaDaSessao = () => senhaEmMemoria;
export const esquecerSenha = () => { senhaEmMemoria = null; };
