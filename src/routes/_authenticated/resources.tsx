import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_CHAPTERS,
  SUBJECT_META,
  SUBJECT_ORDER,
  type ChapterEntry,
  type SubjectKey,
} from "@/lib/syllabus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Library,
  Search,
  Youtube,
  FileText,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/resources")({
  component: ResourcesPage,
});

interface LinkRow {
  id: string;
  chapter_key: string;
  kind: "pdf" | "video";
  title: string;
  url: string;
}
interface CustomChapter {
  chapter_key: string;
  name: string;
  subject: string;
  cls: string;
}

type Cls = "11" | "12";
type ResType = "video" | "pdf";

const STEP_LABELS = ["Subject", "Class", "Chapter", "Resources"];

function ResourcesPage() {
  const [subject, setSubject] = useState<SubjectKey | null>(null);
  const [cls, setCls] = useState<Cls | null>(null);
  const [chapter, setChapter] = useState<ChapterEntry | null>(null);
  const [resType, setResType] = useState<ResType | null>(null);
  const [search, setSearch] = useState("");

  const { data: links = [] } = useQuery({
    queryKey: ["chapter-links"],
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_chapters")
        .select("chapter_key, name, subject, cls");
      if (error) throw error;
      return (data ?? []) as CustomChapter[];
    },
  });

  const allChapters: ChapterEntry[] = useMemo(() => {
    const customEntries: ChapterEntry[] = custom.map((c) => ({
      key: c.chapter_key,
      name: c.name,
      subject: c.subject as SubjectKey,
      cls: c.cls as Cls,
    }));
    return [...ALL_CHAPTERS, ...customEntries];
  }, [custom]);

  const countByChapter = useMemo(() => {
    const m = new Map<string, { video: number; pdf: number }>();
    links.forEach((l) => {
      const c = m.get(l.chapter_key) ?? { video: 0, pdf: 0 };
      c[l.kind]++;
      m.set(l.chapter_key, c);
    });
    return m;
  }, [links]);

  const step = subject === null ? 0 : cls === null ? 1 : chapter === null ? 2 : 3;

  function goBack() {
    if (resType !== null) return setResType(null);
    if (chapter !== null) return setChapter(null);
    if (cls !== null) return setCls(null);
    if (subject !== null) return setSubject(null);
  }

  const chaptersFor = allChapters
    .filter((c) => c.subject === subject && c.cls === cls)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const chapterLinks = chapter
    ? links.filter((l) => l.chapter_key === chapter.key && l.kind === resType)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Library className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Resource Library</h1>
          <p className="text-sm text-muted-foreground">
            Curated videos & question banks, chapter by chapter.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-black/10 text-[10px]">
                {i + 1}
              </span>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Breadcrumb + Back */}
      {step > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {subject && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground">
                {subject}
              </span>
            )}
            {cls && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground">
                Class {cls}
              </span>
            )}
            {chapter && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 font-medium text-foreground">
                {chapter.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Subject */}
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {SUBJECT_ORDER.map((s) => {
            const meta = SUBJECT_META[s];
            return (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="glass-card group flex items-center gap-4 rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
              >
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-black"
                  style={{
                    background: `color-mix(in oklab, ${meta.color} 18%, transparent)`,
                    color: meta.color,
                  }}
                >
                  {meta.short}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">{s}</p>
                  <p className="text-xs text-muted-foreground">Class 11 & 12 resources</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      )}

      {/* Step 2: Class */}
      {step === 1 && subject && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(["11", "12"] as Cls[]).map((c) => (
            <button
              key={c}
              onClick={() => setCls(c)}
              className="glass-card group flex items-center gap-4 rounded-2xl p-6 text-left transition-transform hover:-translate-y-0.5"
            >
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black"
                style={{
                  background: `color-mix(in oklab, ${SUBJECT_META[subject].color} 18%, transparent)`,
                  color: SUBJECT_META[subject].color,
                }}
              >
                {c}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">Class {c}</p>
                <p className="text-xs text-muted-foreground">{subject} · Class {c}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Chapter */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters…"
            />
          </div>
          {chaptersFor.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No chapters found.
            </p>
          )}
          <div className="space-y-2">
            {chaptersFor.map((c) => {
              const counts = countByChapter.get(c.key) ?? { video: 0, pdf: 0 };
              return (
                <button
                  key={c.key}
                  onClick={() => {
                    setChapter(c);
                    setSearch("");
                  }}
                  className="glass-card group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-secondary/40"
                >
                  <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.name}
                  </span>
                  <span className="hidden gap-2 text-xs text-muted-foreground sm:flex">
                    <span className="flex items-center gap-1">
                      <Youtube className="h-3.5 w-3.5" /> {counts.video}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {counts.pdf}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Resource type + list */}
      {step === 3 && chapter && (
        <div className="space-y-4">
          {resType === null ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <ResTypeCard
                icon={Youtube}
                title="Video Lectures"
                subtitle="Watch concept & problem videos"
                count={(countByChapter.get(chapter.key)?.video) ?? 0}
                color="var(--physics)"
                onClick={() => setResType("video")}
              />
              <ResTypeCard
                icon={FileText}
                title="Question Bank & PYQ"
                subtitle="Practice sheets & past papers"
                count={(countByChapter.get(chapter.key)?.pdf) ?? 0}
                color="var(--maths)"
                onClick={() => setResType("pdf")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {chapterLinks.length === 0 && (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No {resType === "video" ? "videos" : "question banks"} added for this
                    chapter yet. Check back soon!
                  </p>
                </div>
              )}
              {chapterLinks.map((l) => {
                const Icon = l.kind === "video" ? Youtube : FileText;
                return (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-secondary/40"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {l.title}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResTypeCard({
  icon: Icon,
  title,
  subtitle,
  count,
  color,
  onClick,
}: {
  icon: typeof Youtube;
  title: string;
  subtitle: string;
  count: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card group flex items-center gap-4 rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
    >
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
        style={{
          background: `color-mix(in oklab, ${color} 18%, transparent)`,
          color,
        }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold">
        {count}
      </span>
    </button>
  );
}
