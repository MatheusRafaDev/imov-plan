"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import api from "@/lib/api";
import Cookies from "js-cookie";

type User = {
  id: string;
  email: string;
  name: string;
  dataNascimento: string | null;
  estadoCivil: string;
  rendaMensal: number;
  regimeTrabalho: string;
  saldoFgts: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, name: string, dataNascimento?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: () => boolean;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = Cookies.get("token");
      const storedUser = Cookies.get("user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
      }
      setLoading(false);
    }
  }, []);

  const register = async (email: string, password: string, name: string, dataNascimento?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", { email, password, name, dataNascimento });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      Cookies.set("token", newToken, { expires: 7 }); // 7 days
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });
      api.defaults.headers.Authorization = `Bearer ${newToken}`;
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
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      Cookies.set("token", newToken, { expires: 7 });
      Cookies.set("user", JSON.stringify(userData), { expires: 7 });
      api.defaults.headers.Authorization = `Bearer ${newToken}`;
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Email ou senha inválidos";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove("token");
    Cookies.remove("user");
    delete api.defaults.headers.Authorization;
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
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
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, isAuthenticated, updateUser }}>
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

