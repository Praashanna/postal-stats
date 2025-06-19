import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthContextType } from "@/types";
import { useLogin, useLogout, useCurrentUser } from "@/lib/queries";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem("postalToken");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("postalToken");
    
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthState();
      return;
    }

    if (user) {
      setIsAuthenticated(true);
    } else if (userError) {
      clearAuthState();
    }
  }, [user, userError]);

  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      setIsAuthenticated(true);
    } catch (error) {
      clearAuthState();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthState();
    }
  };

  const isLoading = userLoading || loginMutation.isPending || logoutMutation.isPending;

  const value = {
    isAuthenticated,
    isLoading,
    user: user || null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}