import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Timer,
  BarChart3,
  Trophy,
  BookOpen,
  Library,
  CalendarDays,
  Target,
  ListChecks,
  MessageCircleQuestion,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { applyTheme, loadStoredTheme, storeTheme } from "@/lib/theme";
import logo from "@/assets/aspirantly-logo.png.asset.json";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timer", label: "Study Timer", icon: Timer },
  { to: "/syllabus", label: "Syllabus", icon: BookOpen },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/mocks", label: "Mock Tests", icon: Target },
  { to: "/tasks", label: "Tasks & Notes", icon: ListChecks },
  { to: "/doubts", label: "Doubts", icon: MessageCircleQuestion },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      const email = u.user.email?.toLowerCase() ?? null;
      return {
        profile: p,
        email: u.user.email,
        isAdmin: !!email && ADMIN_EMAILS.includes(email),
      };
    },
  });

  const profileTheme = profile?.profile?.theme;
  useEffect(() => {
    if (profileTheme && profileTheme !== loadStoredTheme()) {
      storeTheme(profileTheme);
    } else {
      applyTheme(loadStoredTheme());
    }
  }, [profileTheme]);



  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav: NavItem[] = [...NAV];
  if (profile?.isAdmin) nav.push({ to: "/admin", label: "Admin", icon: Shield });

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 font-black">
        <img src={logo.url} alt="Aspirantly logo" className="h-9 w-9 rounded-xl object-cover" />
        <span>Aspirantly</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to as string}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--glow-cyan)]"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn("h-4.5 w-4.5", active && "text-primary")}
                style={{ width: 18, height: 18 }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/20 text-sm font-bold text-accent">
            {(profile?.profile?.display_name ?? "A").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {profile?.profile?.display_name ?? "Aspirant"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="mt-1 w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        {SidebarInner}
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 font-black">
          <img src={logo.url} alt="Aspirantly logo" className="h-8 w-8 rounded-lg object-cover" />
          Aspirantly
        </div>
        <Button size="icon" variant="ghost" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar">
            <div className="flex justify-end p-3">
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {SidebarInner}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
