import { supabase, isMockMode } from "../supabase";
import { MOCK_REUNIOES } from "./mockData";

let mockReunioes = [...MOCK_REUNIOES];

export async function listMeetings() {
  if (isMockMode) return mockReunioes;
  const { data, error } = await supabase
    .from("meetings")
    .select("*, participants:meeting_participants(user:profiles(*))")
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createMeeting(payload) {
  if (isMockMode) {
    const m = { id: "r" + Date.now(), ...payload };
    mockReunioes = [...mockReunioes, m];
    return m;
  }
  const { participants, ...rest } = payload;
  const { data, error } = await supabase.from("meetings").insert(rest).select().single();
  if (error) throw error;
  if (participants?.length) {
    await supabase.from("meeting_participants").insert(
      participants.map((uid) => ({ meeting_id: data.id, user_id: uid }))
    );
  }
  return data;
}

export async function deleteMeeting(id) {
  if (isMockMode) {
    mockReunioes = mockReunioes.filter((r) => r.id !== id);
    return;
  }
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw error;
}
