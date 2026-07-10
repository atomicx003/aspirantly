import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: true,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        throw redirect({ to: "/auth" });
      }
      return { user: data.user };
    } catch (err) {
      // If auth fails, redirect to login
      if (err instanceof Error && err.message.includes("redirect")) throw err;
      throw redirect({ to: "/auth" });
    }
  },
  component: AppShell,
});
