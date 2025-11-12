import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, History, LogIn } from "lucide-react";
import { toast } from "sonner";

export const NavLink = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado");
    navigate("/");
  };

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
        <LogIn className="h-4 w-4 mr-2" />
        Entrar
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {location.pathname !== "/history" && (
        <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
          <History className="h-4 w-4 mr-2" />
          Histórico
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
};
