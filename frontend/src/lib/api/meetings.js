import { supabase, isMockMode } from "../supabase";
import { MOCK_REUNIOES } from "./mockData";

let mockReunioes = [...MOCK_REUNIOES];

// Normaliza uma reunião do Supabase (colunas em inglês) para o shape PT que a UI consome
// (Reunioes.jsx e CalendarioGeral.jsx leem titulo/data/hora/participantes). Sem isso, em
// modo real (produção) os cards de reunião apareciam em branco e sumiam do calendário.
function normMeeting(row) {
  return {
    id: row.id,
    titulo: row.title ?? row.titulo ?? "",
    data: row.date ?? row.data ?? null,
    hora: row.time ?? row.hora ?? "",
    participantes: (row.participants ?? []).map((p) => p.user?.id).filter(Boolean),
  };
}

export async function listMeetings() {
  if (isMockMode) return mockReunioes;
  const { data, error } = await supabase
    .from("meetings")
    .select("*, participants:meeting_participants(user:profiles(*))")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(normMeeting);
}

export async function createMeeting(payload) {
  if (isMockMode) {
    const m = { id: "r" + Date.now(), ...payload };
    mockReunioes = [...mockReunioes, m];
    return m;
  }
  // Aceita chaves PT (titulo/data/hora/participantes) ou EN e grava nas colunas do banco.
  const participants = payload.participantes ?? payload.participants ?? [];
  const row = {
    title: payload.titulo ?? payload.title,
    date:  payload.data   ?? payload.date,
    time:  payload.hora   ?? payload.time,
  };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  const { data, error } = await supabase.from("meetings").insert(row).select().single();
  if (error) throw error;
  if (participants.length) {
    // Antes este erro era engolido → reunião criada sem participantes, sem aviso.
    const { error: pe } = await supabase.from("meeting_participants").insert(
      participants.map((uid) => ({ meeting_id: data.id, user_id: uid }))
    );
    if (pe) throw pe;
  }
  return normMeeting({ ...data, participants: participants.map((id) => ({ user: { id } })) });
}

export async function deleteMeeting(id) {
  if (isMockMode) {
    mockReunioes = mockReunioes.filter((r) => r.id !== id);
    return;
  }
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw error;
}
