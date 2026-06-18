export function notifySuportado() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notifyStatus() {
  return notifySuportado() ? Notification.permission : "unsupported";
}

export async function pedirPermissaoNotify() {
  if (!notifySuportado()) return "unsupported";
  try { return await Notification.requestPermission(); } catch { return "denied"; }
}

export function avisarConcluido(titulo, corpo) {
  if (!notifySuportado() || Notification.permission !== "granted") return;
  if (!document.hidden) return;
  try {
    const n = new Notification(titulo, { body: corpo, icon: "/favicon.ico" });
    n.onclick = () => { window.focus(); n.close(); };
  } catch (_) {}
}
