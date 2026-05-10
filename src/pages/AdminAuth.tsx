import { useState } from "react";
import { Shield, Lock, ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthProps {
  onAuthenticated: () => void;
}

const AdminAuth = ({ onAuthenticated }: AdminAuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast.error("Invalid email or password");
        setPassword("");
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Authentication failed");
        setIsLoading(false);
        return;
      }

      // Try multiple ways to verify admin access
      let isAdmin = false;

      // Method 1: Check via has_role RPC function
      try {
        const { data: hasAdminRole } = await supabase
          .rpc('has_role', { _user_id: authData.user.id, _role: 'admin' });
        if (hasAdminRole) isAdmin = true;
      } catch (_) {}

      // Method 2: Check user_roles table directly
      if (!isAdmin) {
        try {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", authData.user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (roleData) isAdmin = true;
        } catch (_) {}
      }

      if (isAdmin) {
        toast.success("Welcome to Admin Panel");
        onAuthenticated();
        setIsLoading(false);
        return;
      }

      toast.error("Access denied. Admin privileges required.");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Admin auth error:", error);
      toast.error("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Shield size={40} className="text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Admin Panel
            </h2>
            <p className="text-muted-foreground mb-8">
              Enter admin credentials to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full pl-12 pr-4 py-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-4 py-4 bg-secondary rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-4 bg-gradient-gold rounded-xl font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Verifying..." : "Access Admin Panel"}
              </button>
            </form>

            <p className="mt-6 text-xs text-muted-foreground">
              Unauthorized access is prohibited
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
