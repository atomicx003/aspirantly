import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECT_ORDER, type SubjectKey } from "@/lib/syllabus";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

interface Todo {
  id: string;
  title: string;
  priority: string;
  done: boolean;
  due_on: string | null;
}
interface Session {
  id: string;
  subject: string;
  duration_seconds: number;
  studied_on: string;
}

const iso = (d: Date) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function fmtHrs(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const monthStart = iso(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const monthEnd = iso(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));

  const { data: todos = [] } = useQuery({
    queryKey: ["cal-todos", monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("id, title, priority, done, due_on")
        .gte("due_on", monthStart)
        .lte("due_on", monthEnd);
      if (error) throw error;
      return (data ?? []) as Todo[];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["cal-sessions", monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("id, subject, duration_seconds, studied_on")
        .gte("studied_on", monthStart)
        .lte("studied_on", monthEnd);
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });

  const secondsByDay = useMemo(() => {
    const m = new Map<string, number>();
    sessions.forEach((s) =>
      m.set(s.studied_on, (m.get(s.studied_on) ?? 0) + s.duration_seconds),
    );
    return m;
  }, [sessions]);

  const todosByDay = useMemo(() => {
    const m = new Map<string, Todo[]>();
    todos.forEach((t) => {
      if (!t.due_on) return;
      const arr = m.get(t.due_on) ?? [];
      arr.push(t);
      m.set(t.due_on, arr);
    });
    return m;
  }, [todos]);

  // Build grid
  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayIso = iso(today);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Plan tasks and track your study log day by day.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
              }
            >
              Today
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-1 text-center text-[11px] font-semibold text-muted-foreground"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} />;
            const key = iso(cell);
            const secs = secondsByDay.get(key) ?? 0;
            const dayTodos = todosByDay.get(key) ?? [];
            const isToday = key === todayIso;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className={cn(
                  "flex min-h-[64px] flex-col gap-1 rounded-xl border border-border/60 p-1.5 text-left transition-colors hover:bg-secondary/50 sm:min-h-[84px]",
                  isToday && "border-primary/70 bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold",
                    isToday ? "text-primary" : "text-foreground",
                  )}
                >
                  {cell.getDate()}
                </span>
                <div className="flex flex-1 flex-col justify-end gap-0.5">
                  {secs > 0 && (
                    <span className="truncate rounded bg-[color-mix(in_oklab,var(--success)_18%,transparent)] px-1 py-0.5 text-[9px] font-bold text-[var(--success)]">
                      {fmtHrs(secs)}
                    </span>
                  )}
                  {dayTodos.length > 0 && (
                    <span className="truncate rounded bg-primary/15 px-1 py-0.5 text-[9px] font-bold text-primary">
                      {dayTodos.filter((t) => t.done).length}/{dayTodos.length} tasks
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <DayDialog
        dateIso={selected}
        onClose={() => setSelected(null)}
        todos={selected ? (todosByDay.get(selected) ?? []) : []}
        seconds={selected ? (secondsByDay.get(selected) ?? 0) : 0}
        daySessions={sessions.filter((s) => s.studied_on === selected)}
      />
    </div>
  );
}

const PRIORITY = {
  high: { label: "High", color: "var(--destructive)" },
  medium: { label: "Medium", color: "var(--streak)" },
  low: { label: "Low", color: "var(--success)" },
} as const;

function DayDialog({
  dateIso,
  onClose,
  todos,
  seconds,
  daySessions,
}: {
  dateIso: string | null;
  onClose: () => void;
  todos: Todo[];
  seconds: number;
  daySessions: Session[];
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<keyof typeof PRIORITY>("medium");
  const [logSubject, setLogSubject] = useState<SubjectKey>("Physics");
  const [logMinutes, setLogMinutes] = useState("");

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["cal-todos"] });
    qc.invalidateQueries({ queryKey: ["cal-sessions"] });
    qc.invalidateQueries({ queryKey: ["todos"] });
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dateIso) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("todos").insert({
      user_id: u.user.id,
      title: title.trim(),
      priority,
      due_on: dateIso,
    });
    if (error) return toast.error("Could not add task");
    setTitle("");
    invalidate();
  }

  async function toggle(t: Todo) {
    await supabase.from("todos").update({ done: !t.done }).eq("id", t.id);
    invalidate();
  }
  async function removeTodo(id: string) {
    await supabase.from("todos").delete().eq("id", id);
    invalidate();
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(logMinutes, 10);
    if (!mins || mins <= 0 || !dateIso) return toast.error("Enter minutes studied");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("study_sessions").insert({
      user_id: u.user.id,
      subject: logSubject,
      duration_seconds: mins * 60,
      mode: "manual",
      studied_on: dateIso,
    });
    if (error) return toast.error("Could not log study time");
    setLogMinutes("");
    toast.success("Study time logged");
    invalidate();
  }

  const dateLabel = dateIso
    ? new Date(dateIso + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Dialog open={!!dateIso} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dateLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Study log */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                <Clock className="h-4 w-4 text-[var(--success)]" /> Study Log
              </h3>
              <span className="text-sm font-bold text-[var(--success)]">
                {fmtHrs(seconds)}
              </span>
            </div>
            {daySessions.length > 0 && (
              <div className="mb-2 space-y-1">
                {daySessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-1.5 text-xs"
                  >
                    <span>{s.subject}</span>
                    <span className="font-semibold">{fmtHrs(s.duration_seconds)}</span>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={addLog} className="flex flex-wrap gap-2">
              <Select
                value={logSubject}
                onValueChange={(v) => setLogSubject(v as SubjectKey)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={logMinutes}
                onChange={(e) => setLogMinutes(e.target.value)}
                placeholder="Mins"
              />
              <Button type="submit" size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Log
              </Button>
            </form>
          </section>

          {/* To-do */}
          <section>
            <h3 className="mb-2 text-sm font-bold">To-Do</h3>
            <div className="mb-2 space-y-1.5">
              {todos.length === 0 && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No tasks for this day.
                </p>
              )}
              {todos.map((t) => {
                const p = PRIORITY[t.priority as keyof typeof PRIORITY] ?? PRIORITY.medium;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2"
                  >
                    <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        t.done && "text-muted-foreground line-through",
                      )}
                    >
                      {t.title}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        background: `color-mix(in oklab, ${p.color} 18%, transparent)`,
                        color: p.color,
                      }}
                    >
                      {p.label}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeTodo(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
            <form onSubmit={addTodo} className="flex flex-wrap gap-2">
              <Input
                className="min-w-[120px] flex-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a task…"
              />
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as keyof typeof PRIORITY)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
