import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Timer,
  Trophy,
  BarChart3,
  BookOpen,
  Target,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  { icon: Timer, title: "Focus Timer", desc: "Pomodoro, 50-min blocks & custom, tagged by subject." },
  { icon: Flame, title: "Daily Streaks", desc: "Log 2h/day to keep your flame alive." },
  { icon: Trophy, title: "Live Leaderboard", desc: "Rank nationwide by weekly study hours." },
  { icon: BarChart3, title: "Deep Analytics", desc: "Subject balance & study-time trends." },
  { icon: BookOpen, title: "Syllabus Tracker", desc: "Full 11th & 12th chapters, dual checkboxes." },
  { icon: Target, title: "Mock Analyzer", desc: "Plot every mock score trajectory." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 font-black tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            R
          </span>
          <span className="text-lg">RankUp</span>
        </div>
        <Link to="/auth">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-20 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{ background: "var(--gradient-hero)" }}
        />
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-[oklch(var(--streak))]" /> Built for JEE & NEET
          aspirants
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
          Your{" "}
          <span className="text-primary text-glow">distraction-free</span> exam
          command center.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Track study time, master the syllabus, analyze mocks and outrank
          aspirants across the country — all in one sleek dark workspace.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="gap-2">
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              Go to dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass-card rounded-2xl p-6 transition-transform hover:-translate-y-1"
          >
            <f.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
