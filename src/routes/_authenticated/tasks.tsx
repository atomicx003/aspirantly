import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUBJECT_ORDER, type SubjectKey } from "@/lib/syllabus";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

interface Todo {
  id: string;
  title: string;
  priority: string;
  done: boolean;
}
interface Mistake {
  id: string;
  subject: string;
  chapter: string | null;
  tag: string | null;
  content: string;
  created_at: string;
}

const PRIORITY = {
  high: { label: "High", color: "var(--destructive)" },
  medium: { label: "Medium", color: "var(--streak)" },
  low: { label: "Low", color: "var(--success)" },
} as const;

function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Tasks & Notes</h1>
        <p className="text-sm text-muted-foreground">
          Plan your day and capture every mistake before it repeats.
        </p>
      </div>
      <Tabs defaultValue="todos">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="todos">To-Do List</TabsTrigger>
          <TabsTrigger value="mistakes">Mistake Log</TabsTrigger>
        </TabsList>
        <TabsContent value="todos" className="mt-4">
          <TodoList />
        </TabsContent>
        <TabsContent value="mistakes" className="mt-4">
          <MistakeLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TodoList() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<keyof typeof PRIORITY>("medium");

  const { data: todos = [] } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("done")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Todo[];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("todos")
      .insert({ user_id: u.user.id, title: title.trim(), priority });
    if (error) return toast.error("Could not add task");
    setTitle("");
    qc.invalidateQueries({ queryKey: ["todos"] });
  }

  async function toggle(t: Todo) {
    await supabase.from("todos").update({ done: !t.done }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["todos"] });
  }
  async function remove(id: string) {
    await supabase.from("todos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["todos"] });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="glass-card flex flex-wrap gap-2 rounded-2xl p-4">
        <Input
          className="min-w-[160px] flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as keyof typeof PRIORITY)}>
          <SelectTrigger className="w-32">
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
        <Button type="submit" className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      <div className="space-y-2">
        {todos.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet.</p>
        )}
        {todos.map((t) => {
          const p = PRIORITY[t.priority as keyof typeof PRIORITY] ?? PRIORITY.medium;
          return (
            <div
              key={t.id}
              className="glass-card flex items-center gap-3 rounded-xl px-4 py-3"
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
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{ background: `color-mix(in oklab, ${p.color} 18%, transparent)`, color: p.color }}
              >
                {p.label}
              </span>
              <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MistakeLog() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState<SubjectKey>("Physics");
  const [chapter, setChapter] = useState("");
  const [tag, setTag] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");

  const { data: mistakes = [] } = useQuery({
    queryKey: ["mistakes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mistakes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Mistake[];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("mistakes").insert({
      user_id: u.user.id,
      subject,
      chapter: chapter.trim() || null,
      tag: tag.trim() || null,
      content: content.trim(),
    });
    if (error) return toast.error("Could not save note");
    toast.success("Mistake logged");
    setContent("");
    setChapter("");
    setTag("");
    qc.invalidateQueries({ queryKey: ["mistakes"] });
  }
  async function remove(id: string) {
    await supabase.from("mistakes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["mistakes"] });
  }

  const q = search.toLowerCase();
  const filtered = mistakes.filter(
    (m) =>
      !q ||
      m.chapter?.toLowerCase().includes(q) ||
      m.tag?.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="glass-card space-y-3 rounded-2xl p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <Select value={subject} onValueChange={(v) => setSubject(v as SubjectKey)}>
            <SelectTrigger>
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
          <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter" />
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (e.g. formula)" />
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the mistake or the formula you keep forgetting…"
          rows={4}
        />
        <Button type="submit" className="gap-1">
          <Plus className="h-4 w-4" /> Save note
        </Button>
      </form>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by chapter, tag, subject or text…"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No notes found.</p>
        )}
        {filtered.map((m) => (
          <div key={m.id} className="glass-card rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">
                {m.subject}
              </span>
              {m.chapter && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  {m.chapter}
                </span>
              )}
              {m.tag && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">#{m.tag}</span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto h-7 w-7"
                onClick={() => remove(m.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
