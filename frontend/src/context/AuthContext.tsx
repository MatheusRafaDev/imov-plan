"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { usePlanStore } from "@/store/usePlanStore";

type User = {
  id: string;
  email: string;
  name: string;
  dataNascimento: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, name: string, dataNascimento?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (token: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string; provider?: string }>;
  validateResetToken: (token: string) => Promise<{ valid: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: () => boolean;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resetPlan = usePlanStore((state) => state.reset);

  const dispatchAuthEvent = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("imovplan:auth-changed"));
    }
  };

  const clearAllData = () => {
    setUser(null);
    resetPlan();
    const allCookies = Cookies.get();
    const cookieKeysToRemove = ["user"];
    for (const cookieName in allCookies) {
      if (cookieKeysToRemove.includes(cookieName) || cookieName.startsWith("imovplan_")) {
        Cookies.remove(cookieName);
        Cookies.remove(cookieName, { path: "/" });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = async (email: string, password: string, name: string, dataNascimento?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", { email, password, name, dataNascimento });
      const { user: userData } = response.data;
      setUser(userData);
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });

      dispatchAuthEvent();
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
      dispatchAuthEvent();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Email ou senha inválidos";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/google", { token });
      const { user: userData } = response.data;
      setUser(userData);
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });
      
      dispatchAuthEvent();
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro ao fazer login com Google";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro ao solicitar recuperação de senha";
      const provider = err.response?.data?.provider as string | undefined;
      setError(errorMsg);
      return { success: false, error: errorMsg, provider };
    } finally {
      setLoading(false);
    }
  };

  const validateResetToken = async (token: string) => {
    try {
      await api.get(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
      return { valid: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Link de recuperação inválido ou expirado.";
      return { valid: false, error: errorMsg };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Token inválido ou expirado.";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    // Limpa a sessão local IMEDIATAMENTE para a tela não ficar travada aguardando o backend
    clearAllData();
    dispatchAuthEvent();
    
    try {
      // Envia requisição em background, o navegador tentará concluir antes do redirecionamento
      api.post("/auth/logout").catch(() => {});
    } catch {
      // Ignora erros
    }

    if (typeof window !== "undefined") {
      window.location.href = "/";
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
    <AuthContext.Provider value={{ user, loading, error, register, login, loginWithGoogle, forgotPassword, validateResetToken, resetPassword, logout, deleteAccount, isAuthenticated, updateUser }}>
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

