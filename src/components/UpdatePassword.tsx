import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      window.location.href = "/"; // Redirect home after success
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <h2 className="text-xl font-bold">Set New Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-green-600 text-white p-2 rounded"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
};
