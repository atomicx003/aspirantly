import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, loadStoredTheme, storeTheme } from "@/lib/theme";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check, Palette, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [targetExam, setTargetExam] = useState("JEE");
  const [theme, setTheme] = useState(loadStoredTheme());
  const [saving, setSaving] = useState(false);

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
      return { profile: p, email: u.user.email };
    },
  });

  useEffect(() => {
    if (profile?.profile) {
      setDisplayName(profile.profile.display_name ?? "");
      setTargetExam(profile.profile.target_exam ?? "JEE");
      if (profile.profile.theme) setTheme(profile.profile.theme);
    }
  }, [profile]);

  function pickTheme(key: string) {
    setTheme(key);
    storeTheme(key); // immediate + persisted locally
  }

  async function save() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const name = displayName.trim();
    if (!name) return toast.error("Display name cannot be empty");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name, target_exam: targetExam, theme })
      .eq("id", u.user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    storeTheme(theme);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Personalize your profile and app appearance.
        </p>
      </div>

      <section className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Profile</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Target exam</Label>
            <Select value={targetExam} onValueChange={setTargetExam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JEE">JEE</SelectItem>
                <SelectItem value="NEET">NEET</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{profile?.email}</p>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Accent theme</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEMES.map((t) => {
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => pickTheme(t.key)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50",
                )}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                  style={{ background: t.swatch }}
                >
                  {active && <Check className="h-4 w-4 text-white" />}
                </span>
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Changes apply instantly. Save to sync across your devices.
        </p>
      </section>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
