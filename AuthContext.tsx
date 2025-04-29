// before: you only jwtDecode()’d and set email
// after: call GET /me → { ssn,name,email,salary,role }

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

type Role = "manager" | "barista";
interface MeResp {
  ssn: string;
  name: string;
  email: string;
  salary: number;
  role: Role;
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

  // on mount, try to restore from localStorage + fetch /me
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
        // bad/expired token
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
      });
  }, []);

  const login = async (username: string, password: string) => {
    const res: TokenResponse = await apiLogin(username, password);
    const t = res.access_token;
    localStorage.setItem("token", t);
    api.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    // now fetch current user
    const { data } = await api.get<MeResp>("/me");
    setToken(t);
    setUser(data);
    router.push("/");
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
