import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Search,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Send,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/doubts")({
  component: DoubtsPage,
});

interface Profile {
  display_name: string | null;
}
interface Answer {
  id: string;
  doubt_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: Profile | null;
}
interface Doubt {
  id: string;
  user_id: string;
  subject: string;
  chapter: string | null;
  title: string;
  body: string;
  resolved: boolean;
  created_at: string;
  profiles: Profile | null;
  doubt_answers: { count: number }[];
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function DoubtsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState<SubjectKey>("Physics");
  const [chapter, setChapter] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SubjectKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const { data: doubts = [] } = useQuery({
    queryKey: ["doubts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doubts")
        .select(
          "*, profiles(display_name), doubt_answers(count)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Doubt[];
    },
  });

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("doubts").insert({
      user_id: u.user.id,
      subject,
      chapter: chapter.trim() || null,
      title: title.trim(),
      body: body.trim(),
    });
    if (error) return toast.error("Could not post doubt");
    toast.success("Doubt posted!");
    setTitle("");
    setBody("");
    setChapter("");
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  async function remove(id: string) {
    await supabase.from("doubts").delete().eq("id", id);
    if (openId === id) setOpenId(null);
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  async function toggleResolved(d: Doubt) {
    await supabase.from("doubts").update({ resolved: !d.resolved }).eq("id", d.id);
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  const q = search.toLowerCase();
  const filtered = doubts.filter((d) => {
    if (filter !== "all" && d.subject !== filter) return false;
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.body.toLowerCase().includes(q) ||
      d.chapter?.toLowerCase().includes(q) ||
      d.subject.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Doubt Corner</h1>
        <p className="text-sm text-muted-foreground">
          Stuck on a problem? Post it and let the community help you crack it.
        </p>
      </div>

      <form onSubmit={ask} className="glass-card space-y-3 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-accent">
          <HelpCircle className="h-4 w-4" /> Ask a doubt
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Question title (e.g. Why is friction static here?)"
        />
        <div className="grid gap-2 sm:grid-cols-2">
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
          <Input
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="Chapter (optional)"
          />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your doubt in detail…"
          rows={4}
        />
        <Button type="submit" className="gap-1">
          <Plus className="h-4 w-4" /> Post doubt
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doubts…"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as "all" | SubjectKey)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {SUBJECT_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No doubts here yet. Be the first to ask!
          </p>
        )}
        {filtered.map((d) => {
          const count = d.doubt_answers?.[0]?.count ?? 0;
          const isOpen = openId === d.id;
          return (
            <div key={d.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">
                      {d.subject}
                    </span>
                    {d.chapter && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        {d.chapter}
                      </span>
                    )}
                    {d.resolved && (
                      <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-semibold text-success">
                        <CheckCircle2 className="h-3 w-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold leading-snug">{d.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {d.body}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {d.profiles?.display_name ?? "Aspirant"}
                    </span>
                    <span>·</span>
                    <span>{timeAgo(d.created_at)}</span>
                  </div>
                </div>
                {me === d.user_id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => remove(d.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  onClick={() => setOpenId(isOpen ? null : d.id)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {count} {count === 1 ? "answer" : "answers"}
                </Button>
                {me === d.user_id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn("gap-1.5", d.resolved && "text-success")}
                    onClick={() => toggleResolved(d)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {d.resolved ? "Mark unresolved" : "Mark resolved"}
                  </Button>
                )}
              </div>

              {isOpen && <Answers doubtId={d.id} me={me ?? null} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Answers({ doubtId, me }: { doubtId: string; me: string | null }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: answers = [] } = useQuery({
    queryKey: ["answers", doubtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doubt_answers")
        .select("*, profiles(display_name)")
        .eq("doubt_id", doubtId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Answer[];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("doubt_answers").insert({
      doubt_id: doubtId,
      user_id: u.user.id,
      body: text.trim(),
    });
    if (error) return toast.error("Could not post answer");
    setText("");
    qc.invalidateQueries({ queryKey: ["answers", doubtId] });
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  async function remove(id: string) {
    await supabase.from("doubt_answers").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["answers", doubtId] });
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-secondary/40 p-3">
      {answers.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          No answers yet — help them out!
        </p>
      )}
      {answers.map((a) => (
        <div key={a.id} className="rounded-lg bg-background/60 p-3">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm">{a.body}</p>
            {me === a.user_id && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => remove(a.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-medium text-accent">
              {a.profiles?.display_name ?? "Aspirant"}
            </span>
            <span>·</span>
            <span>{timeAgo(a.created_at)}</span>
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a helpful answer…"
          rows={2}
          className="flex-1"
        />
        <Button type="submit" size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
