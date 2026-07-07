import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDuration } from "@/lib/config";
import { SUBJECT_ORDER, SUBJECT_META, type SubjectKey } from "@/lib/syllabus";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/timer")({
  component: TimerPage,
});

const PRESETS = [
  { label: "Pomodoro", mins: 25 },
  { label: "Deep Block", mins: 50 },
  { label: "Sprint", mins: 15 },
];

function SubjectPicker({
  value,
  onChange,
}: {
  value: SubjectKey;
  onChange: (s: SubjectKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SUBJECT_ORDER.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all",
            value === s
              ? "border-transparent text-background"
              : "border-border bg-secondary text-muted-foreground hover:text-foreground",
          )}
          style={value === s ? { background: SUBJECT_META[s].color } : undefined}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

async function saveSession(subject: string, seconds: number, mode: string) {
  if (seconds < 5) {
    toast.info("Session too short to log.");
    return false;
  }
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { error } = await supabase.from("study_sessions").insert({
    user_id: u.user.id,
    subject,
    duration_seconds: Math.round(seconds),
    mode,
  });
  if (error) {
    toast.error("Could not save session");
    return false;
  }
  toast.success(`Logged ${(seconds / 60).toFixed(0)} min of ${subject} 🔥`);
  return true;
}

function Stopwatch({ subject }: { subject: SubjectKey }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  async function stop() {
    setRunning(false);
    const ok = await saveSession(subject, elapsed, "stopwatch");
    if (ok) qc.invalidateQueries({ queryKey: ["sessions"] });
    setElapsed(0);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <div className="font-mono text-6xl font-black tabular-nums text-primary text-glow sm:text-7xl">
        {fmtDuration(elapsed)}
      </div>
      <div className="flex gap-3">
        <Button size="lg" onClick={() => setRunning((r) => !r)} className="gap-2">
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? "Pause" : elapsed ? "Resume" : "Start"}
        </Button>
        <Button size="lg" variant="destructive" onClick={stop} disabled={!elapsed}>
          <Square className="h-5 w-5" /> Stop & Save
        </Button>
      </div>
    </div>
  );
}

function CountdownTimer({ subject }: { subject: SubjectKey }) {
  const [target, setTarget] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState("30");
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (running && remaining > 0) {
      ref.current = setInterval(() => setRemaining((r) => r - 1), 1000);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, remaining]);

  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      void saveSession(subject, target, "countdown").then((ok) => {
        if (ok) qc.invalidateQueries({ queryKey: ["sessions"] });
      });
    }
  }, [remaining, running, subject, target, qc]);

  function setPreset(mins: number) {
    setRunning(false);
    setTarget(mins * 60);
    setRemaining(mins * 60);
  }

  async function stopEarly() {
    setRunning(false);
    const studied = target - remaining;
    const ok = await saveSession(subject, studied, "countdown");
    if (ok) qc.invalidateQueries({ queryKey: ["sessions"] });
    setRemaining(target);
  }

  const pct = ((target - remaining) / target) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant={target === p.mins * 60 ? "default" : "secondary"}
            size="sm"
            onClick={() => setPreset(p.mins)}
          >
            {p.label} · {p.mins}m
          </Button>
        ))}
        <div className="flex items-center gap-2">
          <Input
            className="w-20"
            type="number"
            min={1}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={() => setPreset(Number(custom) || 1)}>
            Set
          </Button>
        </div>
      </div>

      <div className="relative grid h-56 w-56 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--secondary)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--timer)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="text-center">
          <div className="font-mono text-4xl font-black tabular-nums text-accent">
            {fmtDuration(remaining)}
          </div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">remaining</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button size="lg" onClick={() => setRunning((r) => !r)} className="gap-2">
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? "Pause" : "Start"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setRemaining(target)}>
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button size="lg" variant="destructive" onClick={stopEarly} disabled={remaining === target}>
          <Square className="h-5 w-5" /> Stop & Save
        </Button>
      </div>
    </div>
  );
}

function TimerPage() {
  const [subject, setSubject] = useState<SubjectKey>("Physics");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Study Timer</h1>
        <p className="text-sm text-muted-foreground">
          Tag your subject, then lock in. Every session is logged automatically.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Studying now</p>
        <SubjectPicker value={subject} onChange={setSubject} />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <Tabs defaultValue="countdown">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="countdown">Countdown</TabsTrigger>
            <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
          </TabsList>
          <TabsContent value="countdown">
            <CountdownTimer subject={subject} />
          </TabsContent>
          <TabsContent value="stopwatch">
            <Stopwatch subject={subject} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
