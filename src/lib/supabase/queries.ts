import { createClient } from "./server";
import type {
  Session,
  Scene,
  Tester,
  Note,
  NoteWithDetails,
  NoteCategory,
} from "@/types";
import { generateInviteToken } from "../utils";

// Session queries
export async function getSessions(): Promise<Session[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createSession(
  name: string,
  buildVersion: string | null,
  sceneNames: string[],
): Promise<Session> {
  const supabase = await createClient();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({ name, build_version: buildVersion })
    .select()
    .single();
  if (sessionError) throw sessionError;

  if (sceneNames.length > 0) {
    const scenes = sceneNames.map((name, index) => ({
      session_id: session.id,
      name,
      order_index: index,
    }));
    const { error: scenesError } = await supabase.from("scenes").insert(scenes);
    if (scenesError) throw scenesError;
  }
  return session;
}

export async function updateSession(
  id: string,
  updates: Partial<Session>,
): Promise<Session> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Scene queries
export async function getScenes(sessionId: string): Promise<Scene[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("session_id", sessionId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Tester queries
export async function getTesters(sessionId: string): Promise<Tester[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testers")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getTesterByToken(token: string): Promise<Tester | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testers")
    .select("*")
    .eq("invite_token", token)
    .single();
  if (error) return null;
  return data;
}

export async function createTester(
  sessionId: string,
  firstName: string,
  lastName: string,
  email?: string,
): Promise<Tester> {
  const supabase = await createClient();
  const inviteToken = generateInviteToken();
  const { data, error } = await supabase
    .from("testers")
    .insert({
      session_id: sessionId,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      invite_token: inviteToken,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Note queries
export async function getNotes(sessionId: string): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getNotesWithDetails(
  sessionId: string,
): Promise<NoteWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(`*, scene:scenes (*), tester:testers (*)`)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createNote(note: {
  session_id: string;
  scene_id: string;
  tester_id: string;
  audio_url?: string;
  raw_transcript?: string;
  category?: NoteCategory;
  auto_classified?: boolean;
}): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateNote(
  id: string,
  updates: Partial<Note>,
): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
