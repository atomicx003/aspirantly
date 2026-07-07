export const EXAMS = [
  { key: "JEE", label: "JEE Main 2027", date: "2027-01-22T09:00:00" },
  { key: "NEET", label: "NEET 2027", date: "2027-05-02T14:00:00" },
] as const;

export function timeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  const clamped = Math.max(0, diff);
  const days = Math.floor(clamped / 86400000);
  const hours = Math.floor((clamped % 86400000) / 3600000);
  const minutes = Math.floor((clamped % 3600000) / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  return { days, hours, minutes, seconds, over: diff <= 0 };
}

export function fmtDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtHours(totalSeconds: number) {
  return (totalSeconds / 3600).toFixed(1);
}
