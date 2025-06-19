import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { MailOpen } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <MailOpen className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <h1 className="text-2xl font-semibold">Loading Postal Stats...</h1>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
