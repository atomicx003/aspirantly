import { supabase } from "@/integrations/supabase/client";

export interface StudySession {
  id: string;
  subject: string;
  duration_seconds: number;
  mode: string;
  studied_on: string;
  created_at: string;
}

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchSessions(): Promise<StudySession[]> {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudySession[];
}

// Streak: consecutive calendar days (up to today) with >= 2h total study
export function computeStreak(sessions: StudySession[]): number {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    byDay.set(s.studied_on, (byDay.get(s.studied_on) ?? 0) + s.duration_seconds);
  }
  const qualifies = (d: string) => (byDay.get(d) ?? 0) >= 2 * 3600;

  const today = new Date();
  const iso = (dt: Date) => dt.toISOString().slice(0, 10);
  let streak = 0;
  const cursor = new Date(today);

  // If today not qualified yet, start from yesterday (don't break streak mid-day)
  if (!qualifies(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (qualifies(iso(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function todaySeconds(sessions: StudySession[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return sessions
    .filter((s) => s.studied_on === today)
    .reduce((a, s) => a + s.duration_seconds, 0);
}

export function totalSeconds(sessions: StudySession[]): number {
  return sessions.reduce((a, s) => a + s.duration_seconds, 0);
}
