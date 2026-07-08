import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECT_ORDER } from "@/lib/syllabus";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageCircleQuestion,
  ImagePlus,
  Camera,
  X,
  Send,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/doubts")({
  component: DoubtsPage,
});

interface DoubtRow {
  id: string;
  user_id: string;
  subject: string;
  chapter: string | null;
  title: string;
  body: string;
  image_url: string | null;
  resolved: boolean;
  created_at: string;
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function DoubtsPage() {
  const qc = useQueryClient();
  const [uid, setUid] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECT_ORDER[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    currentUserId().then(setUid);
  }, []);

  const { data: doubts = [] } = useQuery({
    queryKey: ["doubts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doubts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DoubtRow[];
    },
  });

  function onPick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("Please choose an image");
    if (f.size > 8 * 1024 * 1024) return toast.error("Image must be under 8MB");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearImage() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  async function post() {
    const id = uid ?? (await currentUserId());
    if (!id) return;
    if (!title.trim()) return toast.error("Add a title");
    if (!body.trim()) return toast.error("Describe your doubt");
    setPosting(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("doubt-images")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        imagePath = path;
      }
      const { error } = await supabase.from("doubts").insert({
        user_id: id,
        subject,
        title: title.trim(),
        body: body.trim(),
        image_url: imagePath,
      });
      if (error) throw error;
      toast.success("Doubt posted");
      setTitle("");
      setBody("");
      clearImage();
      qc.invalidateQueries({ queryKey: ["doubts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post doubt");
    } finally {
      setPosting(false);
    }
  }

  async function toggleResolved(d: DoubtRow) {
    const { error } = await supabase
      .from("doubts")
      .update({ resolved: !d.resolved })
      .eq("id", d.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  async function remove(d: DoubtRow) {
    const { error } = await supabase.from("doubts").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    if (d.image_url) {
      await supabase.storage.from("doubt-images").remove([d.image_url]);
    }
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageCircleQuestion className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Doubts Forum</h1>
          <p className="text-sm text-muted-foreground">
            Ask questions, attach a photo, and help fellow aspirants.
          </p>
        </div>
      </div>

      {/* Composer */}
      <section className="glass-card space-y-3 rounded-2xl p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
            placeholder="Doubt title…"
          />
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full sm:w-40">
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
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Explain your doubt in detail…"
          rows={3}
        />

        {preview && (
          <div className="relative w-fit">
            <img
              src={preview}
              alt="Preview"
              className="max-h-52 rounded-xl border border-border"
            />
            <button
              onClick={clearImage}
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" /> Attach
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="h-4 w-4" /> Camera
          </Button>
          <Button onClick={post} disabled={posting} className="ml-auto gap-1">
            <Send className="h-4 w-4" /> {posting ? "Posting…" : "Post doubt"}
          </Button>
        </div>
      </section>

      {/* Feed */}
      <div className="space-y-4">
        {doubts.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No doubts yet. Be the first to ask!
          </p>
        )}
        {doubts.map((d) => (
          <DoubtCard
            key={d.id}
            doubt={d}
            uid={uid}
            onToggleResolved={() => toggleResolved(d)}
            onDelete={() => remove(d)}
          />
        ))}
      </div>
    </div>
  );
}

interface AnswerRow {
  id: string;
  doubt_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

function DoubtCard({
  doubt,
  uid,
  onToggleResolved,
  onDelete,
}: {
  doubt: DoubtRow;
  uid: string | null;
  onToggleResolved: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (doubt.image_url) {
      supabase.storage
        .from("doubt-images")
        .createSignedUrl(doubt.image_url, 3600)
        .then(({ data }) => {
          if (active) setSignedUrl(data?.signedUrl ?? null);
        });
    }
    return () => {
      active = false;
    };
  }, [doubt.image_url]);

  const { data: answers = [] } = useQuery({
    queryKey: ["answers", doubt.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doubt_answers")
        .select("*")
        .eq("doubt_id", doubt.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AnswerRow[];
    },
  });

  const { data: names = {} } = useQuery({
    queryKey: ["names", doubt.id, answers.length, doubt.user_id],
    queryFn: async () => {
      const ids = Array.from(
        new Set([doubt.user_id, ...answers.map((a) => a.user_id)]),
      );
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p) => (map[p.id] = p.display_name));
      return map;
    },
  });

  async function sendReply() {
    const id = uid;
    if (!id) return;
    if (!reply.trim()) return;
    const { error } = await supabase.from("doubt_answers").insert({
      doubt_id: doubt.id,
      user_id: id,
      body: reply.trim(),
    });
    if (error) return toast.error(error.message);
    setReply("");
    qc.invalidateQueries({ queryKey: ["answers", doubt.id] });
  }

  return (
    <article className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {doubt.subject}
            </span>
            {doubt.resolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                <CheckCircle2 className="h-3 w-3" /> Resolved
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-base font-bold">{doubt.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            by {names[doubt.user_id] ?? "Aspirant"}
          </p>
        </div>
        {uid === doubt.user_id && (
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" onClick={onToggleResolved} title="Toggle resolved">
              <CheckCircle2
                className={doubt.resolved ? "h-4 w-4 text-success" : "h-4 w-4"}
              />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{doubt.body}</p>

      {signedUrl && (
        <a href={signedUrl} target="_blank" rel="noreferrer">
          <img
            src={signedUrl}
            alt="Doubt attachment"
            className="mt-3 max-h-80 rounded-xl border border-border"
          />
        </a>
      )}

      {/* Thread */}
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {answers.map((a) => (
          <div key={a.id} className="flex gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {(names[a.user_id] ?? "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="rounded-xl bg-secondary/50 px-3 py-2">
              <p className="text-xs font-semibold">{names[a.user_id] ?? "Aspirant"}</p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">{a.body}</p>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendReply()}
            placeholder="Write a reply…"
            maxLength={1000}
          />
          <Button size="icon" onClick={sendReply} title="Reply">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
