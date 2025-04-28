// contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { loginEmployee as apiLogin, TokenResponse } from "../services/auth";
import api from "../services/api";
import { useRouter } from "next/router";
import { jwtDecode } from "jwt-decode";

type Role = "manager" | "barista";

interface User {
  email: string;
  role: Role;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // on mount, try to restore from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      try {
        const { sub: email } = jwtDecode<{ sub: string }>(stored);
        setToken(stored);
        setUser({ email });
        api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
      } catch {
        // invalid token → clear it
        localStorage.removeItem("token");
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res: TokenResponse = await apiLogin(username, password);
    const newToken = res.access_token;
    localStorage.setItem("token", newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    const { sub: email } = jwtDecode<{ sub: string }>(newToken);
    setUser({ email });
    router.push("/"); // or your protected home
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
