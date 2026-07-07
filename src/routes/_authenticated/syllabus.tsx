import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  SYLLABUS,
  SUBJECT_ORDER,
  SUBJECT_META,
  chaptersForSubject,
  type SubjectKey,
} from "@/lib/syllabus";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, Youtube } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/syllabus")({
  component: Syllabus,
});

interface ProgressRow {
  chapter_key: string;
  theory_done: boolean;
  dpp_done: boolean;
}
interface ResourceRow {
  chapter_key: string;
  notes_url: string | null;
  video_url: string | null;
}

function Syllabus() {
  const qc = useQueryClient();

  const { data: progress = [] } = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chapter_progress")
        .select("chapter_key, theory_done, dpp_done");
      if (error) throw error;
      return (data ?? []) as ProgressRow[];
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

  const progMap = useMemo(() => {
    const m = new Map<string, ProgressRow>();
    progress.forEach((p) => m.set(p.chapter_key, p));
    return m;
  }, [progress]);

  const resMap = useMemo(() => {
    const m = new Map<string, ResourceRow>();
    resources.forEach((r) => m.set(r.chapter_key, r));
    return m;
  }, [resources]);

  async function toggle(key: string, field: "theory_done" | "dpp_done", value: boolean) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const existing = progMap.get(key);
    const row = {
      user_id: u.user.id,
      chapter_key: key,
      theory_done: field === "theory_done" ? value : (existing?.theory_done ?? false),
      dpp_done: field === "dpp_done" ? value : (existing?.dpp_done ?? false),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("chapter_progress")
      .upsert(row, { onConflict: "user_id,chapter_key" });
    if (error) {
      toast.error("Could not save");
      return;
    }
    qc.invalidateQueries({ queryKey: ["progress"] });
  }

  function subjectPct(subject: SubjectKey) {
    const chs = chaptersForSubject(subject);
    const totalUnits = chs.length * 2;
    let done = 0;
    chs.forEach((c) => {
      const p = progMap.get(c.key);
      if (p?.theory_done) done++;
      if (p?.dpp_done) done++;
    });
    return totalUnits ? Math.round((done / totalUnits) * 100) : 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Syllabus Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Tick off theory and practice for every chapter. Progress saves instantly.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUBJECT_ORDER.map((s) => {
          const pct = subjectPct(s);
          return (
            <div key={s} className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: SUBJECT_META[s].color }}>
                  {s}
                </span>
                <span className="text-sm font-black">{pct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: SUBJECT_META[s].color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {SUBJECT_ORDER.map((subject) => (
        <div key={subject} className="glass-card rounded-2xl p-4">
          <h2
            className="mb-2 px-1 text-lg font-black"
            style={{ color: SUBJECT_META[subject].color }}
          >
            {subject}
          </h2>
          <Accordion type="multiple">
            {SYLLABUS.filter((g) => g.subject === subject).map((g) => (
              <AccordionItem key={g.cls} value={`${subject}-${g.cls}`}>
                <AccordionTrigger className="text-sm font-semibold">
                  Class {g.cls}
                  <span className="ml-auto mr-2 text-xs font-normal text-muted-foreground">
                    {g.chapters.length} chapters
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {g.chapters.map((c) => {
                      const p = progMap.get(c.key);
                      const res = resMap.get(c.key);
                      return (
                        <div
                          key={c.key}
                          className="rounded-xl border border-border bg-secondary/40 p-3"
                        >
                          <p className="text-sm font-medium">{c.name}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <label className="flex cursor-pointer items-center gap-2 text-xs">
                              <Checkbox
                                checked={!!p?.theory_done}
                                onCheckedChange={(v) =>
                                  toggle(c.key, "theory_done", !!v)
                                }
                              />
                              Theory & Concepts
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-xs">
                              <Checkbox
                                checked={!!p?.dpp_done}
                                onCheckedChange={(v) => toggle(c.key, "dpp_done", !!v)}
                              />
                              DPP & PYQs
                            </label>
                            <div className="ml-auto flex gap-2">
                              <ResLink
                                url={res?.notes_url}
                                icon={FileText}
                                label="Notes PDF"
                              />
                              <ResLink
                                url={res?.video_url}
                                icon={Youtube}
                                label="Video"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  );
}

function ResLink({
  url,
  icon: Icon,
  label,
}: {
  url: string | null | undefined;
  icon: typeof FileText;
  label: string;
}) {
  if (!url)
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground/60">
        <Icon className="h-3 w-3" /> {label}
      </span>
    );
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
    >
      <Icon className="h-3 w-3" /> {label}
    </a>
  );
}
