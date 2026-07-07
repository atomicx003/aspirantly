import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EXAMS, timeLeft, fmtHours } from "@/lib/config";
import {
  fetchSessions,
  computeStreak,
  todaySeconds,
  totalSeconds,
} from "@/lib/study";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Clock, TrendingUp, Timer as TimerIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Countdown({ label, date }: { label: string; date: string }) {
  const [t, setT] = useState(() => timeLeft(date));
  useEffect(() => {
    const i = setInterval(() => setT(timeLeft(date)), 1000);
    return () => clearInterval(i);
  }, [date]);
  const cells = [
    { v: t.days, l: "Days" },
    { v: t.hours, l: "Hrs" },
    { v: t.minutes, l: "Min" },
    { v: t.seconds, l: "Sec" },
  ];
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {cells.map((c) => (
          <div key={c.l} className="rounded-xl bg-secondary py-3 text-center">
            <div className="text-2xl font-black tabular-nums text-primary sm:text-3xl">
              {String(c.v).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {c.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      return p;
    },
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const streak = computeStreak(sessions);
  const today = todaySeconds(sessions);
  const total = totalSeconds(sessions);
  const goalPct = Math.min(100, (today / (2 * 3600)) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">
          Hey {profile?.display_name ?? "Aspirant"} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Every focused hour compounds. Let's make today count.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Flame}
          color="var(--streak)"
          label="Study Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          hint="≥ 2h keeps it alive"
        />
        <StatCard
          icon={Clock}
          color="var(--timer)"
          label="Today"
          value={`${fmtHours(today)} h`}
          hint={`Goal 2h · ${Math.round(goalPct)}%`}
        />
        <StatCard
          icon={TrendingUp}
          color="var(--success)"
          label="Total Logged"
          value={`${fmtHours(total)} h`}
          hint={`${sessions.length} sessions`}
        />
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Today's 2-hour goal</p>
          <span className="text-sm text-muted-foreground">{fmtHours(today)} / 2.0 h</span>
        </div>
        <Progress value={goalPct} className="mt-3 h-3" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {EXAMS.map((e) => (
          <Countdown key={e.key} label={e.label} date={e.date} />
        ))}
      </div>

      <Link to="/timer">
        <Button size="lg" className="w-full gap-2 sm:w-auto">
          <TimerIcon className="h-4 w-4" /> Start a study session{" "}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  hint,
}: {
  icon: typeof Flame;
  color: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${color} 15%, transparent)`,
            color,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
