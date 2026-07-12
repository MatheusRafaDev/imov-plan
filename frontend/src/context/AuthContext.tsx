"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import Cookies from "js-cookie";

type User = {
  id: string;
  email: string;
  name: string;
  dataNascimento: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, name: string, dataNascimento?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: () => boolean;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAllData = () => {
    setUser(null);
    const allCookies = Cookies.get();
    const cookieKeysToRemove = ["user", "imovplan_planoId"];
    for (const cookieName in allCookies) {
      if (cookieKeysToRemove.includes(cookieName) || cookieName.startsWith("imovplan_")) {
        Cookies.remove(cookieName);
        Cookies.remove(cookieName, { path: "/" });
      }
    }
    if (typeof window !== "undefined") {
      // Remove only app-specific keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key === "user" || key.startsWith("imovplan_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Likewise for sessionStorage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key) continue;
        if (key === "user" || key.startsWith("imovplan_")) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));
    }
  };

  useEffect(() => {
    async function initAuth() {
      if (typeof window === "undefined") return;

      const storedUser = Cookies.get("user");
      if (!storedUser) {
        // Sem cookie → garante limpeza e libera a tela imediatamente
        clearAllData();
        setLoading(false);
        return;
      }

      // 1. Renderização otimista: hidrata o estado imediatamente a partir do cookie
      //    → a UI já aparece sem esperar o round-trip ao banco
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        clearAllData();
        setLoading(false);
        return;
      }
      setLoading(false); // libera a tela antes da revalidação

      // 2. Revalidação em background: confirma com o banco se o token ainda é válido
      try {
        const parsedUser = JSON.parse(storedUser);
        const response = await api.get(`/usuario/${parsedUser.id}`);
        const dbUser = response.data;
        const updatedUser: User = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          dataNascimento: dbUser.dataNascimento,
        };
        setUser(updatedUser);
        Cookies.set("user", JSON.stringify(updatedUser), { expires: 7 });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          // Token expirado ou inválido → desloga
          clearAllData();
        }
        // Erros de rede (5xx, timeout) são não-fatais: mantém o usuário logado
      }
    }
    initAuth();
  }, []);

  const register = async (email: string, password: string, name: string, dataNascimento?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", { email, password, name, dataNascimento });
      const { user: userData } = response.data;
      setUser(userData);
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });

      // If they had a local guest plan, link it to their new account
      const localPlanoId = Cookies.get("imovplan_planoId");
      if (localPlanoId && !localPlanoId.startsWith("local-draft-")) {
        try {
          await api.post(`/plano/${localPlanoId}/link-user?usuarioId=${userData.id}`);
        } catch (e: any) {
          // If the plan does not exist (404), it's likely a new user without a prior draft.
          // Treat this as non-fatal and continue the registration flow.
          if (e?.response?.status === 404) {
            console.warn('Plano não encontrado ao vincular ao usuário; continuará sem vínculo.');
          } else {
            console.error('Falha ao vincular plano à conta', e);
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro ao registrar";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: userData } = response.data;
      setUser(userData);
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Email ou senha inválidos";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Erro no logout", e);
    }
    clearAllData();
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        // Needs import of UsuarioService, but we can just use api directly here to avoid circular dependencies if any, 
        // or just use api.delete
        await api.delete(`/usuario/${user.id}`);
      }
      clearAllData();
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro ao deletar conta";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      Cookies.set("user", JSON.stringify(updated), { expires: 7 });
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token: null, loading, error, register, login, logout, deleteAccount, isAuthenticated, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

