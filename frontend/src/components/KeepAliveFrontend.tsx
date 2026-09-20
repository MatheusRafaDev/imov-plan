"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Activity } from "lucide-react";

export function KeepAliveFrontend() {
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [status, setStatus] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    const doPing = () => {
      setStatus("loading");
      api.get("/health")
        .then(() => {
          setStatus("ok");
          setLastPing(new Date());
        })
        .catch(() => {
          setStatus("error");
          setLastPing(new Date());
        });
    };

    // Fazer um ping inicial
    doPing();

    // Disparar a cada 1 minuto (60.000 ms)
    const interval = setInterval(doPing, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!lastPing) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[10px] font-medium shadow-soft border border-border/50 backdrop-blur-sm pointer-events-none opacity-80">
      <Activity 
        className={`w-3 h-3 ${status === "ok" ? "text-success animate-pulse" : status === "loading" ? "text-muted-foreground animate-spin" : "text-destructive"}`} 
      />
      <span className={status === "ok" ? "text-success" : status === "loading" ? "text-muted-foreground" : "text-destructive"}>
        {status === "ok" ? "API Online" : status === "loading" ? "Pinging..." : "API Offline"}
      </span>
      <span className="text-muted-foreground ml-1 hidden sm:inline">
        (Last: {lastPing.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
      </span>
    </div>
  );
}
