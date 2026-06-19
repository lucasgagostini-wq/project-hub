import React from "react";
import { T, fontDisplay } from "../../lib/theme";
import { Avatar, PageHeader } from "../../components";
import { fmtDiaMes } from "../../lib/utils";

export default function Reunioes({ reunioes = [], userById }) {
  return (
    <div>
      <PageHeader titulo="Reuniões" sub="Encontros agendados da equipe." />
      {reunioes.length === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", color: T.faint, fontSize: 13.5 }}>
          Nenhuma reunião agendada.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reunioes.map((r) => (
          <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18,
            display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center", width: 50 }}>
                <div style={{ fontFamily: fontDisplay, fontSize: 20, fontWeight: 600 }}>{fmtDiaMes(r.data).dia}</div>
                <div style={{ fontSize: 11.5, color: T.faint }}>{fmtDiaMes(r.data).mes}{r.hora ? ` · ${r.hora}` : ""}</div>
              </div>
              <div style={{ width: 1, height: 34, background: T.hair }} />
              <div style={{ fontSize: 14.5, fontWeight: 600, fontFamily: fontDisplay }}>{r.titulo}</div>
            </div>
            <div style={{ display: "flex" }}>
              {(r.participantes || []).map((p, i) => {
                const u = userById?.(p);
                return u ? (
                  <div key={p} style={{ marginLeft: i ? -8 : 0, border: `2px solid ${T.surface}`, borderRadius: 999 }}>
                    <Avatar user={u} size={28} />
                  </div>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
