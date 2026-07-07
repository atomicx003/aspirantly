import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ALL_CHAPTERS, SUBJECT_ORDER, type SubjectKey } from "@/lib/syllabus";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Search, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

interface ResourceRow {
  chapter_key: string;
  notes_url: string | null;
  video_url: string | null;
}

function Admin() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState<SubjectKey | "all">("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { notes: string; video: string }>>({});

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      return !!data?.some((r) => r.role === "admin");
    },
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_resources")
        .select("chapter_key, notes_url, video_url");
      if (error) throw error;
      return (data ?? []) as ResourceRow[];
    },
  });

  const resMap = useMemo(() => {
    const m = new Map<string, ResourceRow>();
    resources.forEach((r) => m.set(r.chapter_key, r));
    return m;
  }, [resources]);

  const filtered = ALL_CHAPTERS.filter(
    (c) =>
      (subject === "all" || c.subject === subject) &&
      (!search || c.name.toLowerCase().includes(search.toLowerCase())),
  );

  function val(key: string, field: "notes" | "video") {
    if (drafts[key]?.[field] !== undefined) return drafts[key][field];
    const r = resMap.get(key);
    return (field === "notes" ? r?.notes_url : r?.video_url) ?? "";
  }
  function setVal(key: string, field: "notes" | "video", value: string) {
    setDrafts((d) => ({
      ...d,
      [key]: {
        notes: field === "notes" ? value : val(key, "notes"),
        video: field === "video" ? value : val(key, "video"),
      },
    }));
  }

  async function save(key: string) {
    const notes = val(key, "notes").trim();
    const video = val(key, "video").trim();
    const { error } = await supabase.from("chapter_resources").upsert(
      {
        chapter_key: key,
        notes_url: notes || null,
        video_url: video || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chapter_key" },
    );
    if (error) return toast.error(error.message);
    toast.success("Resource saved globally");
    qc.invalidateQueries({ queryKey: ["resources"] });
  }

  if (isAdmin === false) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-bold">Admin only</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You need the admin role to manage global resources.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Resource Manager</h1>
          <p className="text-sm text-muted-foreground">
            Paste PDF and YouTube links to assign to chapters for all students.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chapters…"
          />
        </div>
        <Select value={subject} onValueChange={(v) => setSubject(v as SubjectKey | "all")}>
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
        {filtered.map((c) => (
          <div key={c.key} className="glass-card rounded-2xl p-4">
            <p className="text-sm font-semibold">
              {c.name}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                · {c.subject} · Class {c.cls}
              </span>
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Input
                value={val(c.key, "notes")}
                onChange={(e) => setVal(c.key, "notes", e.target.value)}
                placeholder="Short Notes PDF URL"
              />
              <Input
                value={val(c.key, "video")}
                onChange={(e) => setVal(c.key, "video", e.target.value)}
                placeholder="YouTube video URL"
              />
            </div>
            <Button size="sm" className="mt-3 gap-1" onClick={() => save(c.key)}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
