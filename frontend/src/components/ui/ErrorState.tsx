import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  variant?: "default" | "card";
  className?: string;
}

/**
 * ErrorState - Componente consistente de estado de erro
 * Pode ser usado inline ou dentro de um Card
 */
export function ErrorState({
  title = "Ocorreu um erro",
  message,
  onRetry,
  retryText = "Tentar novamente",
  variant = "default",
  className,
}: ErrorStateProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center gap-4 p-6", className)}>
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          {retryText}
        </Button>
      )}
    </div>
  );

  if (variant === "card") {
    return <Card className="border-destructive/30 bg-destructive/5">{content}</Card>;
  }

  return content;
}
