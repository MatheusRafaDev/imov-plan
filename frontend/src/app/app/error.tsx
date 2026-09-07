"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("ErrorBoundary pegou o erro:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-4">
      <Card className="max-w-md p-8 text-center shadow-lg border-border/50">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          Serviço indisponível no momento
        </h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Não conseguimos carregar as informações do seu plano porque o servidor demorou a responder ou está offline. 
          Para proteger seus dados, o carregamento foi interrompido.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </div>
      </Card>
    </div>
  );
}
