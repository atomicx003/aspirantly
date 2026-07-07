import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtHours } from "@/lib/config";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  component: Leaderboard,
});

interface Row {
  user_id: string;
  display_name: string;
  total_seconds: number;
}

const RANK_STYLE = [
  { icon: Crown, color: "var(--streak)", label: "Gold" },
  { icon: Medal, color: "oklch(0.8 0.02 250)", label: "Silver" },
  { icon: Medal, color: "var(--chemistry)", label: "Bronze" },
];

function Leaderboard() {
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { period });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: myId } = useQuery({
    queryKey: ["myid"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-[color:var(--streak)]" style={{ color: "var(--streak)" }} />
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Nationwide ranks by total study hours.
          </p>
        </div>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading ranks…</p>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No study logged in this period yet. Be the first!
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => {
            const top = i < 3 ? RANK_STYLE[i] : null;
            const isMe = r.user_id === myId;
            return (
              <div
                key={r.user_id}
                className={cn(
                  "glass-card flex items-center gap-4 rounded-2xl px-4 py-3",
                  isMe && "ring-2 ring-primary",
                )}
              >
                <div className="w-8 text-center">
                  {top ? (
                    <top.icon className="mx-auto h-6 w-6" style={{ color: top.color }} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/20 font-bold text-accent"
                >
                  {r.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {r.display_name} {isMe && <span className="text-primary">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {top ? `${top.label} rank` : "Aspirant"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black tabular-nums text-primary">
                    {fmtHours(r.total_seconds)}
                  </p>
                  <p className="text-xs text-muted-foreground">hours</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
