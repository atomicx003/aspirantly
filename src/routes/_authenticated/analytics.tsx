import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSessions, type StudySession } from "@/lib/study";
import { SUBJECT_ORDER, SUBJECT_META } from "@/lib/syllabus";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: Analytics,
});

type Range = "day" | "week" | "month";

function buildBuckets(sessions: StudySession[], range: Range) {
  const now = new Date();
  const buckets: { label: string; hours: number }[] = [];
  if (range === "day") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const secs = sessions
        .filter((s) => s.studied_on === key)
        .reduce((a, s) => a + s.duration_seconds, 0);
      buckets.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        hours: +(secs / 3600).toFixed(2),
      });
    }
  } else if (range === "week") {
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7 - 6);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const secs = sessions
        .filter((s) => {
          const d = new Date(s.studied_on);
          return d >= stripTime(start) && d <= end;
        })
        .reduce((a, s) => a + s.duration_seconds, 0);
      buckets.push({ label: `W-${i}`, hours: +(secs / 3600).toFixed(2) });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const secs = sessions
        .filter((s) => s.studied_on.slice(0, 7) === key)
        .reduce((a, s) => a + s.duration_seconds, 0);
      buckets.push({
        label: d.toLocaleDateString(undefined, { month: "short" }),
        hours: +(secs / 3600).toFixed(2),
      });
    }
  }
  return buckets;
}

function stripTime(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Analytics() {
  const [range, setRange] = useState<Range>("day");
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const buckets = useMemo(() => buildBuckets(sessions, range), [sessions, range]);

  const pieData = useMemo(() => {
    return SUBJECT_ORDER.map((s) => ({
      name: s,
      value: +(
        sessions
          .filter((x) => x.subject === s)
          .reduce((a, x) => a + x.duration_seconds, 0) / 3600
      ).toFixed(2),
      color: SUBJECT_META[s].color,
    })).filter((d) => d.value > 0);
  }, [sessions]);

  const totalH = pieData.reduce((a, d) => a + d.value, 0);
  const neglected = pieData
    .filter((d) => totalH > 0 && d.value / totalH < 0.12)
    .map((d) => d.name);
  const missing = SUBJECT_ORDER.filter((s) => !pieData.some((d) => d.name === s));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Understand your effort and keep every subject balanced.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Study duration</p>
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="day">Daily</TabsTrigger>
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} unit="h" />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
                cursor={{ fill: "var(--secondary)" }}
              />
              <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="mb-4 text-sm font-semibold">Subject-wise distribution</p>
        {pieData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No study data yet — start a timer to see your balance.
          </p>
        ) : (
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    formatter={(v: number) => [`${v} h`, "Studied"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: d.color }}
                    />
                    {d.name}
                  </span>
                  <span className="font-semibold">
                    {d.value} h ({totalH ? Math.round((d.value / totalH) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(neglected.length > 0 || missing.length > 0) && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p>
              You're neglecting{" "}
              <span className="font-semibold">
                {[...missing, ...neglected].join(", ")}
              </span>
              . Balance your prep to avoid weak spots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
