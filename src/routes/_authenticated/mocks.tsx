import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mocks")({
  component: Mocks,
});

interface Mock {
  id: string;
  name: string;
  test_date: string;
  marks_obtained: number;
  total_marks: number;
}

function Mocks() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState("");
  const [total, setTotal] = useState("300");

  const { data: mocks = [] } = useQuery({
    queryKey: ["mocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .order("test_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Mock[];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const mo = Number(marks);
    const tm = Number(total);
    if (!name.trim() || !tm || mo < 0 || mo > tm) {
      toast.error("Check your inputs (marks can't exceed total).");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("mock_tests").insert({
      user_id: u.user.id,
      name: name.trim(),
      test_date: date,
      marks_obtained: mo,
      total_marks: tm,
    });
    if (error) return toast.error("Could not save test");
    toast.success("Mock logged!");
    setName("");
    setMarks("");
    qc.invalidateQueries({ queryKey: ["mocks"] });
  }

  async function remove(id: string) {
    await supabase.from("mock_tests").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["mocks"] });
  }

  const chartData = mocks.map((m) => ({
    name: m.name.length > 10 ? m.name.slice(0, 10) + "…" : m.name,
    pct: +((m.marks_obtained / m.total_marks) * 100).toFixed(1),
  }));

  const avg =
    chartData.length > 0
      ? (chartData.reduce((a, d) => a + d.pct, 0) / chartData.length).toFixed(1)
      : "0";
  const best = chartData.length ? Math.max(...chartData.map((d) => d.pct)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Mock Test Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Log every mock and watch your trajectory climb.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Average score</p>
          <p className="text-3xl font-black text-primary">{avg}%</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Best score</p>
          <p className="text-3xl font-black text-[color:var(--success)]" style={{ color: "var(--success)" }}>
            {best}%
          </p>
        </div>
      </div>

      <form onSubmit={add} className="glass-card grid gap-3 rounded-2xl p-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Test name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Syllabus Test 01" />
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Marks</Label>
            <Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="245" />
          </div>
          <div className="space-y-1.5">
            <Label>Total</Label>
            <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
        </div>
        <Button type="submit" className="sm:col-span-2">
          Add test
        </Button>
      </form>

      <div className="glass-card rounded-2xl p-5">
        <p className="mb-4 text-sm font-semibold">Score trajectory</p>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No tests logged yet.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--accent)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {mocks.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <p className="mb-3 text-sm font-semibold">History</p>
          <div className="space-y-2">
            {[...mocks].reverse().map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.test_date}</p>
                </div>
                <span className="font-semibold">
                  {m.marks_obtained}/{m.total_marks}
                </span>
                <span className="w-14 text-right font-black text-primary">
                  {((m.marks_obtained / m.total_marks) * 100).toFixed(0)}%
                </span>
                <Button size="icon" variant="ghost" onClick={() => remove(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
