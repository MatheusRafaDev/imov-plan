"use client";

import { useEffect } from "react";
import api from "@/lib/api";

export function KeepAliveFrontend() {
  useEffect(() => {
    const doPing = () => {
      api.get("/health").catch(() => {});
    };

    // Ping inicial e intervalo a cada 1 minuto
    doPing();
    const interval = setInterval(doPing, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

