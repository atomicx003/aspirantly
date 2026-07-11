import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_CHAPTERS,
  SUBJECT_ORDER,
  makeChapterKey,
  type SubjectKey,
  type ChapterEntry,
} from "@/lib/syllabus";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { Shield, Search, Plus, Trash2, FileText, Youtube, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

const ADMIN_EMAILS = ["aspirantlyhelpdesk@gmail.com", "atomicxaryan@gmail.com"];


interface LinkRow {
  id: string;
  chapter_key: string;
  kind: "pdf" | "video";
  title: string;
  url: string;
}
interface CustomChapter {
  id: string;
  chapter_key: string;
  name: string;
  subject: string;
  cls: string;
}

function Admin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<SubjectKey | "all">("all");
  const [search, setSearch] = useState("");

  // new chapter form
  const [ncName, setNcName] = useState("");
  const [ncSubject, setNcSubject] = useState<SubjectKey>("Physics");
  const [ncCls, setNcCls] = useState<"11" | "12">("11");

  // Resolve access from the signed-in user's email. `undefined` = still checking.
  const { data: access } = useQuery({
    queryKey: ["admin-access"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email?.toLowerCase() ?? null;
      return { allowed: !!email && ADMIN_EMAILS.includes(email) };
    },
  });
  const allowed = access?.allowed === true;

  useEffect(() => {
    if (access && !access.allowed) navigate({ to: "/dashboard", replace: true });
  }, [access, navigate]);


  const { data: links = [] } = useQuery({
    queryKey: ["chapter-links"],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_links")
        .select("id, chapter_key, kind, title, url")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LinkRow[];
    },
  });

  const { data: custom = [] } = useQuery({
    queryKey: ["custom-chapters"],
    enabled: allowed,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_chapters")
        .select("id, chapter_key, name, subject, cls");
      if (error) throw error;
      return (data ?? []) as CustomChapter[];
    },
  });

  const linksByChapter = useMemo(() => {
    const m = new Map<string, LinkRow[]>();
    links.forEach((l) => {
      const arr = m.get(l.chapter_key) ?? [];
      arr.push(l);
      m.set(l.chapter_key, arr);
    });
    return m;
  }, [links]);

  const chapters: ChapterEntry[] = useMemo(() => {
    const customEntries: ChapterEntry[] = custom.map((c) => ({
      key: c.chapter_key,
      name: c.name,
      subject: c.subject as SubjectKey,
      cls: c.cls as "11" | "12",
    }));
    return [...ALL_CHAPTERS, ...customEntries];
  }, [custom]);

  const filtered = chapters.filter(
    (c) =>
      (subject === "all" || c.subject === subject) &&
      (!search || c.name.toLowerCase().includes(search.toLowerCase())),
  );

  async function createChapter() {
    const name = ncName.trim();
    if (!name) return toast.error("Chapter name required");
    const key = `custom-${makeChapterKey(ncSubject, ncCls, name)}`;
    const { error } = await supabase.from("custom_chapters").insert({
      chapter_key: key,
      name,
      subject: ncSubject,
      cls: ncCls,
    });
    if (error) return toast.error(error.message);
    toast.success("Chapter created");
    setNcName("");
    qc.invalidateQueries({ queryKey: ["custom-chapters"] });
  }

  async function deleteCustomChapter(c: CustomChapter) {
    const { error } = await supabase.from("custom_chapters").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    await supabase.from("chapter_links").delete().eq("chapter_key", c.chapter_key);
    toast.success("Chapter deleted");
    qc.invalidateQueries({ queryKey: ["custom-chapters"] });
    qc.invalidateQueries({ queryKey: ["chapter-links"] });
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

  const customKeys = new Set(custom.map((c) => c.chapter_key));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Resource Manager</h1>
          <p className="text-sm text-muted-foreground">
            Create chapters and attach PDF & YouTube links for all students.
          </p>
        </div>
      </div>

      {/* Create chapter */}
      <section className="glass-card rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Create a chapter</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <Input
            value={ncName}
            onChange={(e) => setNcName(e.target.value)}
            placeholder="Chapter name"
          />
          <Select value={ncSubject} onValueChange={(v) => setNcSubject(v as SubjectKey)}>
            <SelectTrigger className="w-36">
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
          <Select value={ncCls} onValueChange={(v) => setNcCls(v as "11" | "12")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="11">Class 11</SelectItem>
              <SelectItem value="12">Class 12</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={createChapter} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </section>

      {/* Filters */}
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

      <Accordion type="multiple" className="space-y-3">
        {filtered.map((c) => (
          <AccordionItem
            key={c.key}
            value={c.key}
            className="glass-card overflow-hidden rounded-2xl border-none px-4"
          >
            <AccordionTrigger className="text-sm font-semibold">
              <span className="text-left">
                {c.name}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  · {c.subject} · Class {c.cls}
                  {customKeys.has(c.key) && " · custom"}
                </span>
              </span>
              <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
                {(linksByChapter.get(c.key) ?? []).length} links
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ChapterLinks
                chapterKey={c.key}
                links={linksByChapter.get(c.key) ?? []}
                onChanged={() => qc.invalidateQueries({ queryKey: ["chapter-links"] })}
              />
              {customKeys.has(c.key) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3 gap-1 text-destructive"
                  onClick={() => {
                    const cc = custom.find((x) => x.chapter_key === c.key);
                    if (cc) deleteCustomChapter(cc);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete chapter
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function ChapterLinks({
  chapterKey,
  links,
  onChanged,
}: {
  chapterKey: string;
  links: LinkRow[];
  onChanged: () => void;
}) {
  const [kind, setKind] = useState<"pdf" | "video">("pdf");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  async function add() {
    if (!title.trim() || !url.trim()) return toast.error("Title and URL required");
    const { error } = await supabase.from("chapter_links").insert({
      chapter_key: chapterKey,
      kind,
      title: title.trim(),
      url: url.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Link added");
    setTitle("");
    setUrl("");
    onChanged();
  }

  async function update(l: LinkRow, patch: Partial<LinkRow>) {
    const { error } = await supabase
      .from("chapter_links")
      .update(patch)
      .eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChanged();
  }

  async function remove(l: LinkRow) {
    const { error } = await supabase.from("chapter_links").delete().eq("id", l.id);
    if (error) return toast.error(error.message);
    onChanged();
  }

  return (
    <div className="space-y-3">
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((l) => (
            <LinkEditor key={l.id} link={l} onSave={update} onRemove={remove} />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Add resource</p>
        <div className="grid gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
          <Select value={kind} onValueChange={(v) => setKind(v as "pdf" | "video")}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Short Notes)"
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={kind === "pdf" ? "PDF URL" : "YouTube URL"}
          />
          <Button onClick={add} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function LinkEditor({
  link,
  onSave,
  onRemove,
}: {
  link: LinkRow;
  onSave: (l: LinkRow, patch: Partial<LinkRow>) => void;
  onRemove: (l: LinkRow) => void;
}) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const dirty = title !== link.title || url !== link.url;
  const Icon = link.kind === "pdf" ? FileText : Youtube;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/40 p-2">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 w-40 flex-1"
      />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-8 flex-[2]"
      />
      <Button
        size="icon"
        variant="ghost"
        disabled={!dirty}
        onClick={() => onSave(link, { title: title.trim(), url: url.trim() })}
        title="Save"
      >
        <Save className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={() => onRemove(link)} title="Delete">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
