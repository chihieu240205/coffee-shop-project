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

// this is exactly what /me returns
export interface MeResp {
  ssn: string;
  name: string;
  email: string;
  salary: number;
  role: "manager" | "barista";
}

interface AuthContextType {
  token: string | null;
  user: MeResp | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeResp | null>(null);
  const router = useRouter();

  // on mount, restore token + fetch /me
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    api
      .get<MeResp>("/me")
      .then(({ data }) => {
        setToken(t);
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
      });
  }, []);

  const login = async (username: string, password: string) => {
    // 1) get JWT
    const { access_token } = await apiLogin(username, password);
    localStorage.setItem("token", access_token);
    api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

    // 2) fetch /me to populate user and decide routing
    const { data: me } = await api.get<MeResp>("/me");
    setToken(access_token);
    setUser(me);

    // 3) route based on role
    if (me.role === "manager") {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
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
      value={{
        token,
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
