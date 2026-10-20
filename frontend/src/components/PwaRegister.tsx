"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // Só registra em produção — em dev o hot-reload conflita com o SW
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Nova versão disponível — pode exibir um toast se quiser
              console.info("[PWA] Nova versão disponível. Recarregue para atualizar.");
            }
          });
        });

        console.info("[PWA] Service Worker registrado:", registration.scope);
      } catch (err) {
        console.error("[PWA] Falha ao registrar Service Worker:", err);
      }
    };

    let refreshing = false;
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Aguarda o load para não competir com recursos críticos da página
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
