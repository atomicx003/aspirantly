import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Assuming you are using Sonner for toasts

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://aspirantly.vercel.app/update-password',
});
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for the reset code!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleResetRequest} className="space-y-4">
      <h2 className="text-xl font-bold">Reset Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        {loading ? "Sending..." : "Send Reset Code"}
      </button>
    </form>
  );
};
