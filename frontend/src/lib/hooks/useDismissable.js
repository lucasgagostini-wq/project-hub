import { useEffect, useRef } from "react";

// Fecha um popover/menu ao clicar fora dele OU apertar Esc. Retorna um ref que deve ser
// colocado no container do popover (o toggle pode ficar dentro do mesmo container para
// não disparar o fechamento ao reabrir). Listeners só são registrados quando open=true.
// Resolve o bug de menus (trocar perfil) que ficavam abertos ao clicar em qualquer lugar.
export function useDismissable(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

// Só Esc — para modais que já fecham no clique do backdrop e só precisam do atalho.
export function useEscape(active, onEsc) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === "Escape") onEsc(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onEsc]);
}
